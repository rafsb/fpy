"""
table_traits.py

This module defines the table_t class, which inherits from db_t and provides
various database operations for table-like structures. It includes methods for
bulk operations (insert, update, delete), query generation, and utility functions
for database management.

Key features:
- Bulk operations with progress tracking
- SQL query generation for insert and update operations
- Single record operations (save, delete)
- Table management (empty, reset identity, remove duplicates)
- Utility methods (distinct values, list all records)

Author: Rafael Bertolini
Date: 2024-09-10
R: 01
"""

import os
import re
import traceback

from interfaces.db import db_t
from utils.gauge import gauge
from utils.log import log


# Number of records to process in each batch operation
DB_OPERATION_PACE = os.getenv("DB_OPERATION_PACE", 512)


# View class, inheriting from db_t
class view_t(db_t):
    _bl = ['id']


# Table class, inheriting from db_t
class table_t(db_t):

    id = -1

    # Default key columns
    _kc = ['id']

    # Default blacklisted columns
    _bl = []

    def bulk_insert(self, rows=[]):
        """
        Perform a bulk insert operation for multiple rows.
        """
        res = 0
        class_type = type(self)
        classname = class_type.__name__.lower()
        columns = [x for x in self.columns() if x not in self.blacklisted()]
        if len(columns) == 0: columns = rows[0].keys()
        items = []
        for item in rows:
            tmp = []
            for k in columns:
                v = getattr(item, k, None)
                if v is None:
                    v = getattr(item, k.upper(), None)
                tmp.append(re.sub(r"\s+|'|\"", ' ', str(v).strip()) if v is not None else None)
            items.append(tmp)

        sql_cols = '[' + ('],['.join(columns)) + ']'

        sql = r"INSERT INTO [%s].[%s].[%s] (%s) VALUES " % (self._Database, self._Schema, classname, sql_cols)

        try:
            self.connect()
            size = len(items)
            i = 1
            gauge(0, suffix=f'[{classname.upper()}] {i}/{size} - added')
            while len(items):
                subset = items[:DB_OPERATION_PACE]
                try:
                    res = self._Cursor.execute(sql + "(" + ("),(".join(map(lambda p: ",".join(map(lambda q: f"'{str(q)}'" if q is not None else 'NULL', p)), subset))) + ")").rowcount
                except:
                    log.warn(f"[{classname.upper()}] failed bulk_insert for {len(subset)} rows, trying one-by-one.")
                    for set in subset:
                        tmp = sql + "(" + (",".join(map(lambda q: f"'{str(q)}'" if q is not None else 'NULL', set))) + ")"
                        try: self._Cursor.execute(tmp)
                        except: log.error(tmp + '\n' + traceback.format_exc())
                gauge(i / size, suffix=f'[{classname.upper()}] {i}/{size} - added')
                items = items[DB_OPERATION_PACE:]
                i += DB_OPERATION_PACE
            gauge(1, suffix=f'[{classname.upper()}] {size}/{size} - added')
        except:
            log.error(traceback.format_exc())

        self._Conn.close()
        return res

    def bulk_update(self, rows=[]):
        """
        Perform a bulk update operation for multiple rows.
        """
        res = 0
        classname = type(self).__name__.lower()
        try:
            self.connect()
            i = 0
            size = len(rows)
            gauge(0, suffix=f'[{classname.upper()}] {i}/{size} - updated')
            while len(rows):
                sqls = []
                subset = rows[:DB_OPERATION_PACE]
                for item in subset:
                    sql = f"UPDATE [{self._Database}].[{self._Schema}].[{classname}] SET "
                    for k in list(vars(item)):
                        if k not in ['id'] + self.blacklisted(): sql += f"[{k}]='{re.sub(r"['`]+", " ", str(getattr(item, k)))}',"
                    sql = f"{sql[:-1]} WHERE "
                    for k in item._kc:
                        sql += f"[{k}]="
                        v = getattr(item, k, None)
                        if v is None: sql = sql[:-1] + " IS NULL"
                        elif type(v) in [float, int]: sql += str(v)
                        else: sql += f"'{re.sub(r"['`]+", " ", str(v))}'"
                        sql += " AND "
                    sqls.append(sql[:-5])

                tmp_count = 0

                try: tmp_count = self._Cursor.execute(";".join(sqls)).rowcount
                except: pass

                if tmp_count == 0:
                    for sql in sqls:
                        try: tmp_count += self._Cursor.execute(sql).rowcount
                        except: log.error(re.sub(r"\s+", " ", sql).strip() + '\n' + traceback.format_exc())

                res += tmp_count

                gauge(i / size, suffix=f'[{classname.upper()}] {i}/{size} - updated')
                rows = rows[DB_OPERATION_PACE:]
                i += DB_OPERATION_PACE
            gauge(1, suffix=f'[{classname.upper()}] {size}/{size} - updated')
        except:
            log.error(traceback.format_exc())

        self._Conn.close()
        return res

    def bulk_del(self, rows=[]):
        """
        Perform a bulk delete operation for multiple rows.
        """
        classname = type(self).__name__.lower()
        if not rows or not len(rows): return 0
        rows = [i for i in rows if i is not None]
        res = 0
        i = 0
        size = len(rows)
        gauge(0, suffix=f'[{classname.upper()}] {i}/{size} - deleted')
        try:
            self.connect()
            while len(rows):
                for item in rows[:DB_OPERATION_PACE]:
                    sql = f'DELETE FROM [{self._Database}].[{self._Schema}].[{classname}] WHERE '
                    for k in item._kc:
                        sql += f"[{k}]="
                        v = getattr(item, k, None)
                        if v is None: sql = sql[:-1] + " IN (NULL, '')"
                        elif type(v) in [float, int]: sql += str(v)
                        else: sql += f"'{str(v)}'"
                        sql += " AND "
                    try: res += self._Cursor.execute(sql[:-4]).rowcount
                    except: log.error(sql[:-5])
                    gauge(i / size, suffix=f'[{classname.upper()}] {i}/{size} - deleted')
                    rows = rows[DB_OPERATION_PACE:]
                i += DB_OPERATION_PACE
            gauge(1, suffix=f'[{classname.upper()}] {size}/{size} - deleted')
        except:
            log.error(traceback.format_exc())
        self._Conn.commit()
        self._Conn.close()
        return res

    def update_query(self):
        """
        Generate an SQL UPDATE query for the current object.
        """
        sql_cols = ""
        vals = []
        attrs = self.attrs()
        for col, val in attrs.items():
            if col in ['id'] + self.blacklisted() + self.key_columns():
                continue
            sql_cols += f"[{col}]=?,"
            vals.append(val if val else None)
        sql_cols = sql_cols[:-1]  # Remove the extra ','
        sql = f"UPDATE [{self._Database}].[{self._Schema}].[{type(self).__name__.lower()}] SET {sql_cols} WHERE "
        if self.id > 0:
            sql += "[id]=?"
            vals.append(self.id)
        else:
            for k in self.key_columns():
                v = getattr(self, k, None)
                if v is None:
                    sql += f"[{k}] IS NULL AND "
                else:
                    sql += f"[{k}]=? AND "
                    vals.append(v)
            sql = sql[:-5].strip()  # Remove the extra ' AND '
        return sql, vals

    def insert_query(self):
        """
        Generate an SQL INSERT query for the current object.
        """
        sql_cols = ""
        sql_vals = ""
        vals = []

        attrs = self.attrs()

        for col, val in attrs.items():
            if col.lower() == 'id': continue
            sql_cols += "[%s]," % col
            sql_vals += "?,"
            vals.append(val if val else None)

        sql_cols = sql_cols[:-1]
        sql_vals = sql_vals[:-1]

        return "INSERT INTO [%s].[%s].[%s](%s) VALUES (%s)" % (self._Database, self._Schema, type(self).__name__.lower(), sql_cols, sql_vals), vals

    def save(self):
        """
        Save the current object to the database (upsert).
        """
        self.connect()
        message = ''
        try:
            uquery, vals = self.update_query()
            res = self._Cursor.execute(uquery, *vals)
            rows_count = res.rowcount
            message = uquery + '\n' + str(vals)
        except:
            rows_count = 0

        if rows_count == 0:
            try:
                iquery, vals = self.insert_query()
                res = self._Cursor.execute(iquery, *vals)
                message = iquery + '\n' + str(vals)
            except:
                log.error(traceback.format_exc())
                res = None
        log.debug(message)
        return res

    def insert(self):
        """
        Save the current object to the database (upsert).
        """
        self.connect()
        message = ''

        try:
            iquery, vals = self.insert_query()
            res = self._Cursor.execute(iquery, *vals)
            message = iquery + '\n' + str(vals)
        except:
            log.error(traceback.format_exc())
            log.debug(iquery + '\n' + str(vals))
            res = None
        log.debug(message)
        return res

    def update(self):
        """
        Save the current object to the database (upsert).
        """
        self.connect()
        message = ''
        try:
            uquery, vals = self.update_query()
            res = self._Cursor.execute(uquery, *vals)
            message = uquery + '\n' + str(vals)
        except:
            log.error(traceback.format_exc())
            log.debug(uquery + '\n' + str(vals))
            res = None
        log.debug(message)
        return res.rowcount

    def delete(self):
        """
        Delete the current object from the database.
        """
        self.connect()
        try:
            keys = self.key_columns()
            if self.id > 0:  # Check for a valid id
                sql = f"DELETE FROM [{self._Database}].[{self._Schema}].[{type(self).__name__.lower()}] WHERE " + " AND ".join(list(map(lambda: "[?]='?'", keys)))
                attrs = list(map(lambda k: getattr(self, k), keys))
                log.debug(sql + ' ' + str(attrs))
                self._Cursor.execute(sql, *attrs)
                self._Conn.commit()
                return True
            else:
                log.warning(f"Attempted to delete record with invalid id: {self.id}")
                return False
        except:
            self._Conn.rollback()
            log.error(traceback.format_exc())
            return False
        finally:
            self._Conn.close()

    def drop(self):
        return self.delete()

    def empty(self):
        """
        Empty the entire table.
        """
        self.connect()
        sql = f"DELETE FROM {type(self).__name__.lower()}"
        self._Cursor.execute(sql)

    def reset_identity(self):
        """
        Reset the identity (auto-increment) column for the table.
        """
        self.connect()
        sql = f"DBCC CHECKIDENT ('{type(self).__name__.lower()}', RESEED, 0)"
        try:
            self._Cursor.execute(sql)
        except:
            log.error(traceback.format_exc())

    def rem_dups_by_id(self):
        """
        Remove duplicate records, keeping the one with the highest ID.
        """
        try:
            classname = type(self).__name__.lower()
            self.connect()
            return self._Cursor.execute(f"""
                DELETE FROM [{self._Database}].[{self._Schema}].[{classname}]
                WHERE [id] NOT IN (
                    SELECT * FROM (
                        SELECT MAX([id]) as id FROM [{self._Database}].[{self._Schema}].[{classname}] GROUP BY [{'],['.join(self.key_columns())}]
                    ) AS x
                )
            """).rowcount
        except:
            log.debug(f"Error removing duplicates on {type(self).__name__}")
            log.error(traceback.format_exc())

    def list(self):
        """
        Fetch all records from the table.
        """
        return self.fetch().rows

    def replace(self, **args):
        """
        Replace the current object with the provided values.
        """
        for k, v in args.items():
            setattr(self, k, v)
        return self


class table_t(table_t): pass


class view_t(view_t): pass

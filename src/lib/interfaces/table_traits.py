import os
import re
import traceback

from interfaces.db import db_t
from utils.gauge import gauge
from utils.log import log


DB_KEY              = os.getenv("DB_KEY")
DB_NAME             = os.getenv("DB_DATABASE")
VERBOSE             = int(os.getenv("VERBOSE", 0))
DB_OPERATION_PACE   = os.getenv("DB_OPERATION_PACE", 512)


class view_t(db_t) : pass


class table_t(db_t) :

    _kc = [ 'id' ]
    _bl = [ 'id' ]

    def bulk_insert(self, items):

        res = 0
        classname = type(self).__name__.lower()
        columns = [ x for x in self.columns() if x not in self.blacklisted() ]
        if len(columns) == 0: columns = items[0].keys()
        rows = []
        for item in items:
            tmp = []
            for k in columns:
                v = getattr(item, k, None)
                if v is None:
                    v = getattr(item, k.upper(), None)
                tmp.append(v)
            rows.append(tmp)

        sql = ""
        sql_cols = '[' + ('],['.join(columns)) + ']'

        sql = r"INSERT INTO [%s].[%s].[%s] (%s) VALUES " % (DB_NAME, DB_KEY, classname, sql_cols)

        try :
            self.connect()
            i = 1
            size = len(rows)
            gauge(0, '', f'[{classname.upper()}] {i}/{size} - added')
            while len(rows) :
                subset = rows[:DB_OPERATION_PACE]
                try: res = self._Cursor.execute(sql + "(" + ("),(".join(map(lambda p : ",".join(map(lambda q : f"'{str(q)}'" if q is not None else 'NULL', p)), subset))) + ")").rowcount
                except:
                    log.error(f"[{classname.upper()}] failed bulk_insert for {len(subset)} items, trying one-by-one.")
                    for set in subset:
                        try: self._Cursor.execute(sql + "(" + (",".join(map(lambda q : f"'{str(q)}'" if q is not None else 'NULL', set))) + ")")
                        except: log.error(sql + "('" + ("','".join(map(lambda q : str(q), set))) + "')")
                gauge(i / size, '', f'[{classname.upper()}] {i}/{size} - added')
                rows = rows[DB_OPERATION_PACE:]
                i += DB_OPERATION_PACE
            gauge(1, '', f'[{classname.upper()}] {size}/{size} - added')
        except:
            # self.conn.rollback()
            log.error(traceback.format_exc())

        self.conn.close()
        return res

    def bulk_update(self, items):
        res = 0
        classname = type(self).__name__.lower()
        try:
            self.connect()
            i = 0
            size = len(items)
            gauge(0, '', f'[{classname.upper()}] {i}/{size} - updated')
            while len(items) :
                sqls = []
                subset = items[:DB_OPERATION_PACE]
                for item in subset :
                    sql = f"UPDATE [{DB_NAME}].[{DB_KEY}].[{classname}] SET "
                    for k in list(vars(item)) :
                        if k not in ['id'] + self.blacklisted() : sql += f"[{k}]='{getattr(item, k)}',"
                    sql = f"{sql[:-1]} WHERE "
                    for k in item._kc:
                        sql += f"[{k}]="
                        v = getattr(item, k, None)
                        if v is None: sql += " IS NULL"
                        elif type(v) in [ float, int ]: sql += str(v)
                        else: sql += f"'{str(v)}'"
                        sql += " AND "
                    sqls.append(sql[:-5])
                try: res += self._Cursor.execute(";".join(sqls)).rowcount
                except :
                    for sql in sqls :
                        try: res += self._Cursor.execute(sql).rowcount
                        except: log.error('[FAILED] ' + re.sub(r"\s+", " ", sql).strip())
                gauge(i / size, '', f'[{classname.upper()}] {i}/{size} - updated')
                items = items[DB_OPERATION_PACE:]
                i += DB_OPERATION_PACE
            gauge(1, '', f'[{classname.upper()}] {size}/{size} - updated')
        except:
            # self.conn.rollback()
            log.error(traceback.format_exc())

        self.conn.close()
        return res

    def bulk_del(self, items=[]):
        classname = type(self).__name__.lower()
        if not items or not len(items): return 0
        items = [ i for i in items if i is not None ]
        res = 0
        i = 0
        size = len(items)
        gauge(0, '', f'[{classname.upper()}] {i}/{size} - deleted')
        try :
            self.connect()
            while len(items) :
                for item in items[:DB_OPERATION_PACE]:
                    sql = f'DELETE FROM [{DB_NAME}].[{DB_KEY}].[{classname}] WHERE '
                    for k in item._kc:
                        sql += f"[{k}]="
                        v = getattr(item, k, None)
                        if v is None: sql += " IS NULL"
                        elif type(v) in [ float, int ]: sql += str(v)
                        else: sql += f"'{str(v)}'"
                        sql += " OR "
                    res += self._Cursor.execute(sql[:-4]).rowcount
                    gauge(i / size, '', f'[{classname.upper()}] {i}/{size} - deleted')
                    items = items[DB_OPERATION_PACE:]
                i += DB_OPERATION_PACE
            gauge(1, '', f'[{classname.upper()}] {size}/{size} - deleted')
        except:
            # self.conn.rollback()
            log.error(traceback.format_exc())
        self.conn.commit()
        self.conn.close()
        return res

    def update_query(self):
        sql_cols = ""
        attrs = self.attrs()
        for col, val in attrs.items():
            if col in self.blacklisted() + [ 'id' ]: continue
            sql_cols += "[%s]='%s'," % (col, val)
        sql_cols = sql_cols[:-1]  # Remove the extra ','
        return "UPDATE [%s].[%s].[%s] SET %s WHERE [id]='%s'" % (DB_NAME, DB_KEY, type(self).__name__.lower(), sql_cols, self.id)

    def insert_query(self):
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

        return "INSERT INTO [%s].[%s].[%s](%s) VALUES (%s)" % (DB_NAME, DB_KEY, type(self).__name__.lower(), sql_cols, sql_vals), vals

    def save(self):
        res = None
        self.connect()
        if not getattr(self, 'id', None) or self.id == -1 :
            try: del self.id
            except: pass
            # res = self._Cursor.execute(r"SET NOCOUNT ON; DECLARE @NEWID TABLE(ID INT);" + self.insert_query() + r";SELECT ID FROM @NEWID")
            q, v = self.insert_query()
            log.info(message=q)
            try: res = self._Cursor.execute(q, v)
            except: log.error(traceback.format_exc())
        else :
            q = self.update_query()
            log.info(message=q)
            try: res = self._Cursor.execute(q)
            except: log.error(traceback.format_exc())
        return res, self

    def delete(self):
        self.connect()
        if self.id > 0:  # Check for a valid id
            sql = f"DELETE FROM {type(self).__name__.lower()} WHERE id=?"
            self._Cursor.execute(sql, self.id)

    def empty(self):
        self.connect()
        # if self.id > 0: # Check for a valid id
        sql = f"DELETE FROM {type(self).__name__.lower()}"
        self._Cursor.execute(sql)

    def reset_identity(self):
        self.connect()
        sql = f"DBCC CHECKIDENT ('{type(self).__name__.lower()}', RESEED, 0)"
        try: self._Cursor.execute(sql)
        except: log.error(traceback.format_exc())

    def rem_dups_by_id(self):
        try :
            classname = type(self).__name__.lower()
            self.connect()
            return self._Cursor.execute(f"""
                DELETE FROM [{DB_NAME}].[{DB_KEY}].[{classname}]
                WHERE [id] NOT IN (
                    SELECT * FROM (
                        SELECT MAX([id]) as id FROM [{DB_NAME}].[{DB_KEY}].[{classname}] GROUP BY [{'],['.join(self.key_columns())}]
                    ) AS x
                )
            """).rowcount
        except:
            print(f"Error removing duplicates on {type(self).__name__}")
            log.error(traceback.format_exc())

    def list(self):
        return self.fetch()

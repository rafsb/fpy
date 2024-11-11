import os
import re
import traceback
from hashlib import md5, sha256
from datetime import datetime, date
from models.mssql import MSSQL
from utils.log import log
from utils.basic_traits import ClassT, ResponseT, StaticCast
from utils.cache import memcache


DB_OPERATION_PACE = 512


class db_t(ClassT) :

    _Driver = MSSQL
    _Database = os.environ.get("DB_DATABASE")
    _Server = os.environ.get("DB_SERVER")
    _Key  = os.environ.get("DB_KEY")
    _Columns = None

    def columns(self):
        res = self._Columns  # memcache.get('INFORMATION_SCHEMA.COLUMNS')
        if res is None or len(res) == 0:
            sql = 'SELECT TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS'
            try: 
                res = self.connect()[0].execute(sql)
                res = [ col[1] for col in res if col[0].lower() == self.__class__.__name__.lower() ]
                # memcache.set(res, id='INFORMATION_SCHEMA.COLUMNS', expires=1)
                self._Columns = res
            except:
                log.error(traceback.format_exc())
        return res

    def keys(self):
        return self._kc

    def build_query(self, columns=None, filters=None, strict=True, offset=0, limit=-1):
        table_name = self.__class__.__name__
        conditions = []
        params = []

        if filters and len(filters.keys()):
            try:
                for column, value in filters.items():
                    if type(value) is list and len(value) == 1:
                        value = value[0]
                    if isinstance(value, tuple):
                        p, q, o = value if len(value) == 3 else (*value, None)
                        if q:
                            conditions.append(f"[s{table_name}].[{column}] {o or 'BETWEEN'} ? AND ?")
                            params.extend([p, q])
                        else:
                            conditions.append(f"[{table_name}].[{column}] {o or '='} ?")
                            params.append(p)
                    elif isinstance(value, list):
                        tmp_conditions = ''
                        placeholders = []
                        for v in value:
                            if v not in [None, '']:
                                placeholders.append('?')
                            else:
                                tmp_conditions = (f"[{table_name}].[{column}] IS NULL OR ")
                        conditions.append(f"({tmp_conditions}[{table_name}].[{column}] IN ({','.join(placeholders)}))")
                        params.extend([x for x in value if x not in [None, '']])
                    else:
                        # value = None if value == '' else value
                        if value is None:
                            conditions.append(f"[{table_name}].[{column}] IS NULL")
                        else:
                            conditions.append(f"[{table_name}].[{column}] = ?")
                            params.append(value)
            except:
                log.error(traceback.format_exc())

        columns = columns or self.columns()
        column_clause = "[" + "],[".join(columns) + "]" if columns else "*"

        sql = f"SELECT {column_clause} FROM [{self._Database}].[{self._Key}].[{table_name}]"

        if conditions:
            sql += " WHERE " + f" {'AND' if strict else 'OR'} ".join(conditions)

        sql += " ORDER BY (SELECT NULL) OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
        params.extend([offset or 0, limit or 100 if limit != -1 else 1000000])
        return sql, params

    def connect(self):
        if not self._Cursor:
            self.conn = self._Driver(tablename=type(self).__name__.lower()).connect()
            if self.conn: self._Cursor = self.conn.cursor()
        return self._Cursor, self.conn

    def execute(self, sql, vals_list=None):
        start_time = datetime.now()
        res = None
        # sql = re.sub(r'\s+', ' ', sql).strip()
        self.connect()
        column_names = []
        if self._Cursor:
            try:
                if vals_list: res = self._Cursor.execute(sql, *vals_list)
                else: res = self._Cursor.execute(sql)
                if getattr(self._Cursor, 'description'):
                    column_names = [ column[0].lower() for column in self._Cursor.description ]
                    res = list(map(lambda x : self.__class__(**dict(zip(column_names, x))), res))
                log.info(message="%s secs for %s // %s" % (datetime.now() - start_time, sql, ", ".join([str(x) for x in vals_list]) if vals_list is not None else ''))
            except:
                log.error(traceback.format_exc())
            return ResponseT(cols=column_names, rows=res)

    def query(self, sql, vals=None) :
        start_time = datetime.now()
        res = None
        sql = re.sub(r'\s+', ' ', sql).strip()
        self.connect()
        try:
            if vals : res = self._Cursor.execute(sql, *vals)
            else : res = self._Cursor.execute(sql)
        except: log.error(traceback.format_exc())
        log.info(message="%s secs for %s" % ((datetime.now() - start_time), sql))
        return res

    def fetch(self, columns=None, filters=None, strict=True, offset=None, limit=-1):
        """
        Fetches data from the database based on the specified columns and filters.

        Args:
            columns (list, optional): List of column names to fetch. Defaults to None, which fetches all columns.
            filters (dict, optional): Dictionary of filters to apply to the query. Defaults to None.
                Filters with None values are removed.
            strict (bool, optional): If True, applies strict filtering. Defaults to True.
            offset (int, optional): Number of rows to skip before starting to return rows. Defaults to None.
            limit (int, optional): Maximum number of rows to return. Defaults to None.

        Returns:
            list: Result set of the query execution.
        """
        if filters:
            for k, v in filters.items():
                if v is None: del filters[k]
        sql, params = self.build_query(columns=columns, filters=filters, strict=strict, offset=offset, limit=limit)
        log.debug(sql + " < %s" % params)
        return self.execute(sql, params)

    def row_key(self, char=';', encrypt=False):
        _k = []
        for k in self._kc: 
            v = getattr(self, k, '')
            if v in [None, 0, '', False]: v = ''
            _k.append("%s" % str(v).strip())
        tmp = char.join(_k)
        return encrypt and md5(tmp.encode('utf-8')).hexdigest() or tmp

    def row_hash(self, blacklist=None) :
        attrs = self.attrs(bl=blacklist)
        keys = sorted(self.columns())
        temp_str = []
        for key in keys:
            if key != "id" :
                val = attrs.get(key, '')
                if val in [None, 0, '', False]: val = ''
                if isinstance(val, str): temp_str.append("%s:%s" % (key, StaticCast.str(val, clear=True)))
                elif isinstance(val, int): temp_str.append("%s:%d" % (key, StaticCast.int(val)))
                elif isinstance(val, float): temp_str.append("%s:%d" % (key, StaticCast.float(val)))
                elif isinstance(val, date): temp_str.append("%s:%s" % (key, val.strftime(StaticCast.SHORT_DATE)))
                elif isinstance(val, datetime): temp_str.append("%s:%s" % (key, val.strftime(StaticCast.LONG_DATE)))
        temp_str = re.sub(r"\s+", "", '|'.join(temp_str)).strip()
        # return md5((''.join(temp_str)).encode('utf-8')).hexdigest()
        # return sha256((''.join(temp_str)).encode("utf-8")).hexdigest()
        return temp_str

    def key_columns(self, key_columns=None) :
        if key_columns : self._kc = key_columns
        return self._kc

    def kdel(self):
        sql = f"""
            DELETE FROM [{self.__class__.__name__.lower()}]
            WHERE {' AND '.join([ f"[{k}]='{getattr(self, k, '')}'" for k in self._kc ])}
        """
        try: res = self.query(sql)
        except: log.error(traceback.format_exc())
        return getattr(res, 'rowcount', 0) if res else 0

    def merge(self) :
        kc = self.key_columns()
        attrs = self.attrs()
        if attrs.get('id') : del attrs['id']
        res = None
        sql = ''
        try :
            sql = f"""
                UPDATE [{self.__class__.__name__.lower()}]
                SET {','.join([ f"[{k}]='{attrs[k]}'" for k in attrs if attrs[k] is not None ])}
                WHERE {' AND '.join([ f"[{k}]='{attrs.get(k, '')}'" for k in kc ])}
            """
            try: res = self.query(sql)
            except: res = None
            if res is None or res.rowcount == 0 :
                sql = f"""
                    INSERT INTO {self.__class__.__name__.lower()} ({','.join([ f'[{k}]' for k in attrs ])})
                    VALUES ({','.join(list(map(lambda x : f"'{x}'" if x is not None else 'NULL', [ attrs[k] for k in attrs ])))})
                """
                try: res = self.query(sql)
                except: log.error(traceback.format_exc())
        except: log.error(traceback.format_exc())
        log.info(message=re.sub(r"\s+", " ", sql).strip())
        return getattr(res, 'rowcount', 0) if res else 0

    def distincts(self, column, args={}):
        """
        Get distinct values for a specific column.
        """
        return list(
            set([
                (
                    str(getattr(x, column, ''))
                    + str((f' {args.get('sep', '|')} ' + getattr(x, args['add_field'], '')) if args.get('add_field', False) else '')
                ) for x in self.fetch(columns=[column] + ([args['add_field']] if args.get('add_field', False) else []), limit=-1).rows or []
            ])
        )

    @staticmethod
    def static_exec(sql, vals_list=None):
        res = None
        tmp = db_t()
        tmp.connect()
        try:
            log.info(message=re.sub(r"\s+", ' ', sql).strip(), filename='DB_T')
            if vals_list: res = tmp._Cursor.execute(sql, *vals_list)
            else: res = tmp._Cursor.execute(sql)
            if getattr(tmp._Cursor, 'description'):
                column_names = [ column[0] for column in tmp._Cursor.description ]
                res = list(map(lambda x: ClassT(**dict(zip(column_names, x))), res))
            else: column_names = []
        except: log.error(traceback.format_exc())
        return ResponseT(cols=column_names, rows=res)

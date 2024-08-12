import os
import re
import traceback
# from hashlib import md5  # , sha256
from datetime import datetime, date
from models.mssql import mssql
from utils.log import log
from utils.basic_traits import class_t, response_t, static_cast

VERBOSE = int(os.getenv("VERBOSE", 0))
DB_OPERATION_PACE = 512


class db_t(class_t) :

    _Driver = mssql
    _Database = os.getenv("DB_DATABASE")
    _Server = os.getenv("DB_SERVER")
    _Key  = os.getenv("DB_KEY")
    _Columns = None

    def columns(self):
        res = self._Columns  # schema_cache.get('columns')
        if res is None or len(res) == 0:
            sql = 'SELECT TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS'
            res = self.connect()[0].execute(sql)
            res = [ col[1] for col in res if col[0] == self.__class__.__name__.lower() ]
            self._Columns = res
        return res

    def build_query(self, columns=None, filters=None, strict=True) :
        table_name = self.__class__.__name__
        conditions = []
        if filters:
            try:
                for column, value in filters.items():
                    if isinstance(value, tuple) :
                        p = q = o = None
                        try: p, q, o = value
                        except: p, q = value
                        if q: condition = f"[{table_name}].[{column}] {o if o else 'BETWEEN'} '{p}' AND '{q}'"
                        else: condition = f"[{table_name}].[{column}] {o if o else '='} '{p}'"
                    elif isinstance(value, list):
                        condition = f"[{table_name}].[{column}] IN ('" + "','".join([ str(x) for x in value ]) + "')"
                    else:
                        condition = f"[{table_name}].[{column}] = '{value}'"
                    conditions.append(condition)
            except: log.error(traceback.format_exc())
        columns = columns or self.columns()
        sql = "SELECT %s FROM [%s].[%s].[%s]" % ("[" + "],[".join(columns) + "]" if len(columns) else "*", self._Database, self._Key, table_name)
        if len(conditions): sql += " WHERE " + f" {'AND' if strict else 'OR'} ".join(conditions)
        return sql

    def connect(self):
        if not self._Cursor:
            self.conn = self._Driver(tablename=type(self).__name__.lower()).connect()
            if self.conn: self._Cursor = self.conn.cursor()
        return self._Cursor, self.conn

    def execute(self, sql, vals_list=None):
        start_time = datetime.now()
        res = None
        sql = re.sub(r'\s+', ' ', sql).strip()
        self.connect()
        column_names = []
        if self._Cursor:
            try:
                if vals_list: res = self._Cursor.execute(sql, *vals_list)
                else: res = self._Cursor.execute(sql)
                if getattr(self._Cursor, 'description'):
                    column_names = [ column[0] for column in self._Cursor.description ]
                    res = list(map(lambda x : self.__class__(**dict(zip(column_names, x))), res))
                log.info(message="%s secs for %s" % ((datetime.now() - start_time), sql), filename=self.__class__.__name__)
            except: log.error(traceback.format_exc())
            return response_t(cols=column_names, items=res)

    def query(self, sql, vals=None) :
        start_time = datetime.now()
        res = None
        sql = re.sub(r'\s+', ' ', sql).strip()
        self.connect()
        try:
            if vals : res = self._Cursor.execute(sql, *vals)
            else : res = self._Cursor.execute(sql)
        except: log.error(traceback.format_exc())
        log.info(message="%s secs for %s" % ((datetime.now() - start_time), sql), filename=self.__class__.__name__)
        return res

    def fetch(self, filters=None, strict=False):
        return self.execute(self.build_query(filters=filters, strict=strict))

    def row_key(self):
        _k = []
        for k in self.key_columns(): _k.append("%s" % str(getattr(self, k, '')))
        return "".join(_k)

    def row_hash(self, blacklist=None) :
        attrs = self.attrs(bl=blacklist)
        keys = sorted(attrs.keys())
        temp_str = []
        for key in keys:
            if key != "id" :
                val = attrs.get(key)
                if isinstance(val, str): temp_str.append(static_cast.str(val))
                elif isinstance(val, float): temp_str.append("%d" % static_cast.float(val))
                elif isinstance(val, date): temp_str.append(val.strftime(static_cast.SHORT_DATE))
                elif isinstance(val, datetime): temp_str.append(val.strftime(static_cast.LONG_DATE))
                else: temp_str.append("%s" % str(val))
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
        log.info(message=re.sub(r"\s+", " ", sql).strip(), filename=self.__class__.__name__)
        return getattr(res, 'rowcount', 0) if res else 0

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
                res = list(map(lambda x: class_t(**dict(zip(column_names, x))), res))
            else: column_names = []
        except: log.error(traceback.format_exc())
        return response_t(cols=column_names, items=res)

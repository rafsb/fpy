# --------------------------------------------------------------------------------------------
# DB Interface
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import os
import re
import traceback
from hashlib import md5
from datetime import datetime, date
from models.mssql import MSSQL
from utils.log import log
from utils.basic_traits import ClassT, DBResponseT, StaticCast
from utils.cache import memcache


DB_OPERATION_PACE = 512


class DB_T(ClassT) :

    id = -1
    _kc = ['id']
    _bl = ['id']
    _Driver = MSSQL
    _Server = os.environ.get("DB_SERVER")
    _Database = os.environ.get("DB_DATABASE")
    _Schema  = os.environ.get("DB_SCHEMA")
    _Password = os.environ.get("DB_PASSWORD")
    _Username = os.environ.get("DB_USERNAME")
    _Columns = None
    _Cursor = None
    _Conn = None
    _ConstantsMap = [
        ('server', '_Server')
        , ('db', '_Database')
        , ('schema', '_Schema')
        , ('table', '_Table')
    ]

    def __init__(self, **kwargs):
        for t in self._ConstantsMap:
            if kwargs.get(t[0]):
                setattr(self, t[1], kwargs[t[0]])
                del kwargs[t[0]]
        super().__init__(**kwargs)

    def conn_args(self: ClassT) -> tuple:
        server = getattr(self, '_Server', os.environ.get("DB_SERVER"))
        db = getattr(self, '_Database', os.environ.get("DB_DATABASE"))
        key = getattr(self, '_Schema', os.environ.get("DB_SCHEMA"))
        table = getattr(self, '_Table', self.__class__.__name__)
        return server, db, key, table

    def count(self, filters=None, **args):
        sql = f"SELECT COUNT(*) AS count FROM {self.__class__.__name__.lower()}"
        if filters:
            querystr, params = self.build_query(filters=filters, order=False)
            try: sql += f" WHERE {querystr.split(' WHERE ')[1]}"
            except:
                sql += f" WHERE {querystr}"
            return self.query(sql, params).fetchall()[0][0]
        return self.query(sql).fetchall()[0][0]

    def columns(self):
        server = getattr(self, '_Server', os.environ.get('DB_SERVER'))
        table = getattr(self, '_Table', self.__class__.__name__)
        cache_id = f'INFORMATION_SCHEMA.COLUMNS-{server}-{table}'.upper()
        res = memcache.get(cache_id)
        if res is None or len(res) == 0:
            sql = 'SELECT TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS'
            try:
                res = self.connect()[0].execute(sql)
                res = [ col[1] for col in res if col[0].lower() == table.lower() ]
                memcache.set(cache_id, res)
            except:
                log.error(traceback.format_exc())
                res = []
        return res

    def keys(self):
        return self._kc

    def build_query(self, columns=None, filters=None, order=None, strict=True, offset=0, limit=-1):

        _, db, key, table = self.conn_args()
        conditions = []
        params = []

        if order is None and getattr(self, '_order_by', None):
            order = (self._order_by, getattr(self, '_order_direction', 'ASC'))

        if filters and len(filters.keys()):
            try:
                for column, value in filters.items():
                    if type(value) is list and len(value) == 1:
                        value = value[0]
                    if isinstance(value, tuple):
                        p, q, o = value if len(value) == 3 else (*value, None)
                        if q:
                            conditions.append(f"[s{table}].[{column}] {o or 'BETWEEN'} ? AND ?")
                            params.extend([p, q])
                        else:
                            conditions.append(f"[{table}].[{column}] {o or '='} ?")
                            params.append(p)
                    elif isinstance(value, list):
                        tmp_conditions = ''
                        placeholders = []
                        for v in value:
                            if v not in [None, '']:
                                placeholders.append('?')
                            else:
                                tmp_conditions = (f"[{table}].[{column}] IS NULL OR ")
                        conditions.append(f"({tmp_conditions}[{table}].[{column}] IN ({','.join(placeholders)}))")
                        params.extend([x for x in value if x not in [None, '']])
                    else:
                        # value = None if value == '' else value
                        if value is None:
                            conditions.append(f"[{table}].[{column}] IS NULL")
                        else:
                            conditions.append(f"[{table}].[{column}] = ?")
                            params.append(value)
            except:
                log.error(traceback.format_exc())

        columns = columns or self.columns()
        column_clause = "[" + "],[".join(columns) + "]" if columns else "*"

        sql = f"SELECT {column_clause} FROM [{db}].[{key}].[{table}]"

        if conditions:
            sql += " WHERE " + f" {'AND' if strict else 'OR'} ".join(conditions)

        sql += " ORDER BY " + ("(SELECT NULL)" if not order else f"[{order[0]}] {order[1]}") + " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
        params.extend([offset or 0, limit or 100 if limit != -1 else 1000000])
        return sql, params

    def connect(self, username=None, password=None, speedup=True):
        server, db, _, table = self.conn_args()
        if not self._Cursor:
            self._Conn = self._Driver(
                tablename=table
                , server=server
                , database=db
                , username=username or self._Username
                , password=password or self._Password
            ).connect()
            if self._Conn:
                self._Cursor = self._Conn.cursor()
                self._Cursor.fast_executemany = speedup
        return self._Cursor, self._Conn

    def execute(self, sql, vals=None):
        log.debug('EXECUTE >> ' + re.sub(r'\s+', ' ', sql).strip() + " << %s" % vals)
        self.connect()
        res = None
        column_names = []
        if self._Cursor:
            try:
                if vals: res = self._Cursor.execute(sql, *vals)
                else: res = self._Cursor.execute(sql)
                if getattr(self._Cursor, 'description'):
                    column_names = [ column[0].lower() for column in self._Cursor.description ]
                    res = list(map(lambda x : self.__class__(**dict(zip(column_names, x))), res))
            except:
                log.error(traceback.format_exc())
                log.error(sql + ' < (%s)' % vals)
        return DBResponseT(cols=column_names, rows=res)

    def query(self, sql, vals=None) :
        log.debug('QUERY >> ' + re.sub(r'\s+', ' ', sql).strip() + " << %s" % vals)
        self.connect()
        res = None
        try:
            if vals : res = self._Cursor.execute(sql, *vals)
            else : res = self._Cursor.execute(sql)
        except:
            log.error(traceback.format_exc())
            log.error(sql + '%s' % vals)
        return res if res else ClassT(rowcount=0)

    def fetch(self, columns=None, filters=None, order=None, strict=True, offset=None, limit=-1):
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
        sql, params = self.build_query(columns=columns, filters=filters, order=order, strict=strict, offset=offset, limit=limit)
        return self.execute(sql, params)

    def row_key(self, char=';', encrypt=False):
        _k = []
        for k in self._kc:
            v = getattr(self, k, '')
            if v in [None, 0, '', False]: v = ''
            _k.append("%s" % str(v).strip())
        tmp = char.join(_k)
        return md5(tmp.encode('utf-8')).hexdigest() if encrypt else tmp

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
                elif isinstance(val, datetime): temp_str.append("%s:%s" % (key, val.strftime(StaticCast.LONG_DATE)))
                elif isinstance(val, date): temp_str.append("%s:%s" % (key, val.strftime(StaticCast.SHORT_DATE)))
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
        return getattr(res, 'rowcount', 0) if res else 0

    def distincts(self, column, args={}):
        """
        Get distinct values for a specific column.
        """
        return list(
            set([
                (
                    str(getattr(x, column, '-'))
                    + str((" " + args.get('sep', '|') + " " + getattr(x, args['add_field'], '')) if args.get('add_field', False) else '')
                ) for x in self.fetch(columns=[column] + ([args['add_field']] if args.get('add_field', False) else []), limit=-1, order=False).rows or []
            ])
        )

    @staticmethod
    def static_exec(sql, vals=None):
        res = None
        tmp = DB_T()
        tmp.connect()
        try:
            if vals: res = tmp._Cursor.execute(sql, *vals)
            else: res = tmp._Cursor.execute(sql)
            if getattr(tmp._Cursor, 'description'):
                column_names = [ column[0] for column in tmp._Cursor.description ]
                res = list(map(lambda x: ClassT(**dict(zip(column_names, x))), res))
            else: column_names = []
        except: log.error(traceback.format_exc())
        return DBResponseT(cols=column_names, rows=res)

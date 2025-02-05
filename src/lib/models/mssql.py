# --------------------------------------------------------------------------------------------
# MSSQL model class to handle database operations
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import os
import re
import pyodbc
import traceback
from utils.basic_traits import ClassT
from utils.log import log


class MSSQL:
    _Server = os.getenv("DB_SERVER")
    _Database = os.getenv("DB_DATABASE")
    _Username = os.getenv("DB_USERNAME")
    _Password = os.getenv("DB_PASSWORD")
    _Table = None

    def __init__(self, tablename, server=None, database=None, username=None, password=None):
        self._Server = server if server else self._Server
        self._Database = database if database else self._Database
        self._Username = username if username else self._Username
        self._Password = password if password else self._Password
        self._Table = tablename if tablename else self._Table

        # Create the connection string
        self.conn_str = f'DRIVER={{SQL Server}};SERVER={self._Server};DATABASE={self._Database};UID={self._Username};PWD={self._Password}'

        # Initialize the connection
        self.connection = self.connect()

    def connect(self):
        try:
            connection = pyodbc.connect(self.conn_str, autocommit=True)
            return connection
        except:
            log.error(message=f"Error connecting to the database: {self.conn_str}")
            return None

    def query(self, query):
        try:
            cursor = self.connection.cursor()
            res = cursor.execute(query)
            self.connection.commit()
            return ClassT(status=True, res=res)
        except:
            log.error(message=f"Error executing query: {traceback.format_exc()}")
            return ClassT(status=False, res=None)

    def fetch(self, query):
        try:
            cursor = self.connection.cursor()
            cursor.execute(query)
            res = cursor.fetchall()
            return ClassT(status=True if len(res) > 0 else False, res=res)
        except:
            log.error(f"Error fetching records: {traceback.format_exc()}")
            return ClassT(status=False, res=None)

    def upsert(self, entity):
        res = self.query(entity.update_query())
        if res.status:
            return res
        else:
            return self.query(entity.insert_query())

    def clear_database(self):
        clear_query = """
            DECLARE @sql NVARCHAR(MAX) = '';

            SELECT @sql += 'DROP FUNCTION ' + QUOTENAME(OBJECT_SCHEMA_NAME(object_id)) + '.' + QUOTENAME(name) + '; '
            FROM sys.objects
            WHERE type IN ('FN', 'IF', 'TF');

            SELECT @sql += 'DROP VIEW ' + QUOTENAME(name) + '; '
            FROM sys.views;

            SELECT @sql += 'DROP TABLE ' + QUOTENAME(name) + '; '
            FROM sys.tables;

            EXEC sp_executesql @sql;
        """
        return self.query(clear_query)

    def init_database(self, filename='init_database.sql'):
        res = []
        filepath = os.path.join(os.path.dirname(__file__), '..', '..', 'etc', filename)
        if os.path.exists(filepath):
            self.clear_database()
            with open(filepath, 'r') as file:
                sql_commands = re.split(r'\s+GO\s+', file.read(), flags=re.MULTILINE)
                for sql in sql_commands:
                    if sql.strip():
                        log.info(f"Executing SQL command: {sql.strip()}")
                        res.append(self.query(sql.strip()))
        else:
            log.error(f"Initialization file not found: {filepath}")
        return res

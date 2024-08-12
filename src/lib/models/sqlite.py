import os
import re
import sqlite3
import traceback
from utils.basic_traits import class_t
from utils.log import log

class SQLiteDB:
    _Database = os.getenv("DB_DATABASE")
    _Table = None

    def __init__(self, tablename, database=None):
        self._Database = database if database else self._Database
        self._Table = tablename if tablename else self._Table

        # Initialize the connection
        self.connection = self.connect()

    def connect(self):
        try:
            connection = sqlite3.connect(self._Database)
            return connection
        except Exception as e:
            log.error(f"Error connecting to the database: {e}")
            return None

    def execute_query(self, query):
        try:
            cursor = self.connection.cursor()
            cursor.execute(query)
            self.connection.commit()
            return class_t(status=True, res=cursor)
        except Exception as e:
            log.error(f"Error executing query: {traceback.format_exc()}")
            return class_t(status=False, res=None)

    def fetch(self, query):
        try:
            cursor = self.connection.cursor()
            cursor.execute(query)
            res = cursor.fetchall()
            return class_t(status=True if len(res) > 0 else False, res=res)
        except Exception as e:
            log.error(f"Error fetching records: {traceback.format_exc()}")
            return class_t(status=False, res=None)

    def upsert(self, entity):
        res = self.execute_query(entity.update_query())
        if res.status:
            return res
        else:
            return self.execute_query(entity.insert_query())

    def clear_database(self):
        try:
            cursor = self.connection.cursor()
            cursor.execute("PRAGMA foreign_keys = OFF;")
            cursor.execute("BEGIN TRANSACTION;")

            # Drop all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            for table in tables:
                cursor.execute(f"DROP TABLE IF EXISTS {table[0]};")

            # Drop all views
            cursor.execute("SELECT name FROM sqlite_master WHERE type='view';")
            views = cursor.fetchall()
            for view in views:
                cursor.execute(f"DROP VIEW IF EXISTS {view[0]};")

            # Drop all triggers
            cursor.execute("SELECT name FROM sqlite_master WHERE type='trigger';")
            triggers = cursor.fetchall()
            for trigger in triggers:
                cursor.execute(f"DROP TRIGGER IF EXISTS {trigger[0]};")

            cursor.execute("COMMIT;")
            cursor.execute("PRAGMA foreign_keys = ON;")
            return class_t(status=True, res=None)
        except Exception as e:
            log.error(f"Error clearing the database: {traceback.format_exc()}")
            return class_t(status=False, res=None)

    def init_database(self, filename='init_database.sql'):
        res = []
        filepath = os.path.join(os.path.dirname(__file__), '..', '..', 'etc', filename)
        if os.path.exists(filepath):
            self.clear_database()
            with open(filepath, 'r') as file:
                sql_commands = re.split(r'\s*;\s*', file.read(), flags=re.MULTILINE)
                for sql in sql_commands:
                    if sql.strip():
                        log.info(f"Executing SQL command: {sql.strip()}")
                        res.append(self.execute_query(sql.strip()))
        else:
            log.error(f"Initialization file not found: {filepath}")
        return res

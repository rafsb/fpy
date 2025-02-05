# --------------------------------------------------------------------------------------------
# MES Model
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import os
from models.mssql import mssql


class mes(mssql):

    def __init__(self, tablename=None, server=None, database=None, username=None, password=None, driver=None):

        # Set SQL Server connection details from environment variables
        self.driver   = driver   if driver   else os.environ.get("MES_DRIVER")
        self.server   = server   if server   else os.environ.get("MES_SERVER")
        self.database = database if database else os.environ.get("MES_DATABASE")
        self.username = username if username else os.environ.get("MES_USERNAME")
        self.password = password if password else os.environ.get("MES_PASSWORD")

        # Create the connection string
        self.conn_str = f'DRIVER={self.driver};SERVER={self.server};DATABASE={self.database};UID={self.username};PWD={self.password}'
        self.table = tablename

        # Initialize the connection
        self.connection = self.connect()
        self._Cursor = self.connection.cursor()

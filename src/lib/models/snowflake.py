# --------------------------------------------------------------------------------------------
# Snowflake Database Model
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import os
import traceback
import snowflake.connector  # type: ignore
from models.mssql import mssql_m
from utils.log  import log


class sf(mssql_m):

    _Driver     = os.getenv("SF_DRIVER")
    _Database   = os.getenv("SF_DATABASE")
    _Server     = os.getenv("SF_SERVER")
    _Key        = os.getenv("SF_KEY")
    _Username   = os.getenv("SF_USERNAME")
    _Password   = os.getenv("SF_PASSWORD")
    _Table = None

    def __init__(self, tablename=None, server=None, database=None, username=None, password=None, driver=None):

        # Set SQL Server connection details from environment variables
        if driver: self._Driver     = driver
        if server: self._Server     = server
        if tablename: self._Table   = tablename
        if database: self._Database = database
        if username: self._Username = username
        if password: self._Password = password

        try:
            self.connection = snowflake.connector.connect(user=self._Username, password=self._Password, account=self._Server)
            self._Cursor = self.connection.cursor()
        except:
            self.connection = self._Cursor = None
            log.error(traceback.format_exc())

    def connect(self):
        return self.connection

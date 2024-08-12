import os
from dotenv import load_dotenv


load_dotenv()
APP_VERSION = os.getenv("APP_VERSION")


def register(app, args=None) :
    @app.post('/version')
    def version() : return APP_VERSION if APP_VERSION else '0.0-rolling'

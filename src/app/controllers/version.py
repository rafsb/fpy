import os


APP_VERSION = os.getenv("APP_VERSION", "0.0-rolling")


class version:

    @staticmethod
    def init():
        return APP_VERSION


def register(app, args=None) :
    @app.post('/version')
    def _version() : return version.init()

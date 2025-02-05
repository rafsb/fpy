import os


APP_VERSION = os.getenv("APP_VERSION", "0.0-rolling")


class version:

    @staticmethod
    def init():
        return APP_VERSION


def register(app, args=None) :
    @app.route('/version', methods=['GET', 'POST'])
    def _version() : return version.init()

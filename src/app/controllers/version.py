import os


class version:

    @staticmethod
    def init():
        return os.getenv("APP_VERSION", "0.0-rolling")


def register(app, args=None) :
    @app.route('/version', methods=['GET', 'POST'])
    def _version() : return version.init()

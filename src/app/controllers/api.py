import os
from jsonpickle import encode
from controllers.user import check_user
from utils.cache import clear_cache


class api():

    @staticmethod
    def clear_cache():
        return clear_cache()

    @staticmethod
    def env():
        return os.environ


def register(app, args=None):

    @app.get('/clear_cache')
    def _api_clear_cache():
        api.clear_cache()
        return 'ok', 200

    @app.get('/env')
    @check_user()
    def _api_env():
        return encode(api.env()), 200

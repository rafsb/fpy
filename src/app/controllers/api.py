import os
import jsonpickle
from interfaces.controller import controller
from entities.departments import departments
from entities.actions import actions
from utils.cache import CACHE, clear_cache


class api(controller): pass


def register(app, args=None):

    @app.get('/clear_cache')
    def _clear_cache():
        clear_cache()
        return 'ok'

    @app.get('/departments')
    # @CACHE(id='departments')
    def _get_departments():
        rows = departments().fetch().rows
        return [x.attrs() for x in rows] if rows else []

    @app.get('/actions')
    # @CACHE(id='actions')
    def _get_actions():
        rows = actions().fetch().rows
        return [x.attrs() for x in rows]

    @app.get('/env')
    def _get_env():
        return jsonpickle.dumps(os.environ)

import os
from flask import request
from jsonpickle import dumps, encode
from hashlib import md5
from entities.candata import candata
from controllers.user import check_user
from utils.cache import clear_cache, cache, CacheDB


class api(): pass


def register(app, args=None):

    @app.get('/clear_cache')
    def _api_clear_cache():
        clear_cache()
        return 'ok'

    @app.get('/env')
    @check_user()
    def _api_env():
        return dumps(os.environ)

    @app.route('/candata/cols', methods=['GET', 'POST'])
    def _candata_cols():
        return candata().columns()

    @app.post('/candata/rows')
    def _candata_rows():
        args = {}
        try: args = request.json
        except: args = {}
        try: del args['_ts']
        except: pass
        cache_id = 'candata_' + md5(str(encode(args)).encode()).hexdigest()
        res = cache.get(id=cache_id)
        if res: return res.dict()
        res = candata().fetch(**args)
        cache.set(id=cache_id, data=res)
        return res.dict()

    @app.post('/candata/count')
    def _candata_count():
        return f'{candata().count(**request.json)}'

    @app.get('/candata/distinct/<column>')
    def _candata_distinct(column):
        cache = CacheDB('.distincts')
        res = cache.get(id=column)
        if res: return res
        res = candata().distincts(column=column, args=dict(**request.args) or {})
        cache.set(id=column, data=list(sorted([x or '-' for x in res])))
        return res

import os
import traceback
import jsonpickle
from datetime import datetime
from flask import request
from .basic_traits import singleton_t
from .log import log

# Cache configuration
VERBOSE = int(os.getenv("VERBOSE", 0))
NOCACHE = int(os.getenv("NOCACHE", 0))
CACHE_LIFESPAN = float(os.getenv('CACHE_LIFESPAN', 120))
CACHE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "var", "cache")


class CacheDB(singleton_t):
    def __init__(self, db_name='default_store', persistent=False):
        self.db_name = db_name if db_name.startswith('/') else f'/{db_name}'
        self.persistent = persistent
        self.db = None
        self.load()

    def __str__(self):
        return jsonpickle.encode(self.db)

    def load(self, db_name=None):
        self.db_name = db_name or self.db_name
        os.makedirs(CACHE_PATH, exist_ok=True)
        db_path = os.path.join(CACHE_PATH, self.db_name)

        if not os.path.isfile(db_path):
            with open(db_path, "w") as file:
                file.write(jsonpickle.encode({}))

        try:
            with open(db_path, "r") as file:
                self.db = jsonpickle.decode(file.read())
        except Exception as e:
            self.db = {}
            log.error(f"Failed to load cache database: {traceback.format_exc()}")

    def save(self, callback=None):
        try:
            os.makedirs(CACHE_PATH, exist_ok=True)
            with open(os.path.join(CACHE_PATH, self.db_name), "w") as file:
                file.write(jsonpickle.encode(self.db))
            if callback:
                callback(None, self)
        except Exception as e:
            log.error(f"Failed to save cache database: {traceback.format_exc()}")
            if callback:
                callback(True, None)

    def changedb(self, db_name):
        self.db = None
        self.load(db_name)
        return self

    def persist(self, db_name=None):
        self.save(callback=None if not db_name else lambda x, y: self.load(db_name))

    def all(self, callback=None):
        try:
            now = datetime.now().timestamp()
            all_items = [v for v in self.db.values() if v['expires'] > now]
            if callback:
                return callback(False, all_items)
            return all_items
        except Exception as e:
            log.error(f"Failed to retrieve all cache entries: {traceback.format_exc()}")
            if callback:
                callback(True, None)

    def set(self, data, id=None, callback=None, expires=CACHE_LIFESPAN, persist=False):
        if id is not None:
            try:
                self.db[id] = {"expires": datetime.now().timestamp() + expires * 60, "data": data}
                if persist:
                    self.persist()
                if callback:
                    callback(None, self.db[id])
                return self.db[id]
            except Exception as e:
                log.error(f"Failed to set cache entry: {traceback.format_exc()}")
                if callback:
                    callback(True, None)

    def get(self, id=None, callback=None):
        res = None
        try:
            if id and id in self.db:
                entry = self.db[id]
                if self.persistent or entry['expires'] > datetime.now().timestamp():
                    if not self.persistent:
                        log.info(f"Cache {self.db_name}/{id} remaining time: {entry['expires'] - datetime.now().timestamp()}")
                    res = entry['data']
                else:
                    log.info(f"Cache {self.db_name}/{id} expired: {entry['expires'] - datetime.now().timestamp()}")
                    del self.db[id]
            if callback:
                callback(None, res)
        except Exception as e:
            log.error(f"Failed to get cache entry: {traceback.format_exc()}")
            if callback:
                callback(True, None)
        return res

    def touch(self, id, data, callback=None, expires=None):
        return self.set(data=data, id=id, callback=callback, expires=expires or CACHE_LIFESPAN, persist=True)

    def destroy(self, id, callback=None, persist=False):
        try:
            del self.db[id]
            if persist:
                self.persist()
            if callback:
                callback(None, True)
        except KeyError:
            log.warning(f"Cache entry {id} not found.")
            if callback:
                callback(None, False)
        except Exception as e:
            log.error(f"Failed to destroy cache entry: {traceback.format_exc()}")
            if callback:
                callback(True, None)

    def length(self, callback=None):
        try:
            now = datetime.now().timestamp()
            res = len([v for v in self.db.values() if v['expires'] > now])
            if callback:
                callback(None, res)
            return res
        except Exception as e:
            log.error(f"Failed to get cache length: {traceback.format_exc()}")
            if callback:
                callback(True, 0)
            return 0

    def clear(self, callback=None, persist=False):
        try:
            self.db = {}
            if persist:
                self.persist()
            if callback:
                callback(None, True)
        except Exception as e:
            log.error(f"Failed to clear cache: {traceback.format_exc()}")
            if callback:
                callback(True, None)

    def reload(self):
        return CacheDB(self.db_name)


global cache
cache = CacheDB()


def clear_cache(caches=None):
    global cache
    if caches is None:
        caches = list(cache.db.keys())
    for cache_name in caches:
        if cache_name != 'stream':
            cache.destroy(cache_name)
    cache.save()


def CACHE(id=None, lifespan=CACHE_LIFESPAN, persist=False):
    global cache

    def decorator(fn):
        def wrapper(*args, **kwargs):
            if id is None:
                return fn(*args, **kwargs)

            nocache = NOCACHE or any([
                'nocache' in args,
                kwargs.get('nocache', False),
                bool(int(request.args.get('nocache', 0))),
                'nocache' in request.data.decode('utf-8')
            ])

            if not nocache:
                res = cache.get(id=id)
                if res is None:
                    res = fn(*args, **kwargs)
                    cache.set(data=res, id=id, expires=lifespan, persist=persist)
                return res

            return fn(*args, **kwargs)

        wrapper.__name__ = fn.__name__
        return wrapper

    return decorator

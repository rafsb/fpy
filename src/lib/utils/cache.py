# --------------------------------------------------------------------------------------------
# Cache module for storing and retrieving data in a file-based cache system.
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import os
import re
import jsonpickle
import traceback
from flask import request
from datetime import datetime
from threading import Lock
from utils.basic_traits import ClassT
from utils.log import log


CACHE_LIFESPAN = float(os.getenv('CACHE_LIFESPAN', 120))
CACHE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "var", "db")


class CacheDB(ClassT):

    persist: bool

    def __init__(self, db_name=None, persist=False):
        self.db_name = db_name if db_name else 'default'
        if self.db_name[0] == '/':
            self.db_name = self.db_name[1:]
        self.db_path = os.path.join(CACHE_PATH, self.db_name)
        os.makedirs(self.db_path, exist_ok=True)
        self.persist = persist
        self.lock = Lock()

    def save(self, callback=None):
        # No need to implement save for file-based storage
        if callback:
            callback(False, self)

    def set(self, id, data, callback=None, expires=CACHE_LIFESPAN):
        if id:
            id = str(id)
            try:
                with self.lock:
                    file_path = os.path.join(self.db_path, id)
                    content = {
                        "expires": datetime.now().timestamp() + expires * 60
                        , "data": data
                    }
                    try:
                        with open(file_path, "wb") as file:
                            file.write(jsonpickle.encode(content, keys=True).encode())
                    except:
                        os.remove(file_path)

                if callback:
                    callback(None, data)
                return data
            except:
                log.error(traceback.format_exc())
                if callback:
                    callback(True, None)
        if callback:
            callback(True, None)

    def get(self, id=None, callback=None, cast=None):
        res = None
        try:
            if id is not None:
                file_path = os.path.join(self.db_path, str(id))
                if os.path.exists(file_path):
                    mark_for_exclusion = False
                    with open(file_path, "rb") as file:
                        try: content = jsonpickle.decode(file.read().decode(), keys=True)
                        except: content = {}
                        if self.persist or content.get('expires', -1) > datetime.now().timestamp():
                            log.debug(f"CACHE: {id} {str(content.get('expires', -1) - datetime.now().timestamp())}")
                            res = content.get('data', {})
                            if cast and not isinstance(res, cast):
                                res = cast(**res)
                        else:
                            log.info(f"CACHE expired: {id} {str(content.get('expires', -1) - datetime.now().timestamp())}")
                            mark_for_exclusion = True
                    if mark_for_exclusion:
                        try: os.remove(file_path)
                        except: log.debug(f"Failed to remove expired cache file: {file_path}")
            if callback:
                callback(None, res)
        except:
            log.error(traceback.format_exc())
            if callback:
                callback(traceback.format_exc(), None)
        return res

    def getif(self, id=None, entity=None, func=None, payload=None):
        if id is None and entity is not None:
            id = entity().__class__.__name__
        if not id:
            return None
        res = self.get(id=id)
        if not bool(res):
            try:
                if func:
                    res = func(**payload) if payload else func()
                elif entity:
                    res = entity().fetch(**payload) if payload else entity().fetch()
                if res:
                    self.set(id, res)
            except:
                log.error(traceback.format_exc())
        return res

    def destroy(self, id, callback=None):
        res = False
        if not id:
            log.error(f"No id provided when trying to destroy a record in {self.db_name}.")
        try:
            file_path = os.path.join(self.db_path, str(id))
            if os.path.exists(file_path):
                os.remove(file_path)
            if callback: res = callback(None, True)
            else: res = not bool(os.path.exists(file_path))
        except:
            log.error(traceback.format_exc())
            if callback:
                callback(True, None)
        return res

    def delete(self, id, callback=None):
        return self.destroy(id, callback)

    def clear(self, callback=None):
        try:
            for filename in os.listdir(self.db_path):
                file_path = os.path.join(self.db_path, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            if callback:
                callback(None, True)
        except:
            log.error(traceback.format_exc())
            if callback:
                callback(True, None)


class LocalDB(CacheDB):

    persist = True

    def __init__(self, db_name=None):
        super().__init__(db_name=db_name, persist=True)


class MemDB(ClassT):

    _db = {}

    def set(self, data, id=None, expires=CACHE_LIFESPAN):
        if id:
            self._db[str(id)] = {
                "expires": datetime.now().timestamp() + expires * 60,
                "data": data
            }

    def get(self, id=None):
        if id is not None:
            content = self._db.get(str(id), None)
            if content and content.get('expires', -1) > datetime.now().timestamp():
                return content.get('data', None)
            else:
                self.destroy(id)
        return None

    def destroy(self, id):
        try: del self._db[id]
        except: pass

    def clear(self):
        self._db = {}


def clear_cache(caches=None, pattern=None, id=None, engine=None):
    """
    Clears the cache by deleting cache files based on the specified criteria.

    Args:
        caches (list, optional): A list of cache filenames to be cleared. Defaults to None.
        pattern (str, optional): A regular expression pattern to match cache filenames. Defaults to None.
        id (str, optional): An identifier for the cache. Defaults to None.
        engine (object, optional): The cache engine to use. Defaults to cache.

    Returns:
        None

    Comments:
        - If neither `caches` nor `pattern` is provided, the entire cache is cleared using `engine.clear()`.
        - If `caches` or `pattern` is provided, only the matching cache files are deleted using `engine.destroy()`.
        - The cache files are located in the directory specified by `engine.db_path`.
        - The 'stream' file is skipped during cache deletion.
    """
    if not engine: engine = cache
    if caches is None and pattern is None: engine.clear()
    else:
        for filename in os.listdir(engine.db_path):
            if filename == 'stream':
                continue
            if (caches and filename in caches) or (pattern and re.match(pattern, filename)):
                engine.destroy(filename)


def CACHE(id: str = None, lifespan: int = CACHE_LIFESPAN, engine: ClassT = None) -> callable:
    if not engine: engine = cache

    def decorator(fn: callable) -> callable:
        def wrapper(*args, **kwargs) -> any:
            no_cache = bool(request.args.get('nocache', 0) * 1)
            res = None
            if no_cache or not id:
                return fn(*args, **kwargs)
            cacheid = '__' + re.sub(r'[^a-zA-Z0-9_]+', '_', id)
            res = engine.get(id=cacheid)
            if res is None:
                res = fn(*args, **kwargs)
                engine.set(cacheid, res, expires=lifespan)
            return res
        wrapper.__name__ = f'wrapper_{fn.__name__}'
        return wrapper
    return decorator


cache = CacheDB(db_name=".cache")
localstore = LocalDB(db_name=".local")
memcache = MemDB()

# --------------------------------------------------------------------------------------------
# Cache
# --------------------------------------------------------------------------------------------

import os
import re
import jsonpickle
import traceback
from datetime import datetime
from threading import Lock
from utils.basic_traits import ClassT
from utils.log import log


CACHE_LIFESPAN = float(os.getenv('CACHE_LIFESPAN', 120))
CACHE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "var", "db")


class CacheDB(ClassT):
    def __init__(self, db_name=None):
        self.db_name = db_name if db_name else 'default'
        if self.db_name[0] == '/':
            self.db_name = self.db_name[1:]
        self.db_path = os.path.join(CACHE_PATH, self.db_name)
        os.makedirs(self.db_path, exist_ok=True)
        self.lock = Lock()

    def save(self, callback=None):
        # No need to implement save for file-based storage
        if callback:
            callback(False, self)

    def set(self, data, id=None, callback=None, expires=CACHE_LIFESPAN):
        if id:
            id = str(id)
            try:
                with self.lock:
                    file_path = os.path.join(self.db_path, id)
                    content = {
                        "expires": datetime.now().timestamp() + expires * 60,
                        "data": data
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

    def get(self, id=None, callback=None):
        res = None
        try:
            if id is not None:
                file_path = os.path.join(self.db_path, str(id))
                if os.path.exists(file_path):
                    with open(file_path, "rb") as file:
                        content = jsonpickle.decode(file.read().decode(), keys=True)
                        if content.get('expires', -1) > datetime.now().timestamp():
                            log.info(f"CACHE: {id} {str(content.get('expires', -1) - datetime.now().timestamp())}")
                            res = content.get('data', {})
                        else:
                            os.remove(file_path)
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
                    self.set(res, id=id)
            except:
                log.error(traceback.format_exc())
        return res

    def destroy(self, id, callback=None):
        try:
            file_path = os.path.join(self.db_path, str(id))
            if os.path.exists(file_path):
                os.remove(file_path)
            if callback:
                callback(None, True)
        except:
            log.error(traceback.format_exc())
            if callback:
                callback(True, None)

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

    # Other methods remain the same...


memcache = CacheDB(db_name="memdb")
# cachedb = CacheDB(db_name="cachedb")
# localdb = CacheDB(db_name='localdb')


def clear_cache(caches=None, pattern=None, id=None, engine=memcache):
    """
    Clears the cache by deleting cache files based on the specified criteria.

    Args:
        caches (list, optional): A list of cache filenames to be cleared. Defaults to None.
        pattern (str, optional): A regular expression pattern to match cache filenames. Defaults to None.
        id (str, optional): An identifier for the cache. Defaults to None.
        engine (object, optional): The cache engine to use. Defaults to memcache.

    Returns:
        None

    Comments:
        - If neither `caches` nor `pattern` is provided, the entire cache is cleared using `engine.clear()`.
        - If `caches` or `pattern` is provided, only the matching cache files are deleted using `engine.destroy()`.
        - The cache files are located in the directory specified by `engine.db_path`.
        - The 'stream' file is skipped during cache deletion.
    """
    if caches is None and pattern is None: engine.clear()
    else:
        for filename in os.listdir(engine.db_path):
            if filename == 'stream':
                continue
            if (caches and filename in caches) or (pattern and re.match(pattern, filename)):
                engine.destroy(filename)


def CACHE(id=None, lifespan=CACHE_LIFESPAN, engine=memcache):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            res = None

            if id is None:
                return fn(*args, **kwargs)

            res = engine.get(id='cached_' + id)
            if res is None:
                res = fn(*args, **kwargs)
                engine.set(data=res, id='cached_' + id, expires=lifespan)

            return res

        wrapper.__name__ = f'wrapper_for_{fn.__name__}'
        return wrapper

    return decorator

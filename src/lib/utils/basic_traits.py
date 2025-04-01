# --------------------------------------------------------------------------------------------
# Basic Traits Module
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import os
import re
import base64
import inspect
import traceback
import jsonpickle as json
from cryptography.fernet import Fernet
from datetime import datetime, date
from hashlib import sha256


class class_t(object):

    _kc = []
    _bl = []

    def __init__(self, **args):
        for k, v in args.items():
            setattr(self, k, v.strip() if isinstance(v, str) else v)

    def __str__(self):
        attributes = self.attrs()
        formatted_attrs = [
            f'{attr}: {self._format_value(val)}'
            for attr, val in attributes.items()
        ]
        return '{\n\t' + '\n\t, '.join(formatted_attrs) + '\n}'

    def _format_value(self, val):
        if isinstance(val, list):
            return '[' + ','.join(map(str, val)) + ']'
        return str(val)

    def __repr__(self):
        return self.__str__()

    def _get_attributes(self):
        bl = self.blacklisted()
        return {
            k: v
            for k, v in inspect.getmembers(self)
            if not k.startswith('_')
            and k not in bl
            and callable(v) is False
        }

    def dict(self):
        return self.attrs()

    def cast(self, obj):
        return self.__class__(**obj)

    def blacklisted(self, black_list=None):
        if black_list:
            self._bl = black_list
        return self._bl

    def raw(self):
        return self._get_attributes()

    def attrs(self, bl=[], lcase=False):
        if not bl: bl = []
        bl += self.blacklisted()
        res = {}
        for k, v in self._get_attributes().items():
            if isinstance(v, set): v = list(v)
            if k not in bl: res[k.lower() if lcase else k] = v
        return res

    def hash(self, bl=[], hash=True):
        attrs = self.attrs(bl=bl)
        keys = sorted(attrs.keys())
        temp_str = []
        for key in keys:
            if key != "id" :
                val = attrs.get(key, '')
                if val in [None, 0, '', False]: val = ''
                if isinstance(val, str): temp_str.append("%s:%s" % (key, static_cast.str(val, clear=True)))
                elif isinstance(val, int): temp_str.append("%s:%d" % (key, static_cast.int(val)))
                elif isinstance(val, float): temp_str.append("%s:%d" % (key, static_cast.float(val)))
                elif isinstance(val, datetime): temp_str.append("%s:%s" % (key, val.strftime(static_cast.LONG_DATE)))
                elif isinstance(val, date): temp_str.append("%s:%s" % (key, val.strftime(static_cast.SHORT_DATE)))
        temp_str = re.sub(r"\s+", "", '|'.join(temp_str)).strip()
        return sha256((''.join(temp_str)).encode("utf-8")).hexdigest() if hash else temp_str

    def diff(self, obj, ignore=[]):
        if not isinstance(obj, class_t): return True
        res = {}
        ignore = ignore or []
        for k, v in self.attrs(bl=ignore).items():
            x = getattr(obj, k, None)
            v = v if v else None
            x = x if x else None
            if v != x:
                res[k] = (v, x)
        return res if len(res.keys()) else False

    def classname(self):
        return self.__class__.__name__

    def to_str(self):
        try:
            return json.encode(self.attrs())
        except Exception:
            return None

    def has(self, attr: str) -> bool:
        return hasattr(self, attr)

    def nestify(self, path, default_value=None):
        if path:
            if isinstance(path, str):
                path = path.split(".")
            current = self
            for key in path[:-1]:
                current = current.setdefault(key, {})
            current.setdefault(path[-1], default_value)
        return self

    def nested(self, path, default_value=None):
        if path:
            if isinstance(path, str):
                path = path.split(".")
            current = self
            for key in path:
                try:
                    current = current[key]
                except KeyError:
                    return default_value
        return current

    @staticmethod
    def from_str(s):
        try:
            return class_t(**json.decode(s))
        except Exception:
            return class_t()


class SingletonT(class_t):

    _instances = {}

    def __new__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(SingletonT, cls).__new__(cls, *args, **kwargs)
        return cls._instances[cls]


class DBResponseT(class_t):

    def __init__(self, cols=[], rows=[], **args):
        self.cols = cols
        self.rows = rows
        super().__init__(**args)

    def dict(self):
        try:
            return {"cols": self.cols, "rows": [item.attrs() for item in self.rows]}
        except Exception:
            return {"cols": self.cols, "rows": self.rows}


class api_response_t(class_t):

    def make_response(self, code=200, message=None):
        if message:
            self.messages.append(message)
        self.messages = list(set(self.messages))
        return self.attrs(), code if self.status else 402

    def response(self, code=200, message=None):
        return self.make_response(code, message)

    @staticmethod
    def gen_response(status: bool = True, message: str = None, data: any = None, code: int = 200):
        self = api_response_t()
        self.status = status
        if message: self.messages.append(message)
        if data: self.data = data
        return self.make_response(code=code)

    def __init__(self, **args):
        super().__init__(**args)
        if not args.get('data'): self.data = None
        if not args.get('status'): self.status = False
        if not args.get('messages'): self.messages = []


class static_cast:

    SAP_DATE = "%d.%m.%Y"
    BR_DATE = "%d/%m/%Y"
    STD_DATE = SHORT_DATE = "%Y-%m-%d"
    LONG_DATE = ISO_DATE = "%Y-%m-%d %H:%M:%S"
    ID_DATE = "%Y%m%d%H%M%S"
    ISOT_DATE = "%Y-%m-%dT%H:%M:%S"
    PATH_DATE = f"%Y{os.path.sep}%m{os.path.sep}%d"

    @staticmethod
    def str(s, clear=False):
        try:
            return re.sub(r'\s+', ' ', re.sub(r'["\'`]', ' ', str(s))).strip()
        except Exception:
            return ''

    @staticmethod
    def float(n):
        n = static_cast.str(n)
        try:
            n = float(n)
        except:
            try:
                n = float(n.replace(".", "").replace(",", "."))
            except:
                return 0.0
        return n

    @staticmethod
    def int(n):
        n = static_cast.str(n)
        try:
            return 0 if not n else int(n.replace(".", "").replace(",", "."))
        except Exception:
            return 0

    """
    Converts a string, date, or datetime object to a datetime object.

    Args:

        s (str | date | datetime):
            The input to be converted. It can be a string representing a date,
            in ay of the predefined formats included on the static_cast class,
            a date object, or a datetime object.

        time (bool, optional):
            If True, the time part of the datetime will be set to the current time.
            If False, the time part will be set to 00:00:00.
            Defaults to True.

    Returns:
        datetime: The converted datetime object. If the input is a string and cannot be parsed, returns None.

    Raises:
        ValueError: If the string cannot be parsed into a date using the predefined formats.
    """
    @staticmethod
    def date(s: any, time: bool = True) -> datetime:
        if isinstance(s, (datetime, date)):
            return datetime.combine(s, datetime.min.time()) if not time else datetime.combine(s, datetime.now().time())
        date_formats = []
        static_cast_dict = static_cast.__dict__
        for k in static_cast_dict:
            if not k.startswith('_') and not callable(static_cast_dict[k]) and isinstance(static_cast_dict[k], str):
                date_formats.append(static_cast_dict[k])
        for date_fmt in date_formats:
            try:
                parsed_date = datetime.strptime(s.strip(), date_fmt)
                if not time:
                    parsed_date = parsed_date.replace(hour=0, minute=0, second=0, microsecond=0)
                return parsed_date
            except ValueError:
                continue
        return None

    @staticmethod
    def json(obj):
        try:
            if type(obj) is str:
                return json.decode(obj)
            else:
                return json.encode(obj)
        except Exception:
            return None

    @staticmethod
    def encrypt(obj):
        from utils.cache import localstore
        _fernet_key = localstore.getif('fernet_key', func=lambda: Fernet.generate_key())
        _fernet = Fernet(_fernet_key)
        try:
            if isinstance(obj, (dict, list)):
                obj = json.dumps(obj)
            if isinstance(obj, str):
                obj = obj.encode('utf-8')
            encrypted = _fernet.encrypt(obj)
            return base64.b64encode(encrypted).decode('utf-8')
        except Exception:
            return None

    @staticmethod
    def decrypt(obj):
        from utils.cache import localstore
        _fernet_key = localstore.getif('fernet_key', func=lambda: Fernet.generate_key())
        _fernet = Fernet(_fernet_key)
        try:
            decoded = base64.b64decode(obj)
            decrypted = _fernet.decrypt(decoded).decode('utf-8')
            try:
                return json.loads(decrypted)
            except:
                return decrypted
        except Exception:
            from utils.log import log
            log.error(traceback.format_exc())
            return None


class Stats:

    def interpolate(self, x, y, x1, y1, x2, y2):
        return y1 + (x - x1) * (y2 - y1) / (x2 - x1)

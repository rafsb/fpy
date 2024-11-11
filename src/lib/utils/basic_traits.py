import re
import inspect
import jsonpickle as json
from datetime import datetime, date


class ClassT(object):

    _kc = ['id']
    _bl = ['_Cursor']

    def __init__(self, **args):
        self.id = -1
        self._Cursor = None
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

    def dict(self):
        return self.attrs()

    def cast(self, obj):
        return self.__class__(**obj)

    def blacklisted(self, black_list=None):
        if black_list:
            self._bl = black_list
        return self._bl + ['conn', 'cursor', '_kc', '_bl', '_Cursor']

    def values(self):
        attributes = self._get_attributes()
        return [
            self._cast_value(v)
            for v in attributes.values()
        ]

    def _cast_value(self, value):
        if isinstance(value, str):
            return StaticCast.str(value)
        if isinstance(value, datetime):
            return StaticCast.date(value)
        return value

    def raw(self):
        return self._get_attributes().items()

    def attrs(self, bl=[], lcase=False):
        bl = bl + self.blacklisted() if bl else self.blacklisted()
        attrs = {
            k.strip()
            if lcase is False
            else k.strip().lower(): (v.strip() if isinstance(v, str) else (v if v != '' else None))
            for k, v in self.__dict__.items()
            if k not in bl and not k.startswith('_')
        }
        return attrs

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
            return ClassT(**json.decode(s))
        except Exception:
            return ClassT()

    def _get_attributes(self):
        return {
            k: v
            for k, v in inspect.getmembers(self)
            if not k.startswith('__') and k not in self.blacklisted() and not inspect.ismethod(v)
        }


class SingletonT(ClassT):

    _instances = {}

    def __new__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(SingletonT, cls).__new__(cls, *args, **kwargs)
        return cls._instances[cls]


class ResponseT(ClassT):

    def __init__(self, cols=[], rows=[], **args):
        self.cols = cols
        self.rows = rows
        super().__init__(**args)

    def dict(self):
        try:
            return {"cols": self.cols, "rows": [item.attrs() for item in self.rows]}
        except Exception:
            return {"cols": self.cols, "rows": self.rows}


class StaticCast:

    SAP_DATE = "%d.%m.%Y"
    BR_DATE = "%d/%m/%Y"
    STD_DATE = SHORT_DATE = "%Y-%m-%d"
    LONG_DATE = "%Y-%m-%d %H:%M:%S"
    DATE_AS_ID = "%Y%m%d%H%M%S"

    @staticmethod
    def str(s, clear=False):
        try:
            return re.sub(r'\s+', ' ', re.sub(r'["\'`]', ' ', str(s))).strip()
        except Exception:
            return ''

    @staticmethod
    def float(n):
        n = StaticCast.str(n)
        try:
            return 0.0 if not n else float(n.replace(".", "").replace(",", "."))
        except Exception:
            return 0.0

    @staticmethod
    def int(n):
        n = StaticCast.str(n)
        try:
            return 0 if not n else int(n.replace(".", "").replace(",", "."))
        except Exception:
            return 0

    @staticmethod
    def date(s, fmt=None):
        try:
            if isinstance(s, (datetime, date)):
                if isinstance(s, date):
                    s = datetime.strptime(s.strftime(fmt or StaticCast.STD_DATE), StaticCast.STD_DATE)
                return s
            return datetime.strptime(s.strip(), fmt or StaticCast.STD_DATE)
        except Exception:
            return None

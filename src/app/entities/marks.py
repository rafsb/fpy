import os
from interfaces.table_traits import table_t


class marks(table_t):
    _kc = ['mark', 'hash', 'ts']

    def __init__(self, **kwargs):
        super(marks, self).__init__(**kwargs)
        if not kwargs.get('user', None):
            self.user = os.environ.get('USERNAME')

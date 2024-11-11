import os
from datetime import datetime
from interfaces.table_traits import table_t


class marks(table_t):
    _kc = ['mark', 'hash', 'ts']

    def __init__(self, **kwargs):
        super(marks, self).__init__(**kwargs)
        if not kwargs.get('user', None):
            self.user = os.environ.get('USERNAME')

    def save(self):
        self.ts = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        return super(marks, self).save()

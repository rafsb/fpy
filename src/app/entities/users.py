from hashlib import sha256
from interfaces.table_traits import table_t


class users(table_t):

    _kc = ['username']

    def save(self):
        self.pswd = sha256(self.pswd.encode()).hexdigest()
        super().save()

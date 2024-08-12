from os import path


class controller :

    def __init__(self, entity=None) :
        self._Entity = entity

    def _list(self, args=None):
        return self._Entity().fetch(args)

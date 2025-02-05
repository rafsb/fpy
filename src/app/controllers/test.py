class test():

    @staticmethod
    def init() -> str:
        return 'hello world'


def register(app, args=None):

    @app.get('/test')
    def _test() -> str: return test.init()

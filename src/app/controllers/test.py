from entities.marks import marks
import pandas as pd
from jsonpickle import decode
from datetime import datetime
from utils.gauge import gauge


class test():

    @staticmethod
    def init() -> str:

        df = pd.read_excel('src/etc/cost.xlsx', sheet_name='costs')
        costs_json = decode(df.to_json(orient='records'))
        ls = []
        ln = len(costs_json)
        for i, cost in enumerate(costs_json):
            ls.append(marks(**{
                "ts": datetime.fromtimestamp(cost['Mês'] * 1 / 1000)
                , "user": "SYNC"
                , "mark": "cost"
                , "value": cost['Cost (USD/pallet)']
                , "ref": cost['ID']
            }))
            gauge((i + 1) / ln, 'Loading costs')
        for i, mark in enumerate(ls):
            mark.save()
            gauge((i + 1) / ln, 'Saving costs')
        return 'hello world'


def register(app, args=None):

    @app.get('/test')
    def _test() -> str: return test.init()

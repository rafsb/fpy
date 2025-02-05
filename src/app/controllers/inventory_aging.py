import os
from hashlib import md5
from jsonpickle import encode
from flask import request
from datetime import datetime, timedelta
from interfaces.controller import controller
from entities.inventory_aging import (
    inventory_aging as entity
    , inventory_view
    , inventory_historical_view
    , inventory_partial_view
)
from entities.marks import marks
from utils.basic_traits import StaticCast, ClassT
from utils.cache import cache
from utils.log import log


class inventory_aging(controller):

    @staticmethod
    def cols():
        return inventory_view().columns()

    @staticmethod
    def rows(args={}):
        # try: return [ {
        #     "department_name": x.department_name
        #     , "qty": x.qty
        #     , "lifespan": x.lifespan
        #     , "period": x.period
        #     , "sku_size": x.sku_size
        # } for x in inventory_view().fetch(columns=[
        #     "department_name"
        #     , "qty"
        #     , "lifespan"
        #     , "period"
        #     , "sku_size"
        # ], **args).rows]
        # except: return []
        print(args)
        rows = inventory_view().fetch(**args).rows
        return [x.attrs() for x in rows] if rows else []

    @staticmethod
    def distincts(column, args={}):
        return inventory_view().distincts(column=column, args=args)

    @staticmethod
    def sync():
        entity().sync()

    @staticmethod
    def sync_at(args=None):
        ts = args[0]
        try:
            ts = datetime.strptime(ts, StaticCast.SHORT_DATE)
            log.info(f"{entity().__class__} sync at {ts.strftime(StaticCast.SHORT_DATE)}")
        except: ts = None
        entity().sync(ts)

    @staticmethod
    def rebuild():
        entity().empty()
        for root, dirs, files in os.walk(entity.SYNC_PATH):
            for file in files:
                entity().sync(date_at=datetime.strptime(file.split('.')[0], StaticCast.SHORT_DATE))

    @staticmethod
    def from_excel():
        entity().from_excel()


def register(app, args=None):

    @app.get('/inventory_aging/cols')
    # @CACHE('inventory_aging_cols', 60 * 60 * 24)
    def _inventory_aging_cols():
        return [
            'obsolete'
            , 'sku_code'
            , 'plant'
            # , 'status'
            , 'period'
            # , 'lifespan'
            # , 'sku_size'
            # , 'sku_desc'
            # , 'abc'
            # , 'ag'
            # , 'flag'
            # , 'warehouse'
            , 'customer'
            # , 'quality'
            # , 'blocked'
            , 'demmand'
            , 'fcst'
            , 'available'
            , 'charge_storage'
            , 'actions'
            # , 'department_name'
            # , 'hash'
            , 'ref'
        ]

    @app.get('/inventory_partial_view/cols')
    def _inventory_partial_view_cols():
        return _inventory_aging_cols()

    @app.post('/inventory_aging/rows')
    def _inventory_aging_rows():
        args = {}
        try: args = request.json
        except: args = {}
        try: del args['_ts']
        except: pass
        hash = md5(str(encode(args)).encode()).hexdigest()
        res = cache.get(id=f'inventory_aging_rows_{hash}')
        if res: return res
        res = inventory_aging().rows(args)
        cache.set(res, id=f'inventory_aging_rows_{hash}', expires=60 * 60 * 24)
        return res
    
    @app.post('/inventory_partial_view/rows')
    def _inventory_partial_view_rows():
        args = {}
        try: args = request.json
        except: args = {}
        try: del args['_ts']
        except: pass
        hash = md5(str(encode(args)).encode()).hexdigest()
        res = cache.get(id=f'inventory_partial_view_rows_{hash}')
        if res: return res
        rows = inventory_partial_view().fetch(**args).rows
        res = [x.attrs() for x in rows] if rows else []
        cache.set(res, id=f'inventory_partial_view_rows_{hash}', expires=60 * 60 * 24)
        return res

    @app.get('/inventory_aging/distinct/<column>')
    def _inventory_aging_distinct(column):
        # res = cache.get(id=f'inventory_aging_distinct_{column}')
        # if res: return res
        res = inventory_view().distincts(column=column, args=dict(**request.args) or {})
        # cache.set(res, id=f'inventory_aging_distinct_{column}', expires=60 * 60 * 24)
        return res

    @app.get('/inventory_partial_view/distinct/<column>')
    def _inventory_partial_view_distinct(column):
        return _inventory_aging_distinct(column)

    @app.get('/inventory_aging/sync')
    def _inventory_aging_sync():
        return inventory_aging().sync()

    @app.post('/inventory_aging/worms')
    def _history_worms():
        tmp = inventory_historical_view().execute("""
            SELECT t.ts, t.status, sum(t.qty) qty
            FROM (
                SELECT
                    ts
                    , qty
                    , CASE
                        WHEN lifespan <= 180 THEN 'healthy'
                        ELSE 'obsolete'
                    END AS status
                FROM inventory_historical_view
                WHERE ts >= DATEADD(DAY, -365, GETDATE())
            ) t
            GROUP BY t.ts, t.status
            ORDER BY t.ts DESC
        """).rows

        limit = 12
        overall = [0] * limit
        sick = [0] * limit
        relative = [0] * limit

        for index, x in enumerate(tmp):
            if index >= limit: break
            overall[index] += x.qty
            if x.status == 'obsolete': sick[index] += x.qty
            relative[index] = round(sick[index] / overall[index] * 100, 2) if overall[index] else 0

        return [ overall, sick, relative ]

    @app.post('/inventory_aging/history')
    def _history():
        package = request.json
        del package['_ts']
        if package.get('filters') and package['filters'].get('ts'):
            package['filters']['ts'] = (package['filters']['ts'], None, '>=')
        tmp = inventory_historical_view().fetch(**package).rows
        res = {}
        if tmp:
            dates = [(datetime.now() - timedelta(days=d)).strftime(StaticCast.STD_DATE) for d in range(0, 10)]
            print(dates)
            for date in dates:
                ClassT.nestify(res, date, { "qty": 0, "items": [], 'marks': [] })
            for item in tmp:
                date = item.ts.strftime(StaticCast.STD_DATE)
                if date in dates:
                    res[date]['items'].append(item.attrs())
                    res[date]['qty'] += item.qty
            for mark in marks().fetch().rows:
                date = mark.ts.strftime(StaticCast.STD_DATE)
                if date in dates:
                    res[date]['marks'].append(mark.attrs())
        return res

    @app.post('/inventory_aging/update')
    def _update():
        package = request.json
        del package['_ts']
        if package.get('hash'):
            hash = package['hash']
            del package['hash']
            if len(entity().fetch(filters={ 'hash': hash }).rows):
                for k, v in package.items():
                    marks(**{
                        'hash': hash
                        , 'mark': k
                        , 'note': package.get('note', None)
                        , 'status': package.get('status', None)
                        , 'value': v
                    }).save()
        return 'ok'

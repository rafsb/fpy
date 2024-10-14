from flask import request
from datetime import datetime, timedelta
from interfaces.controller import controller
from entities.inventory_aging import inventory_aging as entity, inventory_view, inventory_historical_view
from entities.marks import marks
from utils.basic_traits import StaticCast, ClassT


class inventory_aging(controller):

    @staticmethod
    def cols():
        return inventory_view().columns()

    @staticmethod
    def rows(args={}):
        try: return [x.attrs() for x in inventory_view().fetch(**args).rows]
        except: return []

    @staticmethod
    def distincts(column, args={}):
        return inventory_view().distincts(column=column, args=args)

    @staticmethod
    def sync():
        entity().sync()


def register(app, args=None):

    @app.get('/inventory_aging/cols')
    # @CACHE('inventory_aging_cols', 60 * 60 * 24)
    def _inventory_aging_cols():
        return [
            'period',
            # 'lifespan',
            'sku_code',
            'status',
            # 'sku_size',
            # 'sku_desc',
            # 'abc',
            'plant',
            # 'ag',
            # 'flag',
            # 'warehouse',
            'customer',
            # 'quality',
            # 'blocked',
            'available',
            'obsolete',
            'actions',
            # 'department_name',
            # 'charge_storage'
        ]

    @app.post('/inventory_aging/rows')
    def _inventory_aging_rows():
        args = {}
        try: args = request.json
        except: args = {}
        try: del args['_ts']
        except: pass
        return inventory_aging().rows(args)

    @app.get('/inventory_aging/distinct/<column>')
    def _inventory_aging_distinct(column):
        return inventory_aging().distincts(column=column, args=dict(**request.args) or {})

    @app.get('/inventory_aging/sync')
    def _inventory_aging_sync():
        return inventory_aging().sync()

    @app.post('/inventory_aging/history')
    def _history():
        package = request.json
        del package['_ts']
        if package.get('filters') and package['filters'].get('ts'):
            package['filters']['ts'] = (package['filters']['ts'], None, '>=')
        tmp = inventory_historical_view().fetch(**package).rows
        dates = [(datetime.now() - timedelta(days=d)).strftime(StaticCast.STD_DATE) for d in range(0, 10)]
        res = {}
        for date in dates:
            ClassT.nestify(res, date, { "qty": 0, "items": [] })
        for item in tmp:
            date = item.ts.strftime(StaticCast.STD_DATE)
            if date in dates:
                res[date]['items'].append(item.attrs())
                res[date]['qty'] += item.qty
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
                    mark = marks(**{
                        'hash': hash
                        , 'mark': k
                        , 'note': package.get('note', None)
                        , 'status': package.get('status', None)
                        , 'value': v
                    }).save()
                    print(mark)
        return 'ok'

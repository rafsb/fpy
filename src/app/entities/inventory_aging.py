import os
import re
# import traceback
import jsonpickle
from datetime import datetime
from interfaces.table_traits import table_t, view_t
from entities.marks import marks
from utils.basic_traits import StaticCast
from utils.sizes import guess
from utils.gauge import gauge
from utils.merge import merge
from utils.log import log


class inventory_aging(table_t):
    _bl = ["id"]
    _kc = [
        "sku_code"
        , "lot"
        , "plant"
        , "ag"
        , "warehouse"
        , "flag"
        , "status"
        , "ts"
    ]
    _ref = [
        "sku_code"
        , "lot"
        , "plant"
        , "ag"
        , "warehouse"
        , "flag"
        , "status"
    ]

    def ref_hash(self, char=';'):
        _k = []
        for k in self._ref:
            v = getattr(self, k, '')
            if v in [None, 0, '', False]: v = ''
            _k.append("%s" % str(v).strip())
        return char.join(_k)

    SYNC_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'var', 'tmp', 'syncs')
    BASE_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'etc', 'base.xlsx')

    def from_excel(self, file_path=BASE_FILE_PATH):
        # marks().empty()
        import pandas as pd
        df = pd.read_excel(file_path)
        rows = jsonpickle.decode(df.to_json(orient='records'))
        now = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        started_at = datetime.now()
        marks_lst = []
        items_lst = []
        for i, row in enumerate(rows):
            item = inventory_aging(**{
                'sku_code'      : row['sku'].strip()
                , 'status'      : re.sub('0', 'O', row['status_2']).strip().upper()
                , 'ag'          : str(row['ag_code']).strip() or None
                , 'sku_desc'    : row['sku_description'].strip()
                , 'sku_size'   : guess(row['sku'].strip())
                , 'plant'       : row['plant'].strip()
                , 'warehouse'   : row['warehouse'].strip()
                , 'available'   : float(row['available'] or 0)
                , 'quality'     : float(row['quality'] or 0)
                , 'blocked'     : float(row['blocked'] or 0)
                , 'qty'         : float(row['volume_total'] or 0)
                , 'flag'        : row['special_flag'].strip().upper() or None
                , 'customer_1'  : row['customer_1'].strip()
                , 'customer_2'  : row['customer_2'].strip()
                , 'sku_label'   : row['label'].strip()
                , 'aging'       : int(row['aging_days'] or 0)  
                , 'abc'         : row['ABC_bpsa'].strip()
                , 'lot'         : row['lot'].strip() 
                , 'pallet_size' : float(row['pallet_default']) if row['pallet_default'] else None
                , 'period'      : row['aging_period'].strip()
                , 'ts'          : datetime.fromtimestamp(int(row['date']) / 1000)
                , 'fcst'        : float(row['fcast_siop_actual'] or 0)
                , 'balance'     : float(row['stock_balance_siop_sap'] or 0)
                , 'demmand'     : float(row['orders_sap_actual'] or 0)
                , 'last_production': datetime.strptime(row['last_production'], StaticCast.SHORT_DATE) if row['last_production'] else None
            })

            item.hash = item.row_key()
            item.ref = item.ref_hash()

            if row['SKU é obsoleto?'].lower() == 'sim':
                marks_lst.append(marks(**{
                    "hash": item.ref
                    , "mark": 'obsolete'
                    , "value": 1
                    , "ts": now
                }))

            def save_dept(value):
                marks_lst.append(marks(**{
                    "value": value
                    , "hash": item.ref
                    , "ts": now
                    , "mark": 'department'
                }))

            resp = row['De quem é a responsabildiade?']
            if resp == 'Vendável': save_dept(1)
            if resp == 'Customer': save_dept(2)
            if resp == 'Industrial': save_dept(3)
            if resp == 'Fulfillment': save_dept(4)
            if resp == 'Qualidade': save_dept(5)
            if resp == 'Planejamento': save_dept(6)

            tmp = row['Qual volume devemos cobrar armazenagem?']
            try:
                if tmp and float(tmp) > 0:
                    marks_lst.append(marks(**{
                        "hash": item.ref
                        , "mark": 'charge_storage'
                        , "value": float(tmp)
                        , "ts": now
                    }))
            except:
                pass

            if row['Ações para escoamento']:
                marks_lst.append(marks(**{
                    "hash": item.ref
                    , "mark": 'action'
                    , "value": row['Ações para escoamento']
                    , "note": row['Comentários']
                    , "ts": now
                }))

            if row['Prazo de escoamento']:
                try: tmp = datetime.fromtimestamp(int(row['Prazo de escoamento']) / 1000)
                except:
                    try: tmp = datetime.strptime(row['Prazo de escoamento'], StaticCast.STD_DATE)
                    except: 
                        try: tmp = datetime.strptime(row['Prazo de escoamento'], StaticCast.BR_DATE)
                        except:
                            try: tmp = datetime.strptime(row['Prazo de escoamento'], StaticCast.SHORT_DATE)
                            except: tmp = None
                if tmp:
                    marks_lst.append(marks(**{
                        "hash": item.ref
                        , "mark": 'limit_date'
                        , "value": tmp.strftime(StaticCast.SHORT_DATE)
                        , "ts": now
                    }))

            if row['Responsável pela ação']:
                marks_lst.append(marks(**{
                    "hash": item.ref
                    , "mark": 'user_assigned'
                    , "value": row['Responsável pela ação']
                    , "ts": now
                }))

            items_lst.append(item)

            gauge(i / len(rows), suffix="parsing rows %s/%s, elapsed time: %s" % (i, len(rows), datetime.now() - started_at))
        gauge(1, suffix="parsing rows %s/%s, elapsed time: %s" % (i, len(rows), datetime.now() - started_at))

        # marks().bulk_insert(marks_lst)
        # merge(items_lst, inventory_aging().fetch().rows, delete_if_not_exists=False)
        if marks_lst:
            merge(marks_lst, marks().fetch().rows, delete_if_not_exists=False)

    def sync(self, date_at=None):

        init = datetime.now()
        print("inventory_aging sync initialized at %s" % init)

        class inventory_aging_00h(table_t): _Database = "dm"

        ts = date_at or datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        tmp_file_name = os.path.join(os.path.dirname(__file__), '..', '..', 'var', 'tmp', 'syncs', f'{ts.strftime(StaticCast.SHORT_DATE)}.json')

        if not os.path.exists(tmp_file_name):
            db_data = inventory_aging_00h().execute(sql="""
                SELECT DISTINCT
                    [date] ts
                    , [sku] sku_code
                    , [sku_description] sku_desc
                    , [label] sku_label
                    , [size] sku_size
                    , [ABC_bpsa] abc
                    , [plant]
                    , [lot]
                    , [ag_code] ag
                    , [warehouse]
                    , [special_flag] flag
                    , [status_2] status
                    , [customer_1]
                    , [customer_2]
                    , [aging_days] aging
                    , [aging_period] period
                    , [last_production]
                    , [pallet_default] pallet_size
                    , [available]
                    , [quality]
                    , [blocked]
                    , [fcast_siop_actual] fcst
                    , [volume_total] qty
                    -- , [tp_produto]
                    -- , [region_stock]
                    -- , [warehouse]
                    -- , [value_unit]
                    -- , [volume_ibp]
                    -- , [ABC_region]
                    -- , [pallets_ibp]
                    -- , [sku_dist]
                    -- , [dist]
                    -- , [wooden_pallets]
                    -- , [plant_lot]
                    -- , [or_last_prod]
                    -- , [net_stock]
                    -- , [pallets_net_stock]
                    -- , [coord_cff]
                    -- , [orders_sap_actual]
                    -- , [stock_bala    nce_siop_sap]
                    -- , [status_fcast_actual]
                    -- , [status_3]
                    -- , [status_OSM]
                FROM
                    [dm].[dbo].[Inventory_aging_00h]
            """)
            rows = db_data.rows
            encoded_rows = jsonpickle.encode([x.attrs(lcase=True) for x in rows])
            with open(tmp_file_name, 'w', encoding='utf-8') as f:
                f.write(encoded_rows)

        rows = []
        with open(tmp_file_name, 'r', encoding='utf-8') as f:
            tmp_rows = [inventory_aging(**x) for x in jsonpickle.decode(f.read())]
            tmp_dict = {}
            for x in tmp_rows:
                tmp_dict[x.row_key()] = x
            rows = list(tmp_dict.values())

        if rows:
            items = []
            length = len(rows)
            for i, item in enumerate(rows, start=1):
                item.sku_size = guess(item.sku_code)
                item.status = str(item.status).replace('0', 'O').strip()
                try: item.ts = item.ts.replace(hour=0, minute=0, second=0, microsecond=0)
                except:
                    try: item.ts = datetime.strptime(item.ts, StaticCast.STD_DATE).replace(hour=0, minute=0, second=0, microsecond=0)
                    except:
                        try: item.ts = datetime.strptime(item.ts, StaticCast.BR_DATE).replace(hour=0, minute=0, second=0, microsecond=0) 
                        except:
                            log.error(f"Could not parse date for {item.ts}")
                            continue
                item.hash = item.row_key()
                item.ref = item.ref_hash()
                items.append(item)
                gauge(i / length, suffix="parsing rows %s/%s, elapsed time: %s" % (i, length, datetime.now() - init))
            merge(items, inventory_aging().fetch().rows, delete_if_not_exists=False)


class inventory_view(view_t): pass


class inventory_partial_view(view_t): pass


class inventory_historical_view(view_t): pass

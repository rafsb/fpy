import os
import re
import jsonpickle
from datetime import datetime
from interfaces.table_traits import table_t, view_t
from utils.basic_traits import StaticCast
from utils.sizes import guess
from utils.gauge import gauge


class inventory_aging(table_t):
    _bl = ["id"]
    _kc = [
        "sku_code"
        , "lot"
        , "plant"
        , "ag"
        , "warehouse"
        , "flag"
        , "customer_1"
        , "ts"
        , "status"
    ]

    def sync(self, use_tmp_json=True):

        init = datetime.now()
        print("inventory_aging sync initialized at %s" % init)

        class inventory_aging_00h(table_t): _Database = "dm"

        class inventory_departments(table_t): _bl = ["id"]

        class marks(table_t): _bl = ["id"]

        tmp_file_name = f'tmp-{datetime.now().strftime(StaticCast.SHORT_DATE)}.json'

        if use_tmp_json and os.path.exists(tmp_file_name):
            with open(tmp_file_name, 'r', encoding='utf-8') as f:
                rows = [inventory_aging(**x) for x in jsonpickle.decode(f.read())]
        else:
            db_data = inventory_aging_00h().execute(sql="""
                SELECT
                    [sku] sku_code
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
                FROM
                    [dm].[dbo].[Inventory_aging_00h]
            """)
            rows = db_data.rows
            encoded_rows = jsonpickle.encode([x.attrs(lcase=True) for x in rows])
            with open(tmp_file_name, 'w', encoding='utf-8') as f:
                f.write(encoded_rows)

        if rows:
            # inventory_departments().empty()
            # inventory_aging().empty()
            # marks().empty()

            items = []
            marks_lst = {}
            depts_lst = {}
            length = len(rows)
            ts = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            for i, item in enumerate(rows, start=1):
                gauge(i / length, suffix="parsing rows %s/%s, elapsed time: %s" % (i, length, datetime.now() - init))
                hash = item.row_key()
                item.hash = hash
                item.sku_size = guess(item.sku_code)
                item.status = str(item.status).replace('0', 'O').strip()
                item.ts = ts

                # for j in range(0, 10):
                #     nitem = deepcopy(item)
                #     rdm = random.uniform(0, 0.2)
                #     for k in ["available", "quality", "blocked", "fcst", "qty", "pallet_size"]:
                #         setattr(nitem, k, round(max(0, float(getattr(nitem, k, 0) or 0) * 1000 * ((.9 + rdm) if j > 0 else 1)), 3))
                #     nitem.ts = (datetime.now() - timedelta(days=j)).replace(hour=0, minute=0, second=0, microsecond=0)
                #     # inventory_aging(**nitem.attrs()).save()
                #     items.append(nitem)

                if item.status in [ "O1", "O2" ]:
                    marks_lst[hash] = marks(**{
                        "hash": hash
                        , "mark": 'obsolete'
                        , "value": 1
                        , "ts": ts
                    })

                tmp_department = None
                # available
                if re.findall("bright", item.sku_code.lower()) and item.blocked is None:
                    tmp_department = inventory_departments(department_id=1)
                # industrial
                if item.warehouse == "0702":
                    tmp_department = inventory_departments(department_id=2)
                # quality
                if item.warehouse == "0704":
                    tmp_department = inventory_departments(department_id=5)

                if tmp_department:
                    tmp_department.hash = hash
                    tmp_department.ts = ts
                    depts_lst[hash] = tmp_department

                items.append(item)

            inventory_aging().query(f"DELETE FROM [dbo].[inventory_aging] WHERE [ts] = '{ts.strftime(StaticCast.SHORT_DATE)}'")
            inventory_aging().bulk_insert(items)
            marks().bulk_insert(marks_lst.values())
            inventory_departments().bulk_insert(depts_lst.values())

            gauge(1, suffix="inventory_aging sync finished, elapsed time: %s" % (datetime.now() - init))


class inventory_view(view_t): pass


class inventory_historical_view(view_t): pass

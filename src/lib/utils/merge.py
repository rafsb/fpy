# --------------------------------------------------------------------------------------------
# Merge new data with existing data in the database using the row_key() and row_hash() methods.
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import traceback
from time import time
from utils.gauge import gauge
from utils.log import log


def merge(new_data_list, db_data_list, delete_if_not_exists=True) :

    start_time = time()

    # Organizar a lista do new_data_list em dicionário indexado pela chave (função row_key que vai ser passada pela chave)
    kept    = 0
    changed = 0
    deleted = 0
    new_data = {}
    to_insert = []
    to_update = []
    to_delete = []

    try: tmp_class = db_data_list[0].__class__
    except:
        try: tmp_class = new_data_list[0].__class__
        except: return log.warn('Could nor determine class type for merge')

    tmp_class_name = tmp_class.__name__

    length = len(new_data_list)
    for i, d in enumerate(new_data_list, start=1):
        try:
            if not isinstance(d, tmp_class): d = tmp_class(**d)
        except: pass
        new_data[d.row_key()] = d
        gauge(i / length, suffix=f'[{tmp_class_name.upper()}] {i}/{length} - generating new hashtable')

    length = len(db_data_list) if db_data_list else 0
    if length:
        for i, d in enumerate(db_data_list, start=1):
            try:
                if not isinstance(d, tmp_class): d = tmp_class(**d)
            except: pass

            row_key = d.row_key()
            tmp_row = new_data.get(row_key, None)

            if not tmp_row:
                if delete_if_not_exists:
                    to_delete.append(d)
                    deleted += 1
            elif tmp_row.row_hash() != d.row_hash():
                if getattr(d, 'id', None):
                    tmp_row.id = d.id
                to_update.append(tmp_row)
                changed += 1
                del new_data[row_key]
            else:
                del new_data[row_key]
                kept += 1

            gauge(i / length, suffix=f'[{tmp_class_name.upper()}] {i}/{length} - k:{kept}/c:{changed}/d:{deleted} - comparing new and old hashes')

    try:
        for d in list(new_data.values()): to_insert.append(d)
        if to_delete: tmp_class().bulk_del(rows=to_delete)
        if to_insert: tmp_class().bulk_insert(rows=to_insert)
        if to_update: tmp_class().bulk_update(rows=to_update)
    except:
        log.error(traceback.format_exc())

    log.stream("[%s] Kept: %s Changed: %s Deleted: %s New: %s in %.2f seconds" % (tmp_class_name, kept, changed, deleted, len(new_data), time() - start_time))

    return True

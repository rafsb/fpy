import traceback
from time import time
from utils.gauge import gauge
from utils.log import log


def merge(new_data_list, db_data_list, delete_if_not_exists=True) :

    start_time = time()

    # Organizar a lista do new_data_list em dicionário indexado pela chave (função row_key que vai ser passada pela chave)
    changed = 0
    deleted = 0
    kept    = 0
    newdatadict = {}
    to_insert = []
    to_update = []
    to_delete = []

    try: temp_class = db_data_list[0].__class__
    except:
        try: temp_class = new_data_list[0].__class__
        except: temp_class = None

    if not temp_class: return log.warn('Could nor determine class type for merge')

    temp_class_name = temp_class.__name__

    length = len(new_data_list)
    for i, d in enumerate(new_data_list, start=1):
        hash = d.row_key()
        newdatadict[hash] = d
        gauge(i / length, '', f'[{temp_class_name.upper()}] {i}/{length} - generating new hashtable')

    length = len(db_data_list) if db_data_list else 0
    if length:
        for i, d in enumerate(db_data_list, start=1):
            tmpkey = d.row_key()
            tempnewdata = newdatadict.get(tmpkey, None)

            if tempnewdata is None:
                if delete_if_not_exists:
                    to_delete.append(d)
                    deleted += 1
            elif tempnewdata.row_hash() != d.row_hash():
                if getattr(d, 'id', None): tempnewdata.id = d.id
                to_update.append(tempnewdata)
                del newdatadict[tmpkey]
                changed += 1
            else:
                del newdatadict[tmpkey]
                kept += 1

            gauge(i / length, '', f'[{temp_class_name.upper()}] {i}/{length} - k:{kept}/c:{changed}/d:{deleted} - comparing old and new hashes')

    try:
        for d in list(newdatadict.values()): to_insert.append(d)
        if to_delete: temp_class().bulk_del(rows=to_delete)
        if to_insert: temp_class().bulk_insert(rows=to_insert)
        if to_update: temp_class().bulk_update(rows=to_update)
    except:
        log.error(traceback.format_exc())

    log.info("[%s] Kept: %s Changed: %s Deleted: %s New: %s in %.2f seconds" % (temp_class_name, kept, changed, deleted, len(newdatadict), time() - start_time))

    return True

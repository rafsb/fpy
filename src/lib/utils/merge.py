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
    to_insert   = []
    to_update   = []
    to_delete = []

    temp_class = new_data_list[0].__class__ if len(new_data_list) else ""
    if not temp_class:
        temp_class = db_data_list[0].__class__ if len(db_data_list) else ""

    temp_class_name = temp_class.__name__

    i = 0
    length = len(new_data_list)
    for d in new_data_list:
        hash = d.row_key()
        newdatadict[hash] = d
        i += 1
        gauge(i / length, '', f'[{temp_class_name.upper()}] {i}/{length} - generating new hashtable')

    i = 0
    length = len(db_data_list)

    if len(db_data_list):
        for d in db_data_list:

            tmpkey = d.row_key()
            tempnewdata = newdatadict.get(tmpkey, None)

            if tempnewdata is None:
                if delete_if_not_exists:
                    to_delete.append(d)
                    deleted += 1
            elif tempnewdata.row_hash() != d.row_hash():
                tempnewdata.id = d.id
                to_update.append(tempnewdata)
                del newdatadict[tmpkey]
                changed += 1
            else:
                del newdatadict[tmpkey]
                kept += 1
            i += 1
            gauge(i / length - .01, '', f'[{temp_class_name.upper()}] {i}/{length} - {kept}/{changed}/{deleted} - comparing old and new hashes')
        gauge(1, '', f'[{temp_class_name.upper()}] {length}/{length} - to: keep {kept}/change {changed}/remove {deleted} - comparing old and new hashes - elapsed time: {int(time() - start_time)}s ')

    try:
        for _, d in newdatadict.items():
            to_insert.append(d)

        if len(to_delete):
            temp_class().bulk_del(rows=to_delete)

        if len(to_insert):
            temp_class().bulk_insert(rows=to_insert)

        if len(to_update):
            temp_class().bulk_update(rows=to_update)

    except:
        log.error(traceback.format_exc())

    log.info("[%s] Kept: %s Changed: %s Deleted: %s New: %s in %.2f seconds" % (temp_class_name, kept, changed, deleted, len(newdatadict), time() - start_time))

    return True

# --------------------------------------------------------------------------------------------
# Authentication module for the application. It uses the LDAP3 library to authenticate users
# inside Ball enviroment using the Active Directory service. The module also provides a cache
# mechanism to store the user session data and avoid unnecessary requests to the AD server.
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import os
import re
from ldap3 import Connection, Server, NTLM, ALL
from hashlib import sha256
from datetime import datetime
from json import loads
from utils.basic_traits import class_t, static_cast
from utils.log import log
from utils.cache import cache_db


session_db = cache_db('session')


def auth(username, password, lifespan=60 * 24):

    username = username.upper()

    res = session_db.get(username)
    if res and isinstance(res, class_t) and res.status and sha256(password.encode()).hexdigest() == res.password:
        res.last_login = datetime.now().isoformat()
        res.uat = static_cast.encrypt(f"^{res.user_data['cn']}.{res.last_login}$")
        session_db.set(username, res, expires=lifespan)
        return res

    AD_SERVER = os.getenv('AD_SERVER')
    AD_DOMAIN = os.getenv('AD_DOMAIN')

    res = class_t(
        status=False
        , user_data=None
        , messages=[]
        , password=None
        , last_login=datetime.now().isoformat()
        , uat=''
    )

    if not AD_SERVER or not AD_DOMAIN:
        msg = "Active Directory server or domain not configured."
        log.error(msg)
        res.messages.append(msg)
        return res
    # Try to authenticate the user
    try:
        # Establish a connection using NTLM (the AD authentication protocol)
        conn = Connection(
            Server(AD_SERVER, get_info=ALL)
            , user=f"{AD_DOMAIN}\\{username}"
            , password=password
            , authentication=NTLM
            # , auto_bind=True
        )

        if not conn.bind():
            msg = "Authentication failed."
            log.error(msg)
            res.messages.append(msg)
            return res

        search_base = 'DC=cs,DC=ball,DC=com'
        search_filter = f'(sAMAccountName={username})'
        conn.search(search_base, search_filter, attributes=['cn', 'mail', 'memberOf'])

        if conn.entries[0]:
            res.user_data = loads(conn.entries[0].entry_to_json())["attributes"]
            res.user_data["cn"] = res.user_data["cn"][0]
            res.user_data["mail"] = res.user_data["mail"][0]
            res.user_data["memberOf"] = [re.split(r'=', x, maxsplit=1) for x in res.user_data["memberOf"]]
            tmp = {}
            for key, value in res.user_data["memberOf"]:
                tmp.setdefault(key, set()).add(value)
            res.user_data["memberOf"] = {key: list(map(lambda x: x.split(',')[0], list(value))) for key, value in tmp.items()}
            res.password = sha256(password.encode()).hexdigest()
            res.uat = static_cast.encrypt(f"^{res.user_data['cn']}.{res.last_login}$")
            res.messages.append("User information retrieved successfully.")
            res.status = True
        else:
            res.messages.append("User not found.")
        conn.unbind()
    except Exception as e:
        log.error(f"Error during authentication: {e}")
    session_db.set(username, res, expires=lifespan)
    return res

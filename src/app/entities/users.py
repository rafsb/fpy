from utils.basic_traits import class_t, api_response_t
from utils.auth import auth, session_db
from utils.log import log


class User(class_t):

    def is_logged(username: str) -> bool:
        res = api_response_t(uat='')
        if not username:
            msg = "Username not provided."
            log.error(msg)
            res.messages.append(msg)
            return res
        username = username.upper()
        sess = session_db.get(username, cast=class_t)
        if not sess:
            msg = f"Session for {username} not found."
            log.error(msg)
            res.messages.append(msg)
            return res
        bl = session_db.get('blacklist') or []
        if username in bl:
            msg = f"User {username} is blacklisted."
            log.error(msg)
            res.messages.append(msg)
            return res
        res.status = bool(sess.uat)
        res.data = sess.user_data
        res.uat = sess.uat
        return res

    def login(username: str, password: str) -> bool:
        res = api_response_t(uat='')
        if not username or not password:
            msg = "Username or password not provided when trying to login."
            log.error(msg)
            res.messages.append(msg)
            return res
        bl = session_db.get('blacklist') or []
        username = username.upper()
        if username in bl:
            msg = f"User {username} is blacklisted."
            log.error(msg)
            res.messages.append(msg)
            return res
        tmp = auth(username, password)
        if tmp:
            res.messages = tmp.messages
            res.status = tmp.status
            res.data = tmp.user_data
            res.uat = tmp.uat
        if not res.status:
            res.messages.append("Login failed.")
        return res

    def logout(username: str) -> bool:
        res = api_response_t()
        if not username:
            msg = "Username not provided when trying to logout."
            log.error(msg)
            return res
        res.status = bool(session_db.destroy(username.upper()))
        return res

    def info(username: str) -> dict:
        res = api_response_t()
        if not username:
            msg = "Username not provided when trying to get user info."
            log.error(msg)
            res.messages.append(msg)
        else:
            try: res.data = session_db.get(username.upper(), cast=class_t).user_data
            except: res.messages.append('User not found.')
            res.status = bool(res.data)
        return res

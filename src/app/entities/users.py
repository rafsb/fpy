from utils.basic_traits import ClassT, APIResponseT
from utils.auth import auth, sessiondb
from utils.log import log


class User(ClassT):

    def is_logged(username: str) -> bool:
        res = APIResponseT(uat='')
        if not username:
            msg = "Username not provided."
            log.error(msg)
            res.messages.append(msg)
            return res
        sess = sessiondb.get(username, cast=ClassT)
        if not sess:
            msg = f"Session for {username} not found."
            log.error(msg)
            res.messages.append(msg)
            return res
        bl = sessiondb.get('blacklist') or []
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
        res = APIResponseT(uat='')
        if not username or not password:
            msg = "Username or password not provided when trying to login."
            log.error(msg)
            res.messages.append(msg)
            return res
        bl = sessiondb.get('blacklist') or []
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
        res = APIResponseT()
        if not username:
            msg = "Username not provided when trying to logout."
            log.error(msg)
            return res
        res.status = bool(sessiondb.destroy(username))
        return res

    def info(username: str) -> dict:
        res = APIResponseT()
        if not username:
            msg = "Username not provided when trying to get user info."
            log.error(msg)
            res.messages.append(msg)
        else:
            try: res.data = sessiondb.get(username, cast=ClassT).user_data
            except: res.messages.append('User not found.')
            res.status = bool(res.data)
        return res

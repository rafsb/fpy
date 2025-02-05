from flask import request
from entities.users import User as entity
from utils.basic_traits import StaticCast, APIResponseT
from utils.log import log


class user():

    @staticmethod
    def uat_user(uat=None):
        res = APIResponseT()
        if not uat:
            msg = 'No user token found'
            log.error(msg)
            res.messages.append(msg)
            return res
        try: user = StaticCast.decrypt(uat)[1:].split('.')[0]
        except: user = None
        if not user:
            msg = 'Invalid user token'
            log.error(msg)
            res.messages.append(msg)
            return res
        res.status = bool(user)
        res.data = user
        return res

    @staticmethod
    def login(user, password):
        if not user or not password:
            msg = 'Missing user or password'
            log.error(msg)
            return APIResponseT(messages=[msg])
        return entity.login(user, password)

    @staticmethod
    def logout(uat=None):
        res = user.uat_user(uat)
        if res.status: res = entity.logout(res.data)
        return res

    @staticmethod
    def info(uat=None):
        res = user.uat_user(uat)
        if res.status: res = entity.info(res.data)
        return res

    @staticmethod
    def logged(uat=None):
        res = user.uat_user(uat)
        if not res.status: return res
        res = entity.is_logged(res.data)
        res.messages.append('User is logged' if res.status else 'User is not logged')
        return res


def check_user(memberof=None):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            uat = request.headers.get('Fw-Uat')
            res = user.logged(uat)
            if not res.status:
                return res.attrs()
            if memberof:
                if not any(True for x in (memberof if isinstance(memberof, list) else [memberof]) if x in res.data['memberOf']['CN']):
                    msg = 'User is not authorized to access this resource'
                    log.error(msg)
                    return APIResponseT(status=False, messages=[msg] + res.messages).attrs()
            return fn(*args, **kwargs)
        wrapper.__name__ = f'wrapper_{fn.__name__}'
        return wrapper
    return decorator


def register(app, args=None):

    @app.post('/login')
    def _auth_sign():
        data = request.json
        res = user.login(data.get('username'), data.get('password'))
        return res.attrs()

    @app.route('/logout', methods=['POST', 'GET'])
    def _auth_logout():
        uat = request.headers.get('Fw-Uat')
        res = user.logout(uat)
        return res.attrs()

    @app.route('/user', methods=['POST', 'GET'])
    def _auth_info():
        uat = request.headers.get('Fw-Uat')
        res = user.info(uat)
        return res.attrs()

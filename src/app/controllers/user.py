from flask import request
from entities.users import User as entity
from utils.basic_traits import static_cast, api_response_t, class_t
from utils.log import log

AD_PREFIX = 'NADC1_MGT_'
# Allowed users for each group
allowed_users = {
    f"{AD_PREFIX}ADM": [ "RBERTOLI" ]
    , f"{AD_PREFIX}FIN": [ ]
    , f"{AD_PREFIX}OPR": [ ]
}


class user():

    @staticmethod
    def uat_user(uat=None):
        res = api_response_t()
        if not uat:
            msg = 'No user token found'
            log.error(msg)
            res.messages.append(msg)
            return res
        try: user = static_cast.decrypt(uat)[1:].split('.')[0]
        except: user = None
        if not user:
            msg = 'Invalid user token'
            log.error(msg)
            res.messages.append(msg)
            return res
        res.status = True
        res.data = user
        return res

    @staticmethod
    def login(user, password):
        if not user or not password:
            msg = 'Missing user or password'
            log.error(msg)
            return api_response_t(messages=[msg])
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
    if memberof and not isinstance(memberof, list):
        memberof = [memberof]

    def decorator(fn):
        def wrapper(*args, **kwargs):
            uat = request.headers.get('Fw-Uat')
            res = user.logged(uat)
            if not res.status:
                return res.attrs()

            if memberof:

                # Extract user info
                user_cn = res.data.get('cn', '').upper()
                member_of_groups = [x.upper() for x in class_t.nested(res.data, ['memberOf', 'CN' ], [])]
                # Gather allowed users from all groups
                allowed_people = sum([allowed_users.get(AD_PREFIX + group.upper(), []) for group in memberof], []) + allowed_users.get(f'{AD_PREFIX}OPS-ADM', [])
                allowed_people = [x.upper() for x in allowed_people]

                # Check if user is in allowed groups or explicitly listed
                if not (
                    bool(user_cn.upper() in allowed_people) or any(AD_PREFIX + group.upper() in member_of_groups for group in memberof)
                ):
                    msg = 'User is not authorized to access this resource (%s)' % user_cn
                    log.error(msg)
                    return api_response_t(status=False, messages=list(set([msg] + res.messages))).make_response(code=403)

            return fn(*args, **kwargs)

        wrapper.__name__ = f'wrapper_{fn.__name__}'
        return wrapper

    return decorator


def register(app, args=None):

    @app.post('/auth/in')
    def _auth_sign():
        data = request.json
        res = user.login(data.get('username'), data.get('password'))
        return res.render()

    @app.route('/auth/out', methods=['POST', 'GET'])
    def _auth_logout():
        uat = request.headers.get('Fw-Uat')
        res = user.logout(uat)
        return res.render()

    @app.route('/auth/info', methods=['POST', 'GET'])
    def _auth_info():
        uat = request.headers.get('Fw-Uat')
        res = user.info(uat)
        return res.render()

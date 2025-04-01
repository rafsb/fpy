import os
import traceback
from json import loads as jout
from flask import request
from controllers.user import check_user, user
from utils.log import log
from utils.cache import local_db
from utils.basic_traits import api_response_t

THEMES_FOLDER = os.path.join(os.path.dirname(__file__), "..", "static", "themes")
theme_db = local_db(".themes")


class themes :

    @staticmethod
    def load(theme=None, **args):
        if not theme : theme = "light"
        res = {}
        try:
            if os.path.exists(os.path.join(THEMES_FOLDER, f"{theme}.theme")):
                with open(os.path.join(THEMES_FOLDER, f"{theme}.theme"), 'r') as file:
                    res = jout(file.read())
            us = user.logged(request.headers.get('Fw-Uat'))
            if us.status:
                cached = theme_db.get(us.data['cn']) or {}
                if theme in cached:
                    res.update(cached[theme])
        except:
            log.error(f"Error loading theme: {theme}")
            traceback.print_exc()
        return res or {}, 200 if res else 202

    @staticmethod
    def list():
        files = set()
        for file in os.listdir(THEMES_FOLDER):
            if os.path.isfile(os.path.join(THEMES_FOLDER, file)):
                files.add(file.split('.')[0])
        us = user.logged(request.headers.get('Fw-Uat'))
        if us.status:
            cached = theme_db.get(us.data['cn']) or {}
            for theme in cached.keys():
                files.add(theme)
        return list(sorted(files))

    @staticmethod
    def init(theme=None, **args) :
        return themes.load(theme=theme)


def register(app, args=None):

    @app.route('/theme', methods=['POST'])
    def _theme() :
        return themes.load(**request.json)

    @app.route('/theme/save', methods=['GET', 'POST'])
    @check_user()
    def _theme_save():
        res = api_response_t()

        try: us = user.logged(request.headers.get('Fw-Uat')).data['cn']
        except: return res.response(code=401, message="Unauthorized")

        try: theme = request.json['theme']
        except: return res.response(code=202, message="No theme specified")

        cached = theme_db.get(us) or {}
        cached.update({ theme['name']: theme })
        theme_db.set(us, cached)

        res.status = True
        res.data = cached
        res.messages.append("Theme saved")

        print(res)

        return res.response(code=200)

    @app.route('/themes', methods=['GET', 'POST'])
    def _themes() :
        return themes.list()

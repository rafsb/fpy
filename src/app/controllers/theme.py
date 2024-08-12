import os
from json import loads as jout
from flask import request
from utils.log import log


THEMES_FOLDER = os.path.join(os.path.dirname(__file__), "..", "static", "themes")


class Theme :

    @staticmethod
    def load(name) :
        res = {}
        try :
            with open(os.path.join(THEMES_FOLDER, f"{name if name else 'light'}.theme")) as file : res = jout(file.read())
        except :
            log.error(f"Error loading theme: {name if name else 'light'}")
        return res

    @staticmethod
    def list():
        files = []
        for file in os.listdir(THEMES_FOLDER):
            if os.path.isfile(os.path.join(THEMES_FOLDER, file)):
                files.append(file.split('.')[0])
        return files

    @staticmethod
    def init(name) :
        return Theme.load(name)


def register(app, args=None) :
    @app.route('/theme', methods=['GET', 'POST'])
    def _theme() :
        if request.method == 'GET' : name = request.args.get('name', 'light')
        if request.method == 'POST' : name = jout(request.data).get('theme', 'light')
        return Theme.load(name)

    @app.route('/themes', methods=['GET', 'POST'])
    def _themes() :
        return Theme.list()

import os
from json import loads as jout
from flask import request
from utils.log import log


THEMES_FOLDER = os.path.join(os.path.dirname(__file__), "..", "static", "themes")


class themes :

    @staticmethod
    def load(args={}) :
        res = {}
        try :
            with open(os.path.join(THEMES_FOLDER, f"{args.get('theme', 'ball')}.theme")) as file : res = jout(file.read())
        except :
            log.error(f"Error loading theme: {args.get('theme', 'ball')}")
        return res

    @staticmethod
    def list():
        files = []
        for file in os.listdir(THEMES_FOLDER):
            if os.path.isfile(os.path.join(THEMES_FOLDER, file)):
                files.append(file.split('.')[0])
        return files

    @staticmethod
    def init(args={}) :
        return themes.load(args)


def register(app, args=None) :
    @app.route('/theme', methods=['GET', 'POST'])
    def _theme() :
        return themes.load(request.args if request.method == 'GET' else request.data)

    @app.route('/themes', methods=['GET', 'POST'])
    def _themes() :
        return themes.list()

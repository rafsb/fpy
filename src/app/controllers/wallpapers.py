import os
from json import loads as jout
from flask import request
from utils.log import log


WALLPAPERS_FOLDER = os.path.join(os.path.dirname(__file__), "..", "static", "img", "wallpapers")


class Wallpapers :

    @staticmethod
    def load(args={}) :
        res = {}
        path = os.path.join(WALLPAPERS_FOLDER, f"{args.get('wallpaper', 'wallpaper.jpg')}")
        res = args.get('wallpaper', 'wallpaper.jpg') if os.path.isfile(path) else "wallpaper.jpg"
        return res

    @staticmethod
    def list():
        files = []
        for file in os.listdir(WALLPAPERS_FOLDER):
            if os.path.isfile(os.path.join(WALLPAPERS_FOLDER, file)):
                files.append(file)
        return files

    @staticmethod
    def init(args={}) :
        return Wallpapers.load(args)


def register(app, args=None) :
    @app.route('/wallpaper', methods=['GET', 'POST'])
    def _wallpaper() :
        return Wallpapers.load(request.args if request.method == 'GET' else request.data)

    @app.route('/wallpapers', methods=['GET', 'POST'])
    def _wallpapers() :
        return Wallpapers.list()

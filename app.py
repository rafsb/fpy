# --------------------------------------------------------------------------------------------
# App
# --------------------------------------------------------------------------------------------

import os
import re
import sys
import importlib
import traceback
import jsonpickle
import logging
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'app')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'lib')))


load_dotenv(verbose=True, override=True)
ENV = os.environ.get('ENV', 'PROD')
PORT = int(os.environ.get('PORT', 80))


STATIC_D     = 'src/app/static/'
CONTROLLER_D = 'src/app/controllers'
ROOT         = os.path.dirname(__file__)
app          = Flask(__name__)
socket       = SocketIO(app)

logging.getLogger('werkzeug').setLevel(logging.WARNING)

# AUTOLOADER
for file in os.listdir(CONTROLLER_D):
    if file.endswith('.py') and file != '__init__.py':
        try:
            module = importlib.import_module('controllers' + '.' + file[:-3], 'src.app')
            app.register_blueprint(module)
        except:
            from utils.log import log
            log.debug(traceback.format_exc())

@app.get('/')
def _1(): return send_from_directory(STATIC_D, 'index.html')


@app.get('/<path:path>')
def _2(path) : return send_from_directory(STATIC_D, path)


@socket.on('join', namespace='/')
def handle_join(room):
    emit('message', { "message": f'{room} has joined' }, broadcast=True, namespace='/')
    if room: join_room(room.lower())


@socket.on('leave', namespace='/')
def handle_leave(room):
    if room: leave_room(room.lower())


@socket.on('message', namespace='/')
def handle_message(msg):
    try: res = jsonpickle.decode(msg)
    except: res = { "data": msg }
    if res.get("trigger", None):
        try:
            trigger = re.split(r"[\\/.]", res["trigger"])
            module = importlib.import_module('.'.join(re.split(r'[\\/.]', CONTROLLER_D)) + "." + trigger[0])
            classobj = getattr(module, trigger[0].lower())
            method = getattr(classobj, trigger[1] if len(trigger) > 1 else 'init', None)
            if method:
                payload = res.get("payload", None)
                try: res["res"] = (method(**payload) if payload and len(payload.keys()) else method())
                except:
                    try: res["res"] = method()
                    except: print(traceback.format_exc())
        except:
            print(traceback.format_exc())
    socket.emit("message", jsonpickle.encode(res))


if __name__ == '__main__':
    steps = 144
    print(f"""
        |{'=' * steps}|
        |{' ' * steps}|
        """ + r"""|     .x+=:.                      s                                                                     ..                                       |
        |    z`    ^%                    :8                           .uef^"                              x .d88"                            ..          |
        |       .   <k                  .88                         :d88E          u.    u.          u.    5888R          u.                @L           |
        |     .@8Ned8"       .         :888ooo      .u          .   `888E        x@88k u@88c.  ...ue888b   '888R    ...ue888b       uL     9888i   .dL   |
        |   .@^%8888"   .udR88N      -*8888888   ud8888.   .udR88N   888E .z8k  ^"8888""8888"  888R Y888r   888R    888R Y888r  .ue888Nc.. `Y888k:*888.  |
        |  x88:  `)8b. <888'888k       8888    :888'8888. <888'888k  888E~?888L   8888  888R   888R I888>   888R    888R I888> d88E`"888E`   888E  888I  |
        |  8888N=*8888 9888 'Y"  888E  8888    d888 '88%" 9888 'Y"   888E  888E   8888  888R   888R I888>   888R    888R I888> 888E  888E    888E  888I  |
        |   %8"    R88 9888      888E  8888    8888.+"    9888       888E  888E   8888  888R   888R I888>   888R    888R I888> 888E  888E    888E  888I  |
        |    @8Wou 9%  9888           .8888Lu= 8888L      9888       888E  888E   8888  888R  u8888cJ888    888R   u8888cJ888  888E  888E    888E  888I  |
        |  .888888P`   ?8888u../      ^%888*   '8888c. .+ ?8888u../  888E  888E  "*88*" 8888"  "*888*P"    .888B .  "*888*P"   888& .888E   x888N><888'  |
        |  `   ^"F      "8888P'         'Y"     "88888%    "8888P'  m888N= 888>    ""   'Y"      'Y"       ^*888%     'Y"      *888" 888&    "88"  888   |
        |                 "P'                     "YP'       "P'     `Y"   888                               "%                 `"   "888E         88F   |
        |                                                                 J88"                                                 .dWi   `88E        98"    |
        |                                                                 @%                                                   4888~  J8%       ./"      |
        |                                                               :"                                                      ^"===*"`       ~`        |
        """ + f"""|{' ' * steps}|
        |{'=' * steps}|
        |{' ' * steps}|
        |    Verbose             : {'{:<{}}'.format(os.environ.get('VERBOSE') + '/' + os.environ.get('LOG_LEVEL'), steps - 26)}|
        |    Enviroment          : {'{:<{}}'.format(ENV.upper(), steps - 26)}|
        |    Database            : {'{:<{}}'.format(os.environ.get('DB_SERVER') + '/' + os.environ.get('DB_DATABASE'), steps - 26)}|
        |    App running under   : {'{:<{}}'.format(f'http://localhost:{PORT}', steps - 26)}|
        |{' ' * steps}|
        |{'=' * steps}|
    """)

    # Run the application with SocketIO
    socket.run(app, host="0.0.0.0", port=PORT, debug=bool(ENV.lower() == "dev"))

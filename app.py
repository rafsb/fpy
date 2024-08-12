# --------------------------------------------------------------------------------------------
# App
# --------------------------------------------------------------------------------------------

import sys
import os
import importlib
import socket
import threading

from dotenv import load_dotenv
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'app')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'lib')))

load_dotenv(verbose=True, override=True)
ENV = os.getenv('ENV', 'PROD')
PORT = int(os.getenv('PORT', 80))

STATIC_D     = 'src/app/static/'
CONTROLLER_D = 'src/app/controllers'
ROOT         = os.path.dirname(__file__)
app          = Flask(__name__)
socketio     = SocketIO(app)

# AUTOLOADER
for file in os.listdir(CONTROLLER_D):
    if file.endswith('.py') and file != '__init__.py':
        module = importlib.import_module(f"{'.'.join(CONTROLLER_D.split('/'))}.{file[:-3]}")
        app.register_blueprint(module)

@app.get('/')
def _1(): return send_from_directory(STATIC_D, 'index.html')

@app.get('/<path:path>')
def _2(path) : return send_from_directory(STATIC_D, path)

# WebSocket event handlers
@socketio.on('message')
def handle_message(msg):
    print(f'Received message: {msg}')
    socketio.send(msg)

if __name__ == '__main__':
    verboses = [ 'E_KEEP', 'E_ERROR', 'E_WARN', 'E_INFO', 'E_SHOW' ]
    print(r"""
        |==================================================================================================|
        """ + f"""|                                                                                                  |
        |    Verbose             : {'{:<{}}'.format(verboses[int(os.getenv('VERBOSE'))] + '/' + verboses[int(os.getenv('LOG_LEVEL'))], 72)}|
        |    Enviroment          : {'{:<{}}'.format(ENV.upper(), 72)}|
        |    Database            : {'{:<{}}'.format(os.getenv('DB_SERVER') + '/' + os.getenv('DB_DATABASE'), 72)}|
        |    App running under   : {'{:<{}}'.format(f'http://localhost:{PORT}', 72)}|
        |                                                                                                  |
        |==================================================================================================|
    """)

        # Run the application with SocketIO
    if ENV.lower() == "dev":
        socketio.run(app, host="0.0.0.0", port=PORT, debug=True)
    else:
        # For production, SocketIO will take care of serving the app
        socketio.run(app, host="0.0.0.0", port=PORT, debug=False)

# --------------------------------------------------------------------------------------------
# Cli
# --------------------------------------------------------------------------------------------

import sys
import os
import importlib
import subprocess
import traceback
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'app')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'lib')))

load_dotenv(verbose=True, override=True)
ENV = os.getenv('ENV', 'PROD')
PORT = os.getenv('PORT', 80)

STATIC_D     = 'src/app/static/'
CONTROLLER_D = 'src/app/controllers'
ROOT         = os.path.dirname(__file__)

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

if __name__ == "__main__":
    # AUTOLOADER
    args = sys.argv[1:]
    file = os.path.join(ROOT, CONTROLLER_D, args[0] + '.py')

    if os.path.isfile(file):
        try:
            module = importlib.import_module(f"{'.'.join(CONTROLLER_D.split('/'))}.{args[0]}")
            classname = getattr(module, args[0])
            functor = getattr(classname, args[1] if len(args) > 1 else 'init')
            if len(args) > 2: print(functor(args[2:]))
            else: print(functor())
        except:
            traceback.print_exc()

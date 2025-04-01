# --------------------------------------------------------------------------------------------
# Cli
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import sys
import os
import importlib
import traceback
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'app')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'lib')))

load_dotenv(verbose=True, override=True)
ENV = os.getenv('ENV', 'PROD')

STATIC_D     = 'src/app/static/'
CONTROLLER_D = 'src/app/controllers'
ROOT         = os.path.dirname(__file__)

steps = 142
print(r"""
   .x+=:.                      s                                                                     ..
  z`    ^%                    :8                           .uef^"                              x .d88"                            ..
     .   <k                  .88                         :d88E          u.    u.          u.    5888R          u.                @L
   .@8Ned8"       .         :888ooo      .u          .   `888E        x@88k u@88c.  ...ue888b   '888R    ...ue888b       uL     9888i   .dL
 .@^%8888"   .udR88N      -*8888888   ud8888.   .udR88N   888E .z8k  ^"8888""8888"  888R Y888r   888R    888R Y888r  .ue888Nc.. `Y888k:*888.
x88:  `)8b. <888'888k       8888    :888'8888. <888'888k  888E~?888L   8888  888R   888R I888>   888R    888R I888> d88E`"888E`   888E  888I
8888N=*8888 9888 'Y"  888E  8888    d888 '88%" 9888 'Y"   888E  888E   8888  888R   888R I888>   888R    888R I888> 888E  888E    888E  888I
 %8"    R88 9888      888E  8888    8888.+"    9888       888E  888E   8888  888R   888R I888>   888R    888R I888> 888E  888E    888E  888I
  @8Wou 9%  9888           .8888Lu= 8888L      9888       888E  888E   8888  888R  u8888cJ888    888R   u8888cJ888  888E  888E    888E  888I
.888888P`   ?8888u../      ^%888*   '8888c. .+ ?8888u../  888E  888E  "*88*" 8888"  "*888*P"    .888B .  "*888*P"   888& .888E   x888N><888'
`   ^"F      "8888P'         'Y"     "88888%    "8888P'  m888N= 888>    ""   'Y"      'Y"       ^*888%     'Y"      *888" 888&    "88"  888
               "P'                     "YP'       "P'     `Y"   888                               "%                 `"   "888E         88F
                                                               J88"                                                 .dWi   `88E        98"
                                                               @%                                                   4888~  J8%       ./"
                                                             :"                                                      ^"===*"`       ~`
""" + f"""|{'=' * steps}|
|{' ' * steps}|
|    Verbose             : {'{:<{}}'.format(os.environ.get('VERBOSE') + '/' + os.environ.get('LOG_LEVEL'), steps - 26)}|
|    Enviroment          : {'{:<{}}'.format(ENV.upper(), steps - 26)}|
|    Database            : {'{:<{}}'.format(os.environ.get('DB_SERVER') + '/' + os.environ.get('DB_DATABASE'), steps - 26)}|
|{' ' * steps}|
|{'=' * steps}|
""")

if __name__ == "__main__":
    # AUTOLOADER
    args = sys.argv[1:]
    file = os.path.join(ROOT, CONTROLLER_D, args[0] + '.py')

    from utils.log import log
    log.debug(f"CLI: {args}")

    if os.path.isfile(file):
        try:
            module = importlib.import_module(f"{'.'.join(CONTROLLER_D.split('/'))}.{args[0]}")
            classname = getattr(module, args[0])
            functor = getattr(classname, args[1] if len(args) > 1 else 'init')
            if len(args) > 2: print(functor(args[2:]))
            else: print(functor())
        except:
            traceback.print_exc()

import os
import jsonpickle
from datetime import datetime
from utils.basic_traits import ClassT

ELevels = ClassT(**{
    'E_CRITICAL'  : 6,
    'E_FATAL'     : 5,
    'E_ERROR'     : 4,
    'E_WARN'      : 3,
    'E_INFO'      : 2,
    'E_DEBUG'     : 1,
    'E_ALL'       : 0
})

VERBOSE = getattr(ELevels, os.getenv("VERBOSE", 'E_ALL'), 'E_ALL')
LOG_LEVEL = getattr(ELevels, os.getenv("LOG_LEVEL", 'E_WARN'), 'E_WARN')


class Logger:

    def __init__(self, name='app', max_lines=1024):

        if not name: name = 'app'

        self.max_lines = max_lines
        self.log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'var', 'tmp', 'logs'))
        os.makedirs(self.log_dir, exist_ok=True)

        # Create handlers for each log level
        self.create_file_handler('%s_info.log' % name)
        self.create_file_handler('%s_warn.log' % name)
        self.create_file_handler('%s_error.log' % name)
        self.create_file_handler('%s_debug.log' % name)
        self.create_file_handler('%s_critical.log' % name)

        # Debug statement to check log directory
        self.debug(f"Log directory: {self.log_dir}")

    def create_file_handler(self, filename):
        log_path = os.path.join(self.log_dir, filename)
        if not os.path.exists(log_path):
            open(log_path, 'w').close()

    def stream(self, message, level=ELevels.E_INFO):
        from app import socket
        socket.emit("message", jsonpickle.encode({ "stream": message, "ts": datetime.now(), "level": level }))

    def log(self, message, level=ELevels.E_INFO):
        if level >= VERBOSE:
            print("%s [%s]" % (datetime.now(), level))
            print(message)
        if level >= LOG_LEVEL:
            tmp_name = 'info'
            for k, v in ELevels.__dict__.items():
                if v == level:
                    tmp_name = k.lower()
                    break
            log_name = '%s_%s.log' % ('app', tmp_name)
            log_path = os.path.join(self.log_dir, log_name)
            with open(log_path, 'a+') as f:
                f.seek(0)
                lines = f.readlines()
                if len(lines) >= self.max_lines:
                    lines = lines[-self.max_lines + 1:]
                lines.append("%s [%s] %s\n" % (datetime.now(), level, message))
                f.seek(0)
                f.truncate()
                f.writelines(lines)

    def info(self, message):
        self.log(message, ELevels.E_INFO)

    def warn(self, message):
        self.log(message, ELevels.E_WARN)

    def error(self, message):
        self.log(message, ELevels.E_ERROR)

    def debug(self, message):
        self.log(message, ELevels.E_DEBUG)

    def critical(self, message):
        self.log(message, ELevels.E_CRITICAL)

    @classmethod
    def get_logger(cls, name='app', **args):
        return cls(name, **args)


log = Logger()

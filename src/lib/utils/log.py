# --------------------------------------------------------------------------------------------
# Logger class to handle logging in the application. It has a stream method to send messages
# to the client and a log method to write messages to the log files. The class also has
# methods to log messages with different levels of severity.
# --------------------------------------------------------------------------------------------
# Author: Rafael Bertolini
# --------------------------------------------------------------------------------------------

import os
import jsonpickle
from datetime import datetime
from utils.basic_traits import ClassT

ELevels = ClassT(**{
    'NONE'      : 9
    , 'CRITICAL': 6
    , 'FATAL'   : 5
    , 'ERROR'   : 4
    , 'WARN'    : 3
    , 'INFO'    : 2
    , 'DEBUG'   : 1
    , 'ALL'     : 0
})

VERBOSE = getattr(ELevels, os.getenv("VERBOSE", 'ALL'), 'ALL')
LOG_LEVEL = getattr(ELevels, os.getenv("LOG_LEVEL", 'WARN'), 'WARN')


class Logger:

    def __init__(self, max_lines=1024):

        self.VERBOSE = VERBOSE
        self.LOG_LEVEL = LOG_LEVEL

        self.max_lines = max_lines
        self.log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'var', 'tmp', 'logs'))
        os.makedirs(self.log_dir, exist_ok=True)

        # Debug statement to check log directory
        self.debug(f"Log directory: {self.log_dir}")

    def create_file_handler(self, filename):
        log_path = os.path.join(self.log_dir, filename)
        if not os.path.exists(log_path):
            open(log_path, 'w').close()

    def stream(self, message, level=ELevels.INFO):
        from app import socket
        socket.emit("message", jsonpickle.encode({ "stream": message, "ts": datetime.now(), "level": level }))
        self.log(message, level)

    def log(self, message, level=ELevels.INFO):
        if level >= VERBOSE:
            print("%s [%s] %s" % (datetime.now(), list(reversed(list(ELevels.__dict__.keys())))[level], message))
        if level >= LOG_LEVEL:
            tmp_name = 'debug'
            for k, v in ELevels.__dict__.items():
                if v == level:
                    tmp_name = k.lower()
                    break
            log_name = '%s.log' % tmp_name
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
        self.log(message, ELevels.INFO)

    def warn(self, message):
        self.log(message, ELevels.WARN)

    def error(self, message):
        self.log(message, ELevels.ERROR)

    def debug(self, message):
        self.log(message, ELevels.DEBUG)

    def critical(self, message):
        self.log(message, ELevels.CRITICAL)

    @classmethod
    def get_logger(cls, **args):
        return cls(**args)


log = Logger()

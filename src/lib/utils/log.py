import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

VERBOSE = int(os.getenv("VERBOSE", 0))
LOG_LEVEL = int(os.getenv("LOG_LEVEL", logging.INFO))


class Logger:

    LOG_LEVELS = {
        'INFO': logging.INFO,
        'WARN': logging.WARNING,
        'ERROR': logging.ERROR,
    }

    def __init__(self, name='app', filename=None, log_level=logging.INFO, max_lines=1024, backup_count=5):
        self.name = name
        self.filename = filename or 'app.log'
        self.log_level = log_level
        self.max_lines = max_lines
        self.backup_count = backup_count

        log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'var', 'tmp', 'logs')
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, self.filename)

        self.logger = logging.getLogger(self.name)
        self.logger.setLevel(self.log_level)

        handler = RotatingFileHandler(log_path, maxBytes=self.max_lines * 100, backupCount=self.backup_count)
        handler.setLevel(self.log_level)

        formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
        handler.setFormatter(formatter)

        self.logger.addHandler(handler)

        if VERBOSE:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            self.logger.addHandler(console_handler)

    def info(self, message):
        self.logger.info(message)

    def warn(self, message):
        self.logger.warning(message)

    def error(self, message):
        self.logger.error(message)

    @classmethod
    def get_logger(cls, name='app', filename=None, log_level=logging.INFO, max_lines=1024, backup_count=5):
        return cls(name, filename, log_level, max_lines, backup_count)

log = Logger()
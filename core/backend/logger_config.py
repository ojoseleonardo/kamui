"""
Sistema de Logging Detalhado
Configuração centralizada de logs para arquivo e console.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime
from logging.handlers import RotatingFileHandler


class LoggerConfig:
    """Configuração centralizada do sistema de logging."""

    DEBUG = logging.DEBUG
    INFO = logging.INFO
    WARNING = logging.WARNING
    ERROR = logging.ERROR
    CRITICAL = logging.CRITICAL

    def __init__(self, log_dir: str = "logs", log_level: int = logging.INFO):
        self.log_dir = Path(log_dir)
        self.log_level = log_level
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def setup_logger(
        self,
        name: str,
        log_file: str = None,
        console: bool = True,
        file_log: bool = True,
    ) -> logging.Logger:
        logger = logging.getLogger(name)
        logger.setLevel(self.log_level)

        if logger.handlers:
            return logger

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        if console:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(self.log_level)
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)

        if file_log:
            if not log_file:
                log_file = f"kamui_{datetime.now().strftime('%Y%m%d')}.log"

            log_path = self.log_dir / log_file

            file_handler = RotatingFileHandler(
                log_path,
                maxBytes=10 * 1024 * 1024,
                backupCount=5,
                encoding="utf-8",
            )
            file_handler.setLevel(self.log_level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)

        return logger

    @staticmethod
    def get_logger(name: str) -> logging.Logger:
        return logging.getLogger(name)


_default_config = LoggerConfig()


def setup_logging(
    log_dir: str = "logs",
    log_level: int = logging.INFO,
    log_file: str = None,
    console: bool = True,
    file_log: bool = True,
) -> logging.Logger:
    config = LoggerConfig(log_dir, log_level)
    return config.setup_logger(
        "kamui",
        log_file=log_file,
        console=console,
        file_log=file_log,
    )

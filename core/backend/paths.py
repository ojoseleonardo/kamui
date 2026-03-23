"""Resolve diretório de dados do utilizador (Electron define KAMUI_USER_DATA)."""

import os
from pathlib import Path


def get_user_data_dir() -> Path:
    raw = os.environ.get("KAMUI_USER_DATA", "").strip()
    if raw:
        return Path(raw).resolve()
    # Desenvolvimento sem Electron: pasta ao lado do repositório
    here = Path(__file__).resolve().parent.parent
    return (here / ".kamui-dev-data").resolve()


def credentials_dir() -> Path:
    p = get_user_data_dir() / "credentials"
    p.mkdir(parents=True, exist_ok=True)
    return p


def client_secrets_path() -> Path:
    return credentials_dir() / "client_secrets.json"


def token_path() -> Path:
    return credentials_dir() / "token.pickle"


def database_path() -> Path:
    return get_user_data_dir() / "kamui.db"


def logs_dir() -> Path:
    p = get_user_data_dir() / "logs"
    p.mkdir(parents=True, exist_ok=True)
    return p

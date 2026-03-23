"""SQLite em KAMUI_USER_DATA — configuração da app."""

import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .paths import database_path, get_user_data_dir


def _connect() -> sqlite3.Connection:
    get_user_data_dir().mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(database_path()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                detail TEXT NOT NULL DEFAULT '',
                file_path TEXT,
                youtube_id TEXT,
                error TEXT,
                file_size INTEGER,
                extra_json TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC)"
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)")
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_path ON events(file_path)"
        )
        conn.commit()


def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    init_db()
    with _connect() as conn:
        row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        if row is None:
            return default
        return row["value"]


def set_setting(key: str, value: str) -> None:
    init_db()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )
        conn.commit()


def set_settings_bulk(items: Dict[str, str]) -> None:
    init_db()
    with _connect() as conn:
        for k, v in items.items():
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (k, v),
            )
        conn.commit()


def is_setup_complete() -> bool:
    return get_setting("setup_complete", "0") == "1"


def get_preferences() -> Dict[str, Any]:
    raw = get_setting("preferences_json", "{}")
    try:
        return json.loads(raw or "{}")
    except json.JSONDecodeError:
        return {}


def set_preferences(data: Dict[str, Any]) -> None:
    set_setting("preferences_json", json.dumps(data, ensure_ascii=False))


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def insert_event(
    type_: str,
    title: str = "",
    detail: str = "",
    file_path: Optional[str] = None,
    youtube_id: Optional[str] = None,
    error: Optional[str] = None,
    file_size: Optional[int] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> int:
    """Regista um evento na timeline. Retorna o id."""
    init_db()
    extra_json = json.dumps(extra, ensure_ascii=False) if extra else None
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO events (created_at, type, title, detail, file_path, youtube_id, error, file_size, extra_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                _now_iso(),
                type_,
                title,
                detail,
                file_path,
                youtube_id,
                error,
                file_size,
                extra_json,
            ),
        )
        conn.commit()
        return int(cur.lastrowid)


def clip_detected_logged_today(file_path: str) -> bool:
    """Evita spam: mesmo ficheiro só um clip_detected por dia (UTC)."""
    init_db()
    resolved = str(Path(file_path).resolve())
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT 1 FROM events
            WHERE type = 'clip_detected' AND file_path = ?
              AND date(created_at) = date('now')
            LIMIT 1
            """,
            (resolved,),
        ).fetchone()
        return row is not None


def list_upload_success_paths() -> List[str]:
    init_db()
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT DISTINCT file_path FROM events
            WHERE type = 'upload_success' AND file_path IS NOT NULL AND file_path != ''
            """
        ).fetchall()
        return [r["file_path"] for r in rows]


def list_latest_upload_success_with_created() -> List[Tuple[str, str]]:
    """Último evento upload_success por file_path (maior id), com created_at."""
    init_db()
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT e.file_path, e.created_at
            FROM events e
            WHERE e.type = 'upload_success'
              AND e.file_path IS NOT NULL
              AND e.file_path != ''
              AND e.id = (
                SELECT MAX(e2.id) FROM events e2
                WHERE e2.type = 'upload_success' AND e2.file_path = e.file_path
              )
            """
        ).fetchall()
        return [(r["file_path"], r["created_at"]) for r in rows]


def list_events(
    limit: int = 100,
    offset: int = 0,
    type_filter: Optional[str] = None,
    since_iso: Optional[str] = None,
    until_iso: Optional[str] = None,
) -> List[Dict[str, Any]]:
    init_db()
    q = "SELECT * FROM events WHERE 1=1"
    params: List[Any] = []
    if type_filter:
        q += " AND type = ?"
        params.append(type_filter)
    if since_iso:
        q += " AND created_at >= ?"
        params.append(since_iso)
    if until_iso:
        q += " AND created_at <= ?"
        params.append(until_iso)
    q += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    with _connect() as conn:
        rows = conn.execute(q, params).fetchall()
    out: List[Dict[str, Any]] = []
    for r in rows:
        extra = None
        if r["extra_json"]:
            try:
                extra = json.loads(r["extra_json"])
            except json.JSONDecodeError:
                extra = None
        out.append(
            {
                "id": r["id"],
                "created_at": r["created_at"],
                "type": r["type"],
                "title": r["title"],
                "detail": r["detail"],
                "file_path": r["file_path"],
                "youtube_id": r["youtube_id"],
                "error": r["error"],
                "file_size": r["file_size"],
                "extra": extra,
            }
        )
    return out


def event_counts_by_type() -> Dict[str, int]:
    init_db()
    with _connect() as conn:
        rows = conn.execute(
            "SELECT type, COUNT(*) AS c FROM events GROUP BY type"
        ).fetchall()
    return {r["type"]: int(r["c"]) for r in rows}


def uploads_per_day(days: int = 7) -> List[Dict[str, Any]]:
    """Contagem de upload_success por dia (últimos `days` dias, inclusive hoje)."""
    init_db()
    start = (datetime.now(timezone.utc) - timedelta(days=days - 1)).date().isoformat()
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT date(created_at) AS day, COUNT(*) AS uploads
            FROM events
            WHERE type = 'upload_success' AND date(created_at) >= date(?)
            GROUP BY date(created_at)
            ORDER BY day
            """,
            (start,),
        ).fetchall()
    by_day = {r["day"]: int(r["uploads"]) for r in rows}
    names = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    out: List[Dict[str, Any]] = []
    for i in range(days - 1, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).date()
        d_iso = d.isoformat()
        out.append(
            {
                "day": d_iso,
                "name": names[d.weekday()],
                "uploads": by_day.get(d_iso, 0),
            }
        )
    return out


def count_upload_success() -> int:
    init_db()
    with _connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS c FROM events WHERE type = 'upload_success'"
        ).fetchone()
        return int(row["c"]) if row else 0


def delete_all_events() -> int:
    init_db()
    with _connect() as conn:
        cur = conn.execute("DELETE FROM events")
        conn.commit()
        return cur.rowcount

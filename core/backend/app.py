"""
API HTTP local do Kamui — FastAPI.
"""

from __future__ import annotations

import asyncio
import json
import shutil
import threading
import time
from contextlib import asynccontextmanager
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from . import db
from .file_monitor import FileMonitor
from .paths import (
    client_secrets_path,
    credentials_dir,
    logs_dir,
    token_path,
)
from .video_manager import VideoManager
from .youtube_analytics import fetch_channel_analytics, fetch_daily_views_series
from .video_thumbnail import extract_thumbnail_jpeg, resolve_watch_video_path
from .youtube_read import (
    clear_mine_uploads_playlist_cache,
    fetch_channel_summary,
    fetch_my_uploads_page,
    fetch_video_by_id,
)
from .youtube_uploader import YouTubeUploader, perform_youtube_oauth


class MonitorController:
    """Instância única do VideoManager, controlada por rotas."""

    def __init__(self):
        self._lock = threading.Lock()
        self._manager: Optional[VideoManager] = None

    def _prefs(self) -> Dict[str, Any]:
        return db.get_preferences()

    def _auto_upload(self) -> bool:
        return bool(self._prefs().get("auto_upload", True))

    def _privacy(self) -> str:
        return str(self._prefs().get("default_privacy", "private"))

    def build_manager(self) -> Optional[VideoManager]:
        if not db.is_setup_complete():
            return None
        folder = db.get_setting("watch_folder")
        if not folder or not Path(folder).exists():
            return None
        c = client_secrets_path()
        t = token_path()
        return VideoManager(
            watch_folder=folder,
            credentials_file=str(c),
            token_file=str(t),
            log_dir=str(logs_dir()),
            auto_upload=self._auto_upload(),
            privacy_status=self._privacy(),
        )

    def start(self) -> tuple:
        with self._lock:
            if self._manager and self._manager.running:
                return True, "Já está em execução."
            m = self.build_manager()
            if not m:
                return False, "Configuração incompleta ou pasta inválida."
            self._manager = m
            self._manager.start()
            return True, ""

    def stop(self) -> tuple:
        with self._lock:
            if self._manager:
                self._manager.stop()
                self._manager = None
            return True, ""

    def status(self) -> Dict[str, Any]:
        with self._lock:
            running = self._manager is not None and self._manager.running
            folder = db.get_setting("watch_folder") or ""
            queue = {"in_flight": 0, "pending": 0, "total": 0}
            if self._manager is not None:
                queue = self._manager.queue_status()
            return {
                "active": running,
                "watch_folder": folder,
                "queue": queue,
            }

    def reload_youtube(self):
        with self._lock:
            if self._manager:
                self._manager.rebuild_youtube()

    def manual_upload(self, file_path: str) -> tuple[Optional[str], str]:
        wf = (db.get_setting("watch_folder") or "").strip()
        if not wf:
            return None, "Pasta monitorada não configurada."
        wf_p = Path(wf).resolve()
        try:
            p = Path(file_path).resolve()
        except OSError:
            return None, "Caminho inválido."
        if not p.is_file():
            return None, "Arquivo não encontrado."
        try:
            p.relative_to(wf_p)
        except ValueError:
            return None, "Arquivo deve estar dentro da pasta monitorada."

        with self._lock:
            m = self._manager
        if not m:
            m = self.build_manager()
        if not m:
            return None, "Não foi possível iniciar o gerenciador (credenciais YouTube?)."
        vid = m.upload_video_manually(str(p))
        if vid:
            return vid, ""
        return None, "Upload falhou ou YouTube indisponível."


controller = MonitorController()


def _folder_monitor() -> Optional[FileMonitor]:
    wf = db.get_setting("watch_folder") or ""
    p = Path(wf)
    if not wf or not p.is_dir():
        return None
    return FileMonitor(str(p.resolve()))


_youtube_status_cache: Dict[str, Any] = {"t": 0.0, "payload": None}


def _invalidate_youtube_status_cache() -> None:
    _youtube_status_cache["t"] = 0.0
    _youtube_status_cache["payload"] = None


def _invalidate_youtube_api_caches() -> None:
    """Após novo OAuth ou troca de conta — não reutilizar estado antigo."""
    _invalidate_youtube_status_cache()
    clear_mine_uploads_playlist_cache()


def _youtube_status_cache_ttl_seconds(payload: Dict[str, Any]) -> float:
    if payload.get("connected"):
        return 6 * 3600
    msg = (payload.get("message") or "").lower()
    if "quota" in msg:
        return 3600
    return 900


def _uploader_or_400() -> YouTubeUploader:
    c = client_secrets_path()
    t = token_path()
    if not c.exists():
        raise HTTPException(status_code=400, detail="client_secrets.json ausente.")
    up = YouTubeUploader(str(c), str(t), defer_interactive=True)
    if not up.youtube_service:
        raise HTTPException(status_code=400, detail="YouTube não autenticado. Use OAuth em Configurações.")
    return up


def _youtube_status() -> Dict[str, Any]:
    c = client_secrets_path()
    t = token_path()
    if not c.exists():
        return {"connected": False, "message": "Falta o arquivo client_secrets.json."}
    up = YouTubeUploader(str(c), str(t), defer_interactive=True)
    if not up.youtube_service:
        return {"connected": False, "message": "YouTube não está autenticado."}

    now = time.monotonic()
    cached = _youtube_status_cache["payload"]
    if cached is not None and now - _youtube_status_cache["t"] < _youtube_status_cache_ttl_seconds(
        cached
    ):
        return cached

    ok, msg = up.verify_connection()
    payload: Dict[str, Any] = {"connected": ok, "message": msg or ""}
    _youtube_status_cache["t"] = now
    _youtube_status_cache["payload"] = payload
    return payload


def _setup_missing() -> List[str]:
    missing: List[str] = []
    if not (db.get_setting("display_name") or "").strip():
        missing.append("display_name")
    wf = db.get_setting("watch_folder") or ""
    if not wf or not Path(wf).exists():
        missing.append("watch_folder")
    if not client_secrets_path().exists():
        missing.append("client_secrets")
    yt = _youtube_status()
    if not yt["connected"]:
        missing.append("youtube")
    return missing


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    if db.is_setup_complete():
        ok, msg = await asyncio.to_thread(controller.start)
        if not ok:
            import logging

            logging.getLogger("kamui").warning("Início automático do monitor: %s", msg)
    yield
    await asyncio.to_thread(controller.stop)


app = FastAPI(title="Kamui Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/setup/status")
def setup_status(probe: bool = False):
    if probe:
        _invalidate_youtube_status_cache()
    complete = db.is_setup_complete()
    missing = [] if complete else _setup_missing()
    yt = _youtube_status()
    return {
        "setup_complete": complete,
        "missing": missing,
        "display_name": db.get_setting("display_name") or "",
        "watch_folder": db.get_setting("watch_folder") or "",
        "youtube_connected": yt["connected"],
        "youtube_message": yt["message"],
    }


class SetupProfileBody(BaseModel):
    display_name: str = Field(..., min_length=1)


@app.put("/setup/profile")
def setup_profile(body: SetupProfileBody):
    db.set_setting("display_name", body.display_name.strip())
    return {"ok": True}


class SetupFolderBody(BaseModel):
    watch_folder: str = Field(..., min_length=1)


@app.put("/setup/folder")
def setup_folder(body: SetupFolderBody):
    p = Path(body.watch_folder)
    if not p.exists():
        raise HTTPException(status_code=400, detail="Pasta não existe.")
    if not p.is_dir():
        raise HTTPException(status_code=400, detail="Caminho não é uma pasta.")
    db.set_setting("watch_folder", str(p.resolve()))
    return {"ok": True}


class ClientSecretsBody(BaseModel):
    """JSON bruto do Google Cloud (conteúdo de client_secrets.json)."""

    raw_json: str


@app.put("/setup/client-secrets")
def setup_client_secrets(body: ClientSecretsBody):
    try:
        data = json.loads(body.raw_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="JSON inválido.")
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Raiz deve ser um objeto JSON.")
    credentials_dir()
    dest = client_secrets_path()
    dest.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True}


@app.post("/auth/youtube")
async def auth_youtube():
    c = client_secrets_path()
    t = token_path()
    if not c.exists():
        raise HTTPException(
            status_code=400,
            detail="Salve o client_secrets.json antes (etapa de credenciais).",
        )

    loop = asyncio.get_event_loop()
    ok, err = await loop.run_in_executor(None, lambda: perform_youtube_oauth(c, t))
    if not ok:
        raise HTTPException(status_code=400, detail=err or "OAuth falhou.")

    controller.reload_youtube()
    _invalidate_youtube_api_caches()
    return {"ok": True}


@app.post("/auth/youtube/disconnect")
def auth_youtube_disconnect():
    """Remove token OAuth local; próximo uso exige novo login (troca de conta)."""
    t = token_path()
    removed = False
    if t.exists():
        try:
            t.unlink()
            removed = True
        except OSError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Não foi possível apagar o token: {e}",
            )
    controller.reload_youtube()
    _invalidate_youtube_api_caches()
    return {"ok": True, "removed": removed}


@app.post("/setup/finalize")
async def setup_finalize():
    missing = _setup_missing()
    if missing:
        labels = {
            "display_name": "seu nome",
            "watch_folder": "pasta de clipes",
            "client_secrets": "credenciais Google (client_secrets.json)",
            "youtube": "conexão com o YouTube",
        }
        human = ", ".join(labels.get(m, m) for m in missing)
        raise HTTPException(
            status_code=400,
            detail=f"Conclua todas as etapas. Pendente: {human}.",
        )
    db.set_setting("setup_complete", "1")
    await asyncio.to_thread(controller.start)
    return {"ok": True}


@app.get("/youtube/status")
def youtube_status(probe: bool = False):
    if probe:
        _invalidate_youtube_status_cache()
    return _youtube_status()


@app.post("/monitor/start")
async def monitor_start():
    ok, msg = await asyncio.to_thread(controller.start)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"ok": True}


@app.post("/monitor/stop")
async def monitor_stop():
    await asyncio.to_thread(controller.stop)
    return {"ok": True}


@app.get("/monitor/status")
def monitor_status():
    return controller.status()


class PreferencesBody(BaseModel):
    preferences: Dict[str, Any] = Field(default_factory=dict)


@app.get("/settings/preferences")
def get_prefs():
    return db.get_preferences()


@app.put("/settings/preferences")
def put_prefs(body: PreferencesBody):
    db.set_preferences(body.preferences)
    return {"ok": True}


@app.post("/settings/reload")
async def settings_reload():
    """Reinicia monitor com prefs atuais (útil após mudar auto_upload)."""
    await asyncio.to_thread(controller.stop)
    ok, msg = await asyncio.to_thread(controller.start)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"ok": True}


# --- Pasta monitorada ---


@app.get("/folder/summary")
def folder_summary():
    m = _folder_monitor()
    if not m:
        raise HTTPException(status_code=400, detail="Pasta monitorada inválida ou não configurada.")
    stats = m.get_folder_stats()
    folder_path = Path(stats["folder_path"])
    try:
        du = shutil.disk_usage(folder_path)
    except OSError:
        du = shutil.disk_usage(folder_path.anchor or "/")
    return {
        **stats,
        "disk_total_bytes": du.total,
        "disk_used_bytes": du.used,
        "disk_free_bytes": du.free,
    }


@app.get("/folder/videos")
def folder_videos():
    m = _folder_monitor()
    if not m:
        raise HTTPException(status_code=400, detail="Pasta monitorada inválida ou não configurada.")
    return {"videos": m.list_videos(recursive=True)}


@app.get("/folder/video/thumbnail")
def folder_video_thumbnail(path: str = Query(..., min_length=1, description="Caminho absoluto do vídeo")):
    p = resolve_watch_video_path(path)
    if not p:
        raise HTTPException(status_code=404, detail="Vídeo não encontrado ou fora da pasta monitorada.")
    data = extract_thumbnail_jpeg(str(p))
    if not data:
        raise HTTPException(
            status_code=422, detail="Não foi possível gerar miniatura (codec ou ficheiro inválido)."
        )
    return Response(content=data, media_type="image/jpeg")


class FolderVideosDeleteBody(BaseModel):
    paths: List[str] = Field(..., min_length=1)


@app.post("/folder/videos/delete")
def folder_videos_delete(body: FolderVideosDeleteBody):
    m = _folder_monitor()
    if not m:
        raise HTTPException(status_code=400, detail="Pasta monitorada inválida ou não configurada.")
    deleted = 0
    errors: List[Dict[str, str]] = []
    for raw in body.paths:
        s = (raw or "").strip()
        if not s:
            errors.append({"path": raw or "", "detail": "Caminho vazio."})
            continue
        p = resolve_watch_video_path(s)
        if not p:
            errors.append({"path": s, "detail": "Caminho inválido ou fora da pasta monitorada."})
            continue
        if m.delete_video(str(p)):
            deleted += 1
        else:
            errors.append({"path": s, "detail": "Não foi possível apagar o ficheiro permanentemente."})
    return {"deleted": deleted, "errors": errors}


# --- Eventos / histórico ---


@app.get("/events")
def events_list(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    event_type: Optional[str] = Query(None, alias="type"),
    since: Optional[str] = None,
    until: Optional[str] = None,
):
    return {
        "events": db.list_events(
            limit=limit,
            offset=offset,
            type_filter=event_type,
            since_iso=since,
            until_iso=until,
        )
    }


@app.get("/events/stats")
def events_stats():
    by_t = db.event_counts_by_type()
    return {
        "by_type": by_t,
        "total": sum(by_t.values()),
    }


@app.delete("/events")
def events_delete():
    n = db.delete_all_events()
    return {"ok": True, "deleted": n}


# --- Dashboard ---


@app.get("/dashboard/summary")
def dashboard_summary():
    prefs = db.get_preferences()
    local_clips = 0
    m = _folder_monitor()
    if m:
        local_clips = len(m.list_videos(recursive=True))

    uploads_7 = db.uploads_per_day(7)
    yt = _youtube_status()
    activity = []
    views_by_day: Dict[str, int] = {}
    views_series_error: Optional[str] = None
    if yt["connected"]:
        c = client_secrets_path()
        t = token_path()
        up = YouTubeUploader(str(c), str(t), defer_interactive=True)
        if up.google_credentials and up.youtube_service:
            end_d = date.today()
            start_d = end_d - timedelta(days=6)
            series = fetch_daily_views_series(
                up.google_credentials,
                start_d.isoformat(),
                end_d.isoformat(),
            )
            views_series_error = series.get("error")
            for row in series.get("series") or []:
                views_by_day[str(row.get("day", ""))] = int(row.get("views", 0))

    for row in uploads_7:
        d = row["day"]
        activity.append(
            {
                "name": row["name"],
                "day": d,
                "uploads": row["uploads"],
                "views": views_by_day.get(d, 0),
            }
        )

    return {
        "total_uploads": db.count_upload_success(),
        "local_clips": local_clips,
        "auto_upload": bool(prefs.get("auto_upload", True)),
        "youtube_connected": yt["connected"],
        "monitor": controller.status(),
        "activity_days": activity,
        "activity_views_error": views_series_error,
    }


# --- YouTube Data ---


@app.get("/youtube/channel")
def youtube_channel():
    up = _uploader_or_400()
    data = fetch_channel_summary(up.youtube_service)
    if data.get("error"):
        raise HTTPException(status_code=502, detail=data["error"])
    return data


@app.get("/youtube/videos")
def youtube_videos(
    max_results: int = Query(25, ge=1, le=50),
    page_token: Optional[str] = None,
):
    up = _uploader_or_400()
    return fetch_my_uploads_page(up.youtube_service, max_results=max_results, page_token=page_token)


@app.get("/youtube/video")
def youtube_one_video(id: str = Query(..., min_length=1, description="ID do vídeo no YouTube")):
    up = _uploader_or_400()
    out = fetch_video_by_id(up.youtube_service, id.strip())
    if out.get("error"):
        msg = out["error"]
        code = 404 if "não encontrado" in msg.lower() else 400
        raise HTTPException(status_code=code, detail=msg)
    return out


class YoutubeVideosDeleteBody(BaseModel):
    ids: List[str] = Field(..., min_length=1)


@app.post("/youtube/videos/delete")
def youtube_videos_delete(body: YoutubeVideosDeleteBody):
    up = _uploader_or_400()
    deleted = 0
    errors: List[Dict[str, str]] = []
    for raw in body.ids:
        vid = (raw or "").strip()
        if not vid:
            errors.append({"id": raw or "", "detail": "ID vazio."})
            continue
        ok, msg = up.delete_video(vid)
        if ok:
            deleted += 1
        else:
            errors.append({"id": vid, "detail": msg or "Falha desconhecida."})
    return {"deleted": deleted, "errors": errors}


class YoutubeVideoUpdateBody(BaseModel):
    id: str = Field(..., min_length=1)
    title: Optional[str] = None
    description: Optional[str] = None
    privacy: Optional[str] = None
    tags: Optional[List[str]] = None


@app.post("/youtube/videos/update")
def youtube_video_update(body: YoutubeVideoUpdateBody):
    if (
        body.title is None
        and body.description is None
        and body.privacy is None
        and body.tags is None
    ):
        raise HTTPException(status_code=400, detail="Nada para atualizar.")
    up = _uploader_or_400()
    ok, msg = up.update_video(
        body.id.strip(),
        title=body.title,
        description=body.description,
        privacy_status=body.privacy,
        tags=body.tags,
    )
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"ok": True}


class YoutubeVideosPrivacyBody(BaseModel):
    ids: List[str] = Field(..., min_length=1)
    privacy: str = Field(..., min_length=1)


@app.post("/youtube/videos/privacy")
def youtube_videos_privacy(body: YoutubeVideosPrivacyBody):
    p = body.privacy.strip().lower()
    if p not in ("public", "unlisted", "private"):
        raise HTTPException(
            status_code=400, detail="privacy deve ser public, unlisted ou private."
        )
    up = _uploader_or_400()
    updated = 0
    errors: List[Dict[str, str]] = []
    for raw in body.ids:
        vid = (raw or "").strip()
        if not vid:
            errors.append({"id": raw or "", "detail": "ID vazio."})
            continue
        ok, msg = up.update_video(vid, privacy_status=p)
        if ok:
            updated += 1
        else:
            errors.append({"id": vid, "detail": msg or "Falha."})
    return {"updated": updated, "errors": errors}


# --- YouTube Analytics ---


@app.get("/youtube/analytics")
def youtube_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    up = _uploader_or_400()
    if not up.google_credentials:
        raise HTTPException(status_code=400, detail="Credenciais Google indisponíveis.")
    end_d = date.today()
    start_d = end_d - timedelta(days=29)
    if end_date:
        try:
            end_d = date.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="end_date inválido (YYYY-MM-DD).")
    if start_date:
        try:
            start_d = date.fromisoformat(start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="start_date inválido (YYYY-MM-DD).")
    if start_d > end_d:
        raise HTTPException(status_code=400, detail="start_date deve ser <= end_date.")
    return fetch_channel_analytics(
        up.google_credentials,
        start_d.isoformat(),
        end_d.isoformat(),
    )


# --- Upload manual ---


class ManualUploadBody(BaseModel):
    path: str = Field(..., min_length=1)


@app.post("/uploads/manual")
async def uploads_manual(body: ManualUploadBody):
    vid, err = await asyncio.to_thread(controller.manual_upload, body.path.strip())
    if not vid:
        raise HTTPException(status_code=400, detail=err or "Falha no upload.")
    return {"ok": True, "youtube_id": vid, "url": f"https://www.youtube.com/watch?v={vid}"}

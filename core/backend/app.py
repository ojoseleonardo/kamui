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
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
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
from .youtube_analytics import fetch_channel_analytics
from .video_thumbnail import extract_thumbnail_jpeg, resolve_watch_video_path
from .youtube_read import (
    clear_mine_uploads_playlist_cache,
    fetch_channel_summary,
    fetch_my_uploads_page,
    fetch_video_by_id,
)
from .youtube_uploader import YouTubeUploader, perform_youtube_oauth
from .youtube_rate_limit import acquire_google_youtube_slot


class MonitorController:
    """Instância única do VideoManager, controlada por rotas."""

    def __init__(self):
        self._lock = threading.Lock()
        self._manager: Optional[VideoManager] = None

    def _prefs(self) -> Dict[str, Any]:
        return db.get_preferences()

    def _privacy(self) -> str:
        return str(self._prefs().get("default_privacy", "unlisted"))

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

    def manual_upload(
        self,
        file_path: str,
        *,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        privacy: Optional[str] = None,
        thumbnail_mode: str = "frame",
        thumbnail_seek_ms: int = 800,
        thumbnail_url: Optional[str] = None,
        thumbnail_bytes: Optional[bytes] = None,
        thumbnail_mime: Optional[str] = None,
    ) -> tuple[Optional[str], str]:
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
        vid, upload_err = m.upload_video_manually(
            str(p),
            title=title,
            description=description,
            tags=tags,
            privacy_status=privacy,
            thumbnail_mode=thumbnail_mode,
            thumbnail_seek_ms=thumbnail_seek_ms,
            thumbnail_url=thumbnail_url,
            thumbnail_bytes=thumbnail_bytes,
            thumbnail_mime=thumbnail_mime,
        )
        if vid:
            return vid, ""
        return None, upload_err or "Upload falhou ou YouTube indisponível."


controller = MonitorController()


def _folder_monitor() -> Optional[FileMonitor]:
    wf = db.get_setting("watch_folder") or ""
    p = Path(wf)
    if not wf or not p.is_dir():
        return None
    return FileMonitor(str(p.resolve()))


_youtube_status_cache: Dict[str, Any] = {"t": 0.0, "payload": None}
_dashboard_youtube_cache: Dict[str, Any] = {"t": 0.0, "total_uploads": None, "uploads_by_day": {}}


def _invalidate_youtube_status_cache() -> None:
    _youtube_status_cache["t"] = 0.0
    _youtube_status_cache["payload"] = None


def _invalidate_youtube_api_caches() -> None:
    """Após novo OAuth ou troca de conta — não reutilizar estado antigo."""
    _invalidate_youtube_status_cache()
    _invalidate_dashboard_youtube_cache()
    clear_mine_uploads_playlist_cache()


def _invalidate_dashboard_youtube_cache() -> None:
    _dashboard_youtube_cache["t"] = 0.0
    _dashboard_youtube_cache["total_uploads"] = None
    _dashboard_youtube_cache["uploads_by_day"] = {}


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


def _youtube_uploads_per_day_last_days(service: Any, days: int = 7, max_pages: int = 12) -> Dict[str, int]:
    """
    Conta uploads por dia usando a playlist de uploads do canal.
    Lê até `max_pages` (50 itens/página) e para cedo quando os itens
    ficam mais antigos do que a janela desejada.
    """
    cutoff = date.today() - timedelta(days=days - 1)
    counts: Dict[str, int] = {}
    token: Optional[str] = None
    pages = 0

    while pages < max_pages:
        page = fetch_my_uploads_page(service, max_results=50, page_token=token)
        items = page.get("items") or []
        if not items:
            break

        reached_older = False
        for item in items:
            published = str(item.get("published_at") or "")
            if not published:
                continue
            try:
                dt = datetime.fromisoformat(published.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                day = dt.astimezone(timezone.utc).date()
            except ValueError:
                continue

            if day < cutoff:
                reached_older = True
                continue

            day_iso = day.isoformat()
            counts[day_iso] = counts.get(day_iso, 0) + 1

        token = page.get("next_page_token")
        pages += 1
        if not token or reached_older:
            break

    return counts


def _youtube_existing_video_ids(service: Any, youtube_ids: List[str]) -> set[str]:
    existing: set[str] = set()
    clean = [str(x).strip() for x in youtube_ids if str(x or "").strip()]
    if not clean:
        return existing
    for i in range(0, len(clean), 50):
        chunk = clean[i : i + 50]
        acquire_google_youtube_slot()
        res = service.videos().list(part="id", id=",".join(chunk), maxResults=50).execute()
        for item in res.get("items") or []:
            vid = str(item.get("id") or "").strip()
            if vid:
                existing.add(vid)
    return existing


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
    """Reinicia monitor com prefs atuais (privacidade padrão, etc.)."""
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


@app.get("/folder/video/play")
def folder_video_play(path: str = Query(..., min_length=1, description="Caminho absoluto do vídeo")):
    p = resolve_watch_video_path(path)
    if not p:
        raise HTTPException(status_code=404, detail="Vídeo não encontrado ou fora da pasta monitorada.")
    if not p.is_file():
        raise HTTPException(status_code=404, detail="Arquivo de vídeo não encontrado.")
    return FileResponse(path=str(p), media_type="video/mp4", filename=p.name)


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
            db.insert_event(
                "file_deleted",
                title="Arquivo local removido",
                detail=p.name,
                file_path=str(p),
            )
        else:
            errors.append({"path": s, "detail": "Não foi possível apagar o ficheiro permanentemente."})
    return {"deleted": deleted, "errors": errors}


# --- Eventos / histórico ---


@app.get("/events")
def events_list(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    event_type: Optional[str] = Query(None, alias="type"),
    reconcile_uploads: bool = Query(False),
    since: Optional[str] = None,
    until: Optional[str] = None,
):
    events = db.list_events(
        limit=limit,
        offset=offset,
        type_filter=event_type,
        since_iso=since,
        until_iso=until,
    )

    if reconcile_uploads:
        ids = [str(e.get("youtube_id") or "").strip() for e in events if e.get("type") == "upload_success"]
        ids = [x for x in ids if x]
        if ids:
            yt = _youtube_status()
            if yt.get("connected"):
                try:
                    up = _uploader_or_400()
                    existing = _youtube_existing_video_ids(up.youtube_service, ids)
                    missing = [vid for vid in ids if vid not in existing]
                    changed = False
                    for vid in missing:
                        if not db.has_event_with_type_and_youtube_id("youtube_deleted", vid):
                            db.insert_event(
                                "youtube_deleted",
                                title="Vídeo removido do YouTube",
                                detail=vid,
                                youtube_id=vid,
                            )
                            changed = True
                    if changed:
                        events = db.list_events(
                            limit=limit,
                            offset=offset,
                            type_filter=event_type,
                            since_iso=since,
                            until_iso=until,
                        )
                except Exception:
                    # Em falha de rede/API, mantém a resposta local sem bloquear a UI.
                    pass

    return {"events": events}


@app.get("/events/stats")
def events_stats():
    by_t = db.event_counts_by_type()
    uploads_truth = db.count_upload_success()
    yt = _youtube_status()
    if yt.get("connected"):
        try:
            up = _uploader_or_400()
            ch = fetch_channel_summary(up.youtube_service)
            if not ch.get("error"):
                uploads_truth = int(ch.get("video_count", uploads_truth) or uploads_truth)
        except Exception:
            # Falha na leitura do YouTube: mantém fallback local.
            pass
    return {
        "by_type": by_t,
        "total": sum(by_t.values()),
        "uploads_truth": uploads_truth,
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

    yt = _youtube_status()
    uploads_local_7 = db.uploads_per_day(7)
    uploads_effective_7 = uploads_local_7
    uploads_youtube_by_day: Dict[str, int] = {}
    yt_deletions_7 = db.youtube_deletions_per_day(7)
    local_deletions_7 = db.local_deletions_per_day(7)
    total_uploads = db.count_upload_success()
    activity = []
    if yt["connected"]:
        c = client_secrets_path()
        t = token_path()
        up = YouTubeUploader(str(c), str(t), defer_interactive=True)
        if up.google_credentials and up.youtube_service:
            now = time.monotonic()
            cached_ok = now - float(_dashboard_youtube_cache.get("t", 0.0)) < 45.0
            cached_total = _dashboard_youtube_cache.get("total_uploads")
            cached_uploads = _dashboard_youtube_cache.get("uploads_by_day") or {}
            if cached_ok and cached_total is not None:
                total_uploads = int(cached_total)
                yt_uploads_by_day = {str(k): int(v) for k, v in cached_uploads.items()}
            else:
                ch = fetch_channel_summary(up.youtube_service)
                if not ch.get("error"):
                    total_uploads = int(ch.get("video_count", total_uploads) or total_uploads)
                yt_uploads_by_day = _youtube_uploads_per_day_last_days(up.youtube_service, days=7)
                _dashboard_youtube_cache["t"] = now
                _dashboard_youtube_cache["total_uploads"] = total_uploads
                _dashboard_youtube_cache["uploads_by_day"] = dict(yt_uploads_by_day)

            names = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
            rebuilt: List[Dict[str, Any]] = []
            for i in range(6, -1, -1):
                d = date.today() - timedelta(days=i)
                d_iso = d.isoformat()
                rebuilt.append(
                    {
                        "day": d_iso,
                        "name": names[d.weekday()],
                        "uploads": int(yt_uploads_by_day.get(d_iso, 0)),
                    }
                )
            uploads_effective_7 = rebuilt
            for row in rebuilt:
                uploads_youtube_by_day[row["day"]] = int(row.get("uploads", 0))

    yt_deletions_by_day = {row["day"]: int(row.get("deleted", 0)) for row in yt_deletions_7}
    local_deletions_by_day = {row["day"]: int(row.get("deleted", 0)) for row in local_deletions_7}
    uploads_local_by_day = {row["day"]: int(row.get("uploads", 0)) for row in uploads_local_7}

    for row in uploads_effective_7:
        d = row["day"]
        activity.append(
            {
                "name": row["name"],
                "day": d,
                "uploads": row["uploads"],
                "uploads_local": uploads_local_by_day.get(d, 0),
                "uploads_youtube": uploads_youtube_by_day.get(d, 0),
                "youtube_deleted": yt_deletions_by_day.get(d, 0),
                "local_deleted": local_deletions_by_day.get(d, 0),
                "deleted": yt_deletions_by_day.get(d, 0),
            }
        )

    return {
        "total_uploads": total_uploads,
        "local_clips": local_clips,
        "upload_mode": "manual",
        "youtube_connected": yt["connected"],
        "monitor": controller.status(),
        "activity_days": activity,
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
            _invalidate_dashboard_youtube_cache()
            db.insert_event(
                "youtube_deleted",
                title="Vídeo removido do YouTube",
                detail=vid,
                youtube_id=vid,
            )
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


_THUMB_MODES = frozenset({"frame", "file", "url", "youtube"})


@app.post("/uploads/manual")
async def uploads_manual(
    path: str = Form(..., min_length=1),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    privacy: Optional[str] = Form(None),
    thumbnail_mode: str = Form("frame"),
    thumbnail_seek_ms: Optional[int] = Form(None),
    thumbnail_url: Optional[str] = Form(None),
    thumbnail: Optional[UploadFile] = File(None),
):
    mode = (thumbnail_mode or "frame").strip().lower()
    if mode not in _THUMB_MODES:
        raise HTTPException(
            status_code=400,
            detail="thumbnail_mode deve ser frame, file, url ou youtube.",
        )
    if privacy is not None and str(privacy).strip():
        pv = str(privacy).strip().lower()
        if pv not in ("public", "unlisted", "private"):
            raise HTTPException(status_code=400, detail="privacy inválido.")
    else:
        pv = None

    tag_list: Optional[List[str]] = None
    if tags is not None and str(tags).strip():
        tag_list = [t.strip() for t in str(tags).split(",") if t.strip()]

    seek_ms = 800 if thumbnail_seek_ms is None else max(0, int(thumbnail_seek_ms))

    thumb_bytes: Optional[bytes] = None
    thumb_mime: Optional[str] = None
    if mode == "file":
        if thumbnail is None or not thumbnail.filename:
            raise HTTPException(
                status_code=400,
                detail="Envie um ficheiro de imagem (campo thumbnail) quando thumbnail_mode=file.",
            )
        thumb_bytes = await thumbnail.read()
        if not thumb_bytes:
            raise HTTPException(status_code=400, detail="Ficheiro de miniatura vazio.")
        thumb_mime = (thumbnail.content_type or "").split(";")[0].strip().lower() or None
        if thumb_mime not in ("image/jpeg", "image/jpg", "image/png"):
            raise HTTPException(
                status_code=400,
                detail="Miniatura deve ser JPEG ou PNG.",
            )

    def _run():
        return controller.manual_upload(
            path.strip(),
            title=title.strip() if title else None,
            description=description if description is not None else None,
            tags=tag_list,
            privacy=pv,
            thumbnail_mode=mode,
            thumbnail_seek_ms=seek_ms,
            thumbnail_url=(thumbnail_url.strip() if thumbnail_url else None),
            thumbnail_bytes=thumb_bytes,
            thumbnail_mime=thumb_mime,
        )

    vid, err = await asyncio.to_thread(_run)
    if not vid:
        raise HTTPException(status_code=400, detail=err or "Falha no upload.")
    return {"ok": True, "youtube_id": vid, "url": f"https://www.youtube.com/watch?v={vid}"}

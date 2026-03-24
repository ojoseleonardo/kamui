"""
Gerenciador principal: FileMonitor + YouTubeUploader.
"""

import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from . import db
from .image_fetch import fetch_image_from_https_url
from .logger_config import LoggerConfig, setup_logging
from .file_monitor import FileMonitor
from .video_thumbnail import extract_thumbnail_jpeg
from .youtube_uploader import YouTubeUploader


class VideoManager:
    """Integra monitoramento de pasta e upload YouTube (só envio manual)."""

    def __init__(
        self,
        watch_folder: str,
        credentials_file: str,
        token_file: str,
        log_dir: str,
        privacy_status: str = "unlisted",
    ):
        self._credentials_file = str(Path(credentials_file).resolve())
        self._token_file = str(Path(token_file).resolve())
        self._log_dir = log_dir

        self.logger = setup_logging(log_dir=log_dir, log_level=LoggerConfig.INFO)

        self.file_monitor = FileMonitor(watch_folder)
        self.youtube_uploader = None

        self.privacy_status = privacy_status
        self.running = False
        self.uploaded_videos = set()
        self._upload_lock = threading.Lock()
        self._uploads_in_flight: set[str] = set()
        self._hydrate_uploaded_from_db()

        self._init_youtube()

    @staticmethod
    def _parse_event_created_at(created_at: str) -> Optional[datetime]:
        try:
            s = created_at.replace("Z", "+00:00")
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except (ValueError, TypeError):
            return None

    def _hydrate_uploaded_from_db(self):
        for path, created_at in db.list_latest_upload_success_with_created():
            upload_dt = self._parse_event_created_at(created_at)
            if upload_dt is None:
                continue
            p = Path(path)
            if not p.is_file():
                continue
            try:
                resolved = str(p.resolve())
                mtime_dt = datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc)
            except OSError:
                continue
            if mtime_dt > upload_dt:
                continue
            self.uploaded_videos.add(resolved)

    def _remove_local_after_upload(self, file_path: str, resolved: str) -> None:
        if not bool(self._prefs().get("delete_after_upload", True)):
            self.logger.info("[UPLOAD] Manter arquivo local após envio (delete_after_upload=false).")
            return
        if self.file_monitor.delete_video(file_path):
            self.uploaded_videos.discard(resolved)
            db.insert_event(
                "file_deleted",
                title="Arquivo local removido",
                detail=Path(file_path).name,
                file_path=resolved,
            )
        else:
            self.logger.error(
                f"[UPLOAD] Vídeo enviado ao YouTube, mas falhou ao apagar o arquivo local: {file_path}"
            )

    def _prefs(self) -> Dict[str, Any]:
        return db.get_preferences()

    def _upload_metadata(self, file_path: str) -> tuple:
        """title=None usa geração no uploader; tags/description vindos das prefs se definidos."""
        prefs = self._prefs()
        desc = (prefs.get("default_description") or "").strip() or None
        tags_raw = prefs.get("default_tags")
        tags: Optional[List[str]] = None
        if isinstance(tags_raw, str) and tags_raw.strip():
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
        return desc, tags

    def _init_youtube(self):
        try:
            self.youtube_uploader = YouTubeUploader(
                self._credentials_file,
                self._token_file,
                defer_interactive=True,
            )
            if not self.youtube_uploader.youtube_service:
                self.logger.warning("YouTube uploader não disponível.")
        except Exception as e:
            self.logger.error(f"Erro ao inicializar YouTube uploader: {str(e)}")
            self.youtube_uploader = None

    def rebuild_youtube(self):
        """Recarrega cliente YouTube após novo OAuth (token atualizado)."""
        self._init_youtube()

    def _on_video_detected(self, event_type: str, *args):
        if event_type == "created" and args:
            file_path = args[0]
            self.logger.info(f"[EVENTO] Novo vídeo detectado: {file_path}")
            try:
                resolved = str(Path(file_path).resolve())
            except OSError:
                resolved = file_path
            if not db.clip_detected_logged_today(resolved):
                name = Path(file_path).name
                sz = Path(file_path).stat().st_size if Path(file_path).exists() else None
                db.insert_event(
                    "clip_detected",
                    title="Novo clipe detectado",
                    detail=name,
                    file_path=resolved,
                    file_size=sz,
                )

    def start(self):
        if self.running:
            self.logger.warning("Gerenciador já está em execução")
            return

        self.running = True
        self.logger.info("[SISTEMA] Iniciando gerenciador de vídeos")
        db.insert_event(
            "system",
            title="Monitoramento iniciado",
            detail="O Kamui começou a monitorar a pasta de clipes.",
        )

        self.file_monitor.start_monitoring(callback=self._on_video_detected)

        self.logger.info("[SISTEMA] Gerenciador iniciado com sucesso")

    def stop(self):
        if not self.running:
            return

        self.running = False
        self.logger.info("[SISTEMA] Parando gerenciador de vídeos")

        self.file_monitor.stop_monitoring()
        db.insert_event(
            "system",
            title="Monitoramento parado",
            detail="O monitor da pasta foi encerrado.",
        )

        self.logger.info("[SISTEMA] Gerenciador parado")

    def queue_status(self) -> Dict[str, Any]:
        """Uploads manuais em curso (sem fila automática)."""
        with self._upload_lock:
            in_flight = len(self._uploads_in_flight)
        return {
            "in_flight": in_flight,
            "pending": 0,
            "total": in_flight,
        }

    def _apply_thumbnail(
        self,
        youtube_video_id: str,
        file_path: str,
        thumbnail_mode: str,
        thumbnail_seek_ms: int,
        thumbnail_url: Optional[str],
        thumbnail_bytes: Optional[bytes],
        thumbnail_mime: Optional[str],
    ) -> None:
        mode = (thumbnail_mode or "frame").strip().lower()
        if mode == "youtube":
            return
        up = self.youtube_uploader
        if not up:
            return

        if mode == "frame":
            seek = max(0, int(thumbnail_seek_ms))
            jpg = extract_thumbnail_jpeg(file_path, max_width=1280, seek_ms=seek)
            if not jpg:
                self.logger.warning("[UPLOAD] Não foi possível extrair frame para miniatura.")
                return
            ok, msg = up.set_thumbnail(youtube_video_id, jpg, "image/jpeg")
            if not ok:
                self.logger.warning("[UPLOAD] Miniatura (frame) não aplicada: %s", msg)
            return

        if mode == "file":
            if not thumbnail_bytes or not thumbnail_mime:
                self.logger.warning("[UPLOAD] Modo ficheiro sem dados de imagem.")
                return
            ok, msg = up.set_thumbnail(youtube_video_id, thumbnail_bytes, thumbnail_mime)
            if not ok:
                self.logger.warning("[UPLOAD] Miniatura (ficheiro) não aplicada: %s", msg)
            return

        if mode == "url":
            url = (thumbnail_url or "").strip()
            if not url:
                self.logger.warning("[UPLOAD] Modo URL sem endereço.")
                return
            data, mime, err = fetch_image_from_https_url(url)
            if err or not data:
                self.logger.warning("[UPLOAD] Miniatura (URL): %s", err or "sem dados")
                return
            ok, msg = up.set_thumbnail(youtube_video_id, data, mime)
            if not ok:
                self.logger.warning("[UPLOAD] Miniatura (URL) não aplicada: %s", msg)
            return

        self.logger.warning("[UPLOAD] Modo de miniatura desconhecido: %s", mode)

    def upload_video_manually(
        self,
        file_path: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        privacy_status: Optional[str] = None,
        *,
        thumbnail_mode: str = "frame",
        thumbnail_seek_ms: int = 800,
        thumbnail_url: Optional[str] = None,
        thumbnail_bytes: Optional[bytes] = None,
        thumbnail_mime: Optional[str] = None,
    ) -> tuple[Optional[str], str]:
        if not self.youtube_uploader or not self.youtube_uploader.youtube_service:
            self.logger.error("YouTube uploader não está disponível")
            return None, "YouTube não está autenticado. Conecte a conta em Configurações."

        privacy = privacy_status or self.privacy_status

        if not Path(file_path).exists():
            self.logger.error(f"Arquivo não encontrado: {file_path}")
            return None, "Arquivo não encontrado."

        try:
            resolved = str(Path(file_path).resolve())
        except OSError:
            resolved = file_path

        with self._upload_lock:
            if resolved in self._uploads_in_flight:
                self.logger.warning(f"Upload manual ignorado: já há upload em andamento para {file_path}")
                return None, "Já existe um upload em andamento para este ficheiro."
            self._uploads_in_flight.add(resolved)

        try:
            video_info = self.file_monitor.get_video_info(file_path)
            metadata = video_info if video_info else {}
            pref_desc, pref_tags = self._upload_metadata(file_path)
            use_desc = description if description is not None else pref_desc
            use_tags = tags if tags is not None else pref_tags

            use_title = (title.strip() if isinstance(title, str) else None) or None

            def progress_callback(progress: float):
                self.logger.info(f"[UPLOAD] Progresso: {progress:.2f}%")

            youtube_video_id, upload_err = self.youtube_uploader.upload_video(
                file_path,
                title=use_title,
                description=use_desc,
                tags=use_tags,
                privacy_status=privacy,
                progress_callback=progress_callback,
                metadata=metadata,
            )

            if youtube_video_id:
                self._apply_thumbnail(
                    youtube_video_id,
                    file_path,
                    thumbnail_mode,
                    thumbnail_seek_ms,
                    thumbnail_url,
                    thumbnail_bytes,
                    thumbnail_mime,
                )
                self.uploaded_videos.add(resolved)
                self.logger.info(f"[UPLOAD] Concluído! YouTube ID: {youtube_video_id}")
                db.insert_event(
                    "upload_success",
                    title="Upload concluído",
                    detail=Path(file_path).name,
                    file_path=resolved,
                    youtube_id=youtube_video_id,
                    file_size=metadata.get("size"),
                )
                self._remove_local_after_upload(file_path, resolved)
                return youtube_video_id, ""

            db.insert_event(
                "upload_error",
                title="Falha no upload",
                detail=Path(file_path).name,
                file_path=resolved,
                error=upload_err or "Upload manual sem ID",
                file_size=metadata.get("size"),
            )
            return None, upload_err or "Upload falhou."
        finally:
            with self._upload_lock:
                self._uploads_in_flight.discard(resolved)

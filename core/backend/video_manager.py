"""
Gerenciador principal: FileMonitor + YouTubeUploader.
"""

import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

from . import db
from .logger_config import LoggerConfig, setup_logging
from .file_monitor import FileMonitor
from .youtube_uploader import YouTubeUploader


class VideoManager:
    """Integra monitoramento de pasta e upload YouTube."""

    def __init__(
        self,
        watch_folder: str,
        credentials_file: str,
        token_file: str,
        log_dir: str,
        auto_upload: bool = False,
        privacy_status: str = "private",
    ):
        self._credentials_file = str(Path(credentials_file).resolve())
        self._token_file = str(Path(token_file).resolve())
        self._log_dir = log_dir

        self.logger = setup_logging(log_dir=log_dir, log_level=LoggerConfig.INFO)

        self.file_monitor = FileMonitor(watch_folder)
        self.youtube_uploader = None

        self.auto_upload = auto_upload
        self.privacy_status = privacy_status
        self.running = False
        self.uploaded_videos = set()
        self._upload_lock = threading.Lock()
        self._uploads_in_flight: set[str] = set()
        self._hydrate_uploaded_from_db()

        self._init_youtube()

    def _hydrate_uploaded_from_db(self):
        for p in db.list_upload_success_paths():
            try:
                self.uploaded_videos.add(str(Path(p).resolve()))
            except OSError:
                self.uploaded_videos.add(p)

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
                if self.auto_upload:
                    self.auto_upload = False
        except Exception as e:
            self.logger.error(f"Erro ao inicializar YouTube uploader: {str(e)}")
            self.youtube_uploader = None
            if self.auto_upload:
                self.auto_upload = False

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

            if self.auto_upload and self.youtube_uploader and self.youtube_uploader.youtube_service:
                self._queue_upload(file_path)

    def _queue_upload(self, file_path: str):
        try:
            key = str(Path(file_path).resolve())
        except OSError:
            key = file_path
        if key in self.uploaded_videos:
            self.logger.info(f"Vídeo já foi enviado: {file_path}")
            return

        if not Path(file_path).exists():
            self.logger.warning(f"Arquivo não encontrado: {file_path}")
            return

        with self._upload_lock:
            if key in self._uploads_in_flight:
                self.logger.info(f"Upload já em andamento (ignorado): {file_path}")
                return
            self._uploads_in_flight.add(key)

        thread = threading.Thread(target=self._upload_video, args=(file_path,), daemon=True)
        thread.start()

    def _upload_video(self, file_path: str):
        try:
            resolved = str(Path(file_path).resolve())
        except OSError:
            resolved = file_path
        try:
            self.logger.info(f"[UPLOAD] Iniciando upload: {file_path}")

            video_info = self.file_monitor.get_video_info(file_path)
            metadata = video_info if video_info else {}
            pref_desc, pref_tags = self._upload_metadata(file_path)

            def progress_callback(progress: float):
                self.logger.info(f"[UPLOAD] Progresso: {progress:.2f}%")

            youtube_video_id = self.youtube_uploader.upload_video(
                file_path,
                title=None,
                description=pref_desc,
                tags=pref_tags,
                privacy_status=self.privacy_status,
                progress_callback=progress_callback,
                metadata=metadata,
            )

            if youtube_video_id:
                self.uploaded_videos.add(resolved)
                self.logger.info(f"[UPLOAD] Concluído! ID: {youtube_video_id}")
                db.insert_event(
                    "upload_success",
                    title="Upload concluído",
                    detail=Path(file_path).name,
                    file_path=resolved,
                    youtube_id=youtube_video_id,
                    file_size=metadata.get("size"),
                )
            else:
                self.logger.error(f"[UPLOAD] Falhou: {file_path}")
                db.insert_event(
                    "upload_error",
                    title="Falha no upload",
                    detail=Path(file_path).name,
                    file_path=resolved,
                    error="Upload retornou sem ID de vídeo",
                    file_size=metadata.get("size"),
                )

        except Exception as e:
            self.logger.error(f"[UPLOAD] Erro: {str(e)}")
            try:
                sz = Path(file_path).stat().st_size if Path(file_path).exists() else None
            except OSError:
                sz = None
            db.insert_event(
                "upload_error",
                title="Falha no upload",
                detail=Path(file_path).name,
                file_path=resolved,
                error=str(e),
                file_size=sz,
            )
        finally:
            with self._upload_lock:
                self._uploads_in_flight.discard(resolved)

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

        # Não varrer a pasta ao arrancar: evita disparar dezenas de uploads de uma vez
        # (e spam de erros se o YouTube estiver em limite). Pendentes: envio manual em Local.

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

    def upload_video_manually(
        self,
        file_path: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        privacy_status: Optional[str] = None,
    ) -> Optional[str]:
        if not self.youtube_uploader or not self.youtube_uploader.youtube_service:
            self.logger.error("YouTube uploader não está disponível")
            return None

        privacy = privacy_status or self.privacy_status

        if not Path(file_path).exists():
            self.logger.error(f"Arquivo não encontrado: {file_path}")
            return None

        try:
            resolved = str(Path(file_path).resolve())
        except OSError:
            resolved = file_path

        with self._upload_lock:
            if resolved in self._uploads_in_flight:
                self.logger.warning(f"Upload manual ignorado: já há upload em andamento para {file_path}")
                return None
            self._uploads_in_flight.add(resolved)

        try:
            video_info = self.file_monitor.get_video_info(file_path)
            metadata = video_info if video_info else {}
            pref_desc, pref_tags = self._upload_metadata(file_path)
            use_desc = description if description is not None else pref_desc
            use_tags = tags if tags is not None else pref_tags

            def progress_callback(progress: float):
                self.logger.info(f"[UPLOAD] Progresso: {progress:.2f}%")

            youtube_video_id = self.youtube_uploader.upload_video(
                file_path,
                title=title,
                description=use_desc,
                tags=use_tags,
                privacy_status=privacy,
                progress_callback=progress_callback,
                metadata=metadata,
            )

            if youtube_video_id:
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
                return youtube_video_id

            db.insert_event(
                "upload_error",
                title="Falha no upload",
                detail=Path(file_path).name,
                file_path=resolved,
                error="Upload manual retornou sem ID",
                file_size=metadata.get("size"),
            )
            return None
        finally:
            with self._upload_lock:
                self._uploads_in_flight.discard(resolved)

"""
Monitor de Arquivos de Vídeo
Monitora uma pasta específica e detecta novos arquivos de vídeo.
"""

import shutil
from pathlib import Path
from typing import List, Optional, Dict, Callable
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent

from .logger_config import LoggerConfig

VIDEO_EXTENSIONS = {
    ".mp4",
    ".avi",
    ".mkv",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".m4v",
    ".mpg",
    ".mpeg",
    ".3gp",
    ".ogv",
    ".ts",
    ".m2ts",
}


class VideoFileHandler(FileSystemEventHandler):
    """Handler para eventos do sistema de arquivos relacionados a vídeos."""

    def __init__(self, callback: Optional[Callable] = None):
        super().__init__()
        self.callback = callback
        self.logger = LoggerConfig.get_logger(__name__)

    def on_created(self, event: FileSystemEvent):
        if not event.is_directory and self._is_video_file(event.src_path):
            self.logger.info(f"[DETECÇÃO] Novo vídeo criado: {event.src_path}")
            if self.callback:
                self.callback("created", event.src_path)

    def on_deleted(self, event: FileSystemEvent):
        if not event.is_directory and self._is_video_file(event.src_path):
            self.logger.info(f"[DELEÇÃO] Vídeo deletado: {event.src_path}")
            if self.callback:
                self.callback("deleted", event.src_path)

    def on_modified(self, event: FileSystemEvent):
        if not event.is_directory and self._is_video_file(event.src_path):
            self.logger.info(f"[MODIFICAÇÃO] Vídeo modificado: {event.src_path}")
            if self.callback:
                self.callback("modified", event.src_path)

    def on_moved(self, event: FileSystemEvent):
        if not event.is_directory and self._is_video_file(event.dest_path):
            self.logger.info(f"[MOVIMENTAÇÃO] Vídeo movido: {event.src_path} -> {event.dest_path}")
            if self.callback:
                self.callback("moved", event.src_path, event.dest_path)

    @staticmethod
    def _is_video_file(file_path: str) -> bool:
        return Path(file_path).suffix.lower() in VIDEO_EXTENSIONS


class FileMonitor:
    """Monitor de arquivos de vídeo em uma pasta específica."""

    def __init__(self, watch_folder: str):
        self.watch_folder = Path(watch_folder).resolve()
        self.observer: Optional[Observer] = None
        self.event_handler: Optional[VideoFileHandler] = None
        self.logger = LoggerConfig.get_logger(__name__)

        if not self.watch_folder.exists():
            self.watch_folder.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"Pasta criada: {self.watch_folder}")

    def list_videos(self, recursive: bool = False) -> List[Dict[str, any]]:
        videos = []
        pattern = "**/*" if recursive else "*"

        for file_path in self.watch_folder.glob(pattern):
            if file_path.is_file() and file_path.suffix.lower() in VIDEO_EXTENSIONS:
                stat = file_path.stat()
                videos.append(
                    {
                        "name": file_path.name,
                        "path": str(file_path),
                        "size": stat.st_size,
                        "size_mb": round(stat.st_size / (1024 * 1024), 2),
                        "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "extension": file_path.suffix.lower(),
                    }
                )

        return sorted(videos, key=lambda x: x["modified"], reverse=True)

    def delete_video(self, video_path: str) -> bool:
        try:
            file_path = Path(video_path)

            if file_path.suffix.lower() not in VIDEO_EXTENSIONS:
                self.logger.warning(f"Arquivo não é um vídeo: {video_path}")
                return False

            if not file_path.exists():
                self.logger.warning(f"Arquivo não encontrado: {video_path}")
                return False

            if not str(file_path.resolve()).startswith(str(self.watch_folder.resolve())):
                self.logger.warning(f"Arquivo fora da pasta monitorada: {video_path}")
                return False

            file_path.unlink()
            self.logger.info(f"[DELEÇÃO] Vídeo apagado permanentemente: {video_path}")
            return True

        except Exception as e:
            self.logger.error(f"Erro ao apagar vídeo permanentemente {video_path}: {str(e)}")
            return False

    def delete_video_by_name(self, video_name: str) -> bool:
        video_path = self.watch_folder / video_name
        return self.delete_video(str(video_path))

    def copy_video(self, source_path: str, new_name: Optional[str] = None) -> Optional[str]:
        try:
            source = Path(source_path)

            if not source.exists():
                self.logger.error(f"Arquivo de origem não encontrado: {source_path}")
                return None

            if source.suffix.lower() not in VIDEO_EXTENSIONS:
                self.logger.warning(f"Arquivo não é um vídeo: {source_path}")
                return None

            if new_name:
                dest_name = new_name
                if not dest_name.endswith(source.suffix):
                    dest_name += source.suffix
            else:
                dest_name = source.name

            dest_path = self.watch_folder / dest_name

            if dest_path.exists():
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                name_parts = dest_path.stem, dest_path.suffix
                dest_name = f"{name_parts[0]}_{timestamp}{name_parts[1]}"
                dest_path = self.watch_folder / dest_name

            shutil.copy2(source, dest_path)
            self.logger.info(f"Vídeo copiado: {source_path} -> {dest_path}")
            return str(dest_path)

        except Exception as e:
            self.logger.error(f"Erro ao copiar vídeo {source_path}: {str(e)}")
            return None

    def move_video(self, source_path: str, new_name: Optional[str] = None) -> Optional[str]:
        try:
            source = Path(source_path)

            if not source.exists():
                self.logger.error(f"Arquivo de origem não encontrado: {source_path}")
                return None

            if source.suffix.lower() not in VIDEO_EXTENSIONS:
                self.logger.warning(f"Arquivo não é um vídeo: {source_path}")
                return None

            if new_name:
                dest_name = new_name
                if not dest_name.endswith(source.suffix):
                    dest_name += source.suffix
            else:
                dest_name = source.name

            dest_path = self.watch_folder / dest_name

            if dest_path.exists():
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                name_parts = dest_path.stem, dest_path.suffix
                dest_name = f"{name_parts[0]}_{timestamp}{name_parts[1]}"
                dest_path = self.watch_folder / dest_name

            shutil.move(str(source), str(dest_path))
            self.logger.info(f"Vídeo movido: {source_path} -> {dest_path}")
            return str(dest_path)

        except Exception as e:
            self.logger.error(f"Erro ao mover vídeo {source_path}: {str(e)}")
            return None

    def get_video_info(self, video_path: str) -> Optional[Dict[str, any]]:
        try:
            file_path = Path(video_path)

            if not file_path.exists():
                return None

            if file_path.suffix.lower() not in VIDEO_EXTENSIONS:
                return None

            stat = file_path.stat()
            return {
                "name": file_path.name,
                "path": str(file_path),
                "size": stat.st_size,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "size_gb": round(stat.st_size / (1024 * 1024 * 1024), 2),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "extension": file_path.suffix.lower(),
            }
        except Exception as e:
            self.logger.error(f"Erro ao obter informações do vídeo {video_path}: {str(e)}")
            return None

    def start_monitoring(self, callback: Optional[Callable] = None):
        if self.observer and self.observer.is_alive():
            self.logger.warning("Monitoramento já está em execução")
            return

        self.event_handler = VideoFileHandler(callback=callback)
        self.observer = Observer()
        self.observer.schedule(self.event_handler, str(self.watch_folder), recursive=True)
        self.observer.start()
        self.logger.info(f"[MONITORAMENTO] Iniciado para: {self.watch_folder}")

    def stop_monitoring(self):
        if self.observer and self.observer.is_alive():
            self.observer.stop()
            self.observer.join(timeout=5)
            self.logger.info("[MONITORAMENTO] Parado")
        else:
            self.logger.warning("Monitoramento não está em execução")

    def get_folder_stats(self) -> Dict[str, any]:
        videos = self.list_videos(recursive=True)
        total_size = sum(v["size"] for v in videos)

        return {
            "total_videos": len(videos),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "total_size_gb": round(total_size / (1024 * 1024 * 1024), 2),
            "folder_path": str(self.watch_folder),
            "extensions": list(set(v["extension"] for v in videos)),
        }

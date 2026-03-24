"""CLI de desenvolvimento: `python -m backend.cli` (cwd = core/)."""

import argparse
import json
import os
import signal
import sys
import time
from pathlib import Path

from .file_monitor import FileMonitor
from .logger_config import LoggerConfig, setup_logging
from .paths import client_secrets_path, logs_dir, token_path
from .video_manager import VideoManager

def _default_folder() -> str:
    env = os.environ.get("KAMUI_WATCH_FOLDER")
    if env:
        return str(Path(env).expanduser().resolve())
    return str(Path.cwd().resolve())


def _vm(folder: str, privacy: str = "unlisted") -> VideoManager:
    return VideoManager(
        watch_folder=folder,
        credentials_file=str(client_secrets_path()),
        token_file=str(token_path()),
        log_dir=str(logs_dir()),
        privacy_status=privacy,
    )


def cmd_list(args):
    monitor = FileMonitor(args.folder)
    videos = monitor.list_videos(recursive=args.recursive)
    if args.json:
        print(json.dumps(videos, indent=2, ensure_ascii=False))
    else:
        if not videos:
            print("Nenhum vídeo encontrado.")
            return
        print(f"Total de vídeos: {len(videos)}\n")
        for video in videos:
            print(f"{video['name']} ({video['size_mb']} MB) - {video['path']}")


def cmd_stats(args):
    monitor = FileMonitor(args.folder)
    stats = monitor.get_folder_stats()
    print(json.dumps(stats, indent=2, ensure_ascii=False))


def cmd_watch(args):
    setup_logging(log_dir=str(logs_dir()), log_level=LoggerConfig.INFO)
    manager = _vm(args.folder, privacy=args.privacy)

    def signal_handler(sig, frame):
        manager.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    manager.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)


def cmd_upload(args):
    setup_logging(log_dir=str(logs_dir()), log_level=LoggerConfig.INFO)
    manager = _vm(args.folder)
    privacy = args.privacy or "unlisted"
    youtube_id, err = manager.upload_video_manually(
        file_path=args.path,
        title=args.title,
        description=args.description,
        tags=args.tags.split(",") if args.tags else None,
        privacy_status=privacy,
    )
    if youtube_id:
        print(f"Upload concluído! YouTube ID: {youtube_id}")
    else:
        print(err or "Erro ao fazer upload do vídeo.")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Kamui CLI (dev)")
    parser.add_argument(
        "--folder",
        type=str,
        default=_default_folder(),
        help="Pasta monitorada (padrão: cwd; ou variável KAMUI_WATCH_FOLDER)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_list = sub.add_parser("list", help="Listar vídeos")
    p_list.add_argument("--recursive", "-r", action="store_true")
    p_list.add_argument("--json", action="store_true")
    p_list.set_defaults(func=cmd_list)

    p_stats = sub.add_parser("stats", help="Estatísticas")
    p_stats.set_defaults(func=cmd_stats)

    p_watch = sub.add_parser("watch", help="Monitorar pasta (sem upload automático)")
    p_watch.add_argument(
        "--privacy",
        choices=["public", "unlisted", "private"],
        default="unlisted",
    )
    p_watch.set_defaults(func=cmd_watch)

    p_up = sub.add_parser("upload", help="Upload manual")
    p_up.add_argument("--path", type=str, required=True)
    p_up.add_argument("--title", type=str)
    p_up.add_argument("--description", type=str)
    p_up.add_argument("--tags", type=str)
    p_up.add_argument(
        "--privacy",
        choices=["public", "unlisted", "private"],
        default="unlisted",
    )
    p_up.set_defaults(func=cmd_upload)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()

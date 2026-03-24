"""Miniatura JPEG a partir de ficheiros de vídeo na pasta monitorada."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import cv2

from . import db
from .file_monitor import VIDEO_EXTENSIONS


def resolve_watch_video_path(file_path: str) -> Optional[Path]:
    wf = (db.get_setting("watch_folder") or "").strip()
    if not wf:
        return None
    wf_p = Path(wf).resolve()
    try:
        p = Path(file_path).resolve()
    except OSError:
        return None
    if not p.is_file():
        return None
    try:
        p.relative_to(wf_p)
    except ValueError:
        return None
    if p.suffix.lower() not in VIDEO_EXTENSIONS:
        return None
    return p


def extract_thumbnail_jpeg(
    video_path: str,
    max_width: int = 400,
    seek_ms: int = 800,
) -> Optional[bytes]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None
    try:
        seek = max(0, int(seek_ms))
        cap.set(cv2.CAP_PROP_POS_MSEC, float(seek))
        ok, frame = cap.read()
        if not ok or frame is None:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            for _ in range(8):
                ok, frame = cap.read()
                if ok and frame is not None:
                    break
        if not ok or frame is None:
            return None
        h, w = frame.shape[:2]
        if w > max_width:
            scale = max_width / float(w)
            frame = cv2.resize(
                frame, (max_width, int(h * scale)), interpolation=cv2.INTER_AREA
            )
        enc_ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        if not enc_ok:
            return None
        return buf.tobytes()
    finally:
        cap.release()

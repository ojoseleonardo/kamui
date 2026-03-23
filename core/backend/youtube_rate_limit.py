"""Limite global de frequência para chamadas HTTP às APIs Google (YouTube Data, Analytics).

Evita rajadas por bugs ou testes repetidos. Não usar no loop resumável de upload
(`next_chunk`), para não atrasar envio de vídeo.
"""

from __future__ import annotations

import threading
import time
from collections import deque

_lock = threading.Lock()
_recent: deque[float] = deque()

# Espaçamento mínimo entre duas requisições consecutivas (todas as threads).
_MIN_INTERVAL_SEC = 0.35
# Teto na janela deslizante (requisições por minuto, aproximado).
_MAX_PER_WINDOW = 90
_WINDOW_SEC = 60.0


def acquire_google_youtube_slot() -> None:
    """Bloqueia até ser seguro disparar uma chamada `.execute()` à API."""
    while True:
        sleep_for = 0.0
        with _lock:
            now = time.monotonic()
            while _recent and now - _recent[0] > _WINDOW_SEC:
                _recent.popleft()
            if len(_recent) >= _MAX_PER_WINDOW:
                sleep_for = _WINDOW_SEC - (now - _recent[0]) + 0.02
            elif _recent and (now - _recent[-1]) < _MIN_INTERVAL_SEC:
                sleep_for = _MIN_INTERVAL_SEC - (now - _recent[-1])
            else:
                _recent.append(time.monotonic())
                return
        if sleep_for > 0:
            time.sleep(sleep_for)

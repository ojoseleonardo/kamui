"""Entrada: `python -u -m backend` (cwd = pasta `core/`)."""

import os
import socket
import sys


def _pick_port(start: int = 17420) -> int:
    env = os.environ.get("KAMUI_PORT", "").strip()
    if env.isdigit():
        return int(env)
    for port in range(start, start + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError("Nenhuma porta livre entre %s e %s" % (start, start + 49))


def main():
    # Garantir que `core/` está no path (cwd esperado pelo Electron)
    core_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if core_dir not in sys.path:
        sys.path.insert(0, core_dir)

    port = _pick_port()
    os.environ["KAMUI_PORT"] = str(port)
    print(f"KAMUI_PORT={port}", flush=True)

    import uvicorn

    uvicorn.run(
        "backend.app:app",
        host="127.0.0.1",
        port=port,
        log_level="info",
        access_log=False,
    )


if __name__ == "__main__":
    main()

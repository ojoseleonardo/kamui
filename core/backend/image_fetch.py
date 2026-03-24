"""Descarregar imagem por URL (HTTPS) com limites básicos anti-SSRF."""

from __future__ import annotations

import ipaddress
import socket
from typing import Tuple
from urllib.parse import urlparse
from urllib.request import Request, urlopen

_MAX_BYTES = 2 * 1024 * 1024
_ALLOWED_CT_PREFIXES = ("image/jpeg", "image/jpg", "image/png")


def _hostname_blocked(host: str) -> bool:
    h = (host or "").strip().lower()
    if not h or h == "localhost":
        return True
    try:
        ip = ipaddress.ip_address(h)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
        )
    except ValueError:
        pass
    try:
        infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
        for fam, _, _, _, sockaddr in infos:
            if fam not in (socket.AF_INET, socket.AF_INET6):
                continue
            addr = sockaddr[0]
            try:
                ip = ipaddress.ip_address(addr)
            except ValueError:
                continue
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_reserved
            ):
                return True
    except OSError:
        return True
    return False


def fetch_image_from_https_url(url: str) -> Tuple[Optional[bytes], str, str]:
    """
    Retorna (bytes, mime, erro). mime vazio se bytes None.
    """
    raw = (url or "").strip()
    if not raw:
        return None, "", "URL vazia."
    parsed = urlparse(raw)
    if parsed.scheme.lower() != "https":
        return None, "", "Só são permitidos URLs HTTPS."
    host = parsed.hostname
    if not host or _hostname_blocked(host):
        return None, "", "Host da URL não permitido."

    req = Request(
        raw,
        headers={"User-Agent": "Kamui/1.0 (YouTube thumbnail)"},
        method="GET",
    )
    try:
        with urlopen(req, timeout=25) as resp:
            ct = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
            if not any(ct.startswith(p) for p in _ALLOWED_CT_PREFIXES):
                return None, "", f"Tipo de conteúdo não suportado: {ct or 'desconhecido'}."
            chunks: list[bytes] = []
            total = 0
            while True:
                block = resp.read(65536)
                if not block:
                    break
                total += len(block)
                if total > _MAX_BYTES:
                    return None, "", "Imagem demasiado grande (máx. 2 MB)."
                chunks.append(block)
    except Exception as e:
        return None, "", str(e)

    data = b"".join(chunks)
    if len(data) < 32:
        return None, "", "Resposta demasiado pequena para ser uma imagem."
    return data, ct, ""

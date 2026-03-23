"""Leituras YouTube Data API v3 (canal, lista de envios)."""

import re
from typing import Any, Dict, List, Optional

from googleapiclient.discovery import Resource


def _iso8601_duration_seconds(iso: str) -> int:
    if not iso or not iso.startswith("PT"):
        return 0
    h = m = s = 0
    for n, u in re.findall(r"(\d+)([HMS])", iso):
        v = int(n)
        if u == "H":
            h = v
        elif u == "M":
            m = v
        elif u == "S":
            s = v
    return h * 3600 + m * 60 + s


def fetch_channel_summary(service: Resource) -> Dict[str, Any]:
    r = service.channels().list(part="snippet,statistics", mine=True, maxResults=1).execute()
    items = r.get("items") or []
    if not items:
        return {"error": "Nenhum canal encontrado para esta conta."}
    ch = items[0]
    sn = ch.get("snippet") or {}
    st = ch.get("statistics") or {}
    thumbs = sn.get("thumbnails") or {}
    default_thumb = (thumbs.get("medium") or thumbs.get("default") or {}).get("url")
    return {
        "channel_id": ch.get("id"),
        "title": sn.get("title"),
        "description": sn.get("description"),
        "thumbnail_url": default_thumb,
        "custom_url": sn.get("customUrl"),
        "subscriber_count": int(st.get("subscriberCount", 0) or 0),
        "view_count": int(st.get("viewCount", 0) or 0),
        "video_count": int(st.get("videoCount", 0) or 0),
        "hidden_subscriber_count": st.get("hiddenSubscriberCount", False),
    }


def fetch_my_uploads_page(
    service: Resource,
    max_results: int = 25,
    page_token: Optional[str] = None,
) -> Dict[str, Any]:
    ch = service.channels().list(part="contentDetails", mine=True, maxResults=1).execute()
    items = ch.get("items") or []
    if not items:
        return {"items": [], "next_page_token": None, "error": "Canal não encontrado."}
    uploads_id = (items[0].get("contentDetails") or {}).get("relatedPlaylists", {}).get(
        "uploads"
    )
    if not uploads_id:
        return {"items": [], "next_page_token": None, "error": "Playlist de uploads indisponível."}

    pl = (
        service.playlistItems()
        .list(
            part="snippet,contentDetails",
            playlistId=uploads_id,
            maxResults=min(max(1, max_results), 50),
            pageToken=page_token or None,
        )
        .execute()
    )

    pl_items = pl.get("items") or []
    video_ids: List[str] = []
    for it in pl_items:
        vid = (it.get("contentDetails") or {}).get("videoId")
        if vid:
            video_ids.append(vid)

    if not video_ids:
        return {"items": [], "next_page_token": pl.get("nextPageToken"), "total_hint": None}

    vresp = (
        service.videos()
        .list(part="snippet,statistics,status,contentDetails", id=",".join(video_ids))
        .execute()
    )
    vmap = {v["id"]: v for v in (vresp.get("items") or [])}

    out: List[Dict[str, Any]] = []
    for it in pl_items:
        vid = (it.get("contentDetails") or {}).get("videoId")
        if not vid or vid not in vmap:
            continue
        v = vmap[vid]
        sn = v.get("snippet") or {}
        st = v.get("statistics") or {}
        stat = v.get("status") or {}
        cd = v.get("contentDetails") or {}
        thumbs = sn.get("thumbnails") or {}
        thumb = (thumbs.get("medium") or thumbs.get("high") or thumbs.get("default") or {}).get(
            "url"
        )
        duration_iso = cd.get("duration") or ""
        out.append(
            {
                "id": vid,
                "youtube_id": vid,
                "title": sn.get("title"),
                "description": sn.get("description") or "",
                "thumbnail": thumb,
                "published_at": sn.get("publishedAt"),
                "views": int(st.get("viewCount", 0) or 0),
                "likes": int(st.get("likeCount", 0) or 0),
                "comments": int(st.get("commentCount", 0) or 0),
                "duration_seconds": _iso8601_duration_seconds(duration_iso),
                "privacy": (stat.get("privacyStatus") or "unknown").lower(),
            }
        )

    return {
        "items": out,
        "next_page_token": pl.get("nextPageToken"),
        "prev_page_token": pl.get("prevPageToken"),
    }

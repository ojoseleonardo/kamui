"""YouTube Analytics API v2 — métricas por intervalo de datas."""

from typing import Any, Dict

from google.auth.credentials import Credentials
from googleapiclient.discovery import build


def fetch_channel_analytics(
    credentials: Credentials,
    start_date: str,
    end_date: str,
) -> Dict[str, Any]:
    """
    start_date / end_date: 'YYYY-MM-DD'.
    Retorna views e minutos estimados no período; em erro, campo error com mensagem.
    """
    try:
        ya = build("youtubeAnalytics", "v2", credentials=credentials)
        resp = (
            ya.reports()
            .query(
                ids="channel==MINE",
                startDate=start_date,
                endDate=end_date,
                metrics="views,estimatedMinutesWatched",
            )
            .execute()
        )
        rows = resp.get("rows") or []
        views = 0
        minutes = 0.0
        if rows and len(rows[0]) >= 2:
            views = int(rows[0][0] or 0)
            minutes = float(rows[0][1] or 0)
        return {
            "start_date": start_date,
            "end_date": end_date,
            "views": views,
            "estimated_minutes_watched": minutes,
            "estimated_hours_watched": round(minutes / 60.0, 2),
            "column_headers": resp.get("columnHeaders"),
        }
    except Exception as e:
        return {
            "error": str(e),
            "start_date": start_date,
            "end_date": end_date,
            "views": 0,
            "estimated_minutes_watched": 0.0,
            "estimated_hours_watched": 0.0,
        }


def fetch_daily_views_series(
    credentials: Credentials,
    start_date: str,
    end_date: str,
) -> Dict[str, Any]:
    """Série diária: day, views (para gráficos)."""
    try:
        ya = build("youtubeAnalytics", "v2", credentials=credentials)
        resp = (
            ya.reports()
            .query(
                ids="channel==MINE",
                startDate=start_date,
                endDate=end_date,
                dimensions="day",
                metrics="views",
                sort="day",
            )
            .execute()
        )
        rows = resp.get("rows") or []
        series = [{"day": r[0], "views": int(r[1] or 0)} for r in rows if len(r) >= 2]
        return {"series": series}
    except Exception as e:
        return {"series": [], "error": str(e)}

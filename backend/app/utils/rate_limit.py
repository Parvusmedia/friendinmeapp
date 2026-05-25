"""Simple in-memory rate limiting per client IP + route key."""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status

from app.config import get_settings

_lock = Lock()
_buckets: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def check_rate_limit(request: Request, *, key: str, limit: int, window_seconds: int) -> None:
    settings = get_settings()
    if not settings.rate_limit_enabled:
        return
    bucket_key = f"{key}:{_client_ip(request)}"
    now = time.monotonic()
    cutoff = now - window_seconds
    with _lock:
        hits = [t for t in _buckets[bucket_key] if t > cutoff]
        if len(hits) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.",
            )
        hits.append(now)
        _buckets[bucket_key] = hits

import time
from collections import defaultdict
from typing import Dict, Tuple

from fastapi import Request, HTTPException, status


class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.rate = requests_per_minute
        self.window = 60  # seconds
        self.clients: Dict[str, list] = defaultdict(list)

    def _clean_old(self, key: str):
        now = time.time()
        self.clients[key] = [t for t in self.clients[key] if now - t < self.window]

    def is_allowed(self, key: str) -> Tuple[bool, int]:
        self._clean_old(key)
        if len(self.clients[key]) >= self.rate:
            return False, self.rate
        self.clients[key].append(time.time())
        return True, self.rate - len(self.clients[key])


rate_limiter = RateLimiter(requests_per_minute=120)


async def rate_limit_middleware(request: Request, call_next):
    # Skip static files and health check
    if request.url.path.startswith("/static") or request.url.path == "/api/health":
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{request.url.path}"

    allowed, remaining = rate_limiter.is_allowed(key)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down.",
            headers={"X-RateLimit-Limit": str(rate_limiter.rate), "Retry-After": "60"},
        )

    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response

"""Gateway policy: route rate-limit tiers and trusted-proxy client IP resolution."""

import ipaddress
from typing import Any, Dict, List, Tuple

from starlette.types import Scope

from app.core.config import Settings

PROD_PUBLIC_RPM = 600
PROD_MUTATION_RPM = 180


def _tier_limits(s: Settings) -> Dict[str, int]:
    """Configured value wins in every env; unset public/mutation limits are relaxed outside production."""
    is_prod = s.is_production
    return {
        "auth_strict": s.RATE_LIMIT_AUTH_RPM,
        "chunk_upload": s.RATE_LIMIT_UPLOAD_RPM,
        "mutation": s.RATE_LIMIT_MUTATION_RPM or (PROD_MUTATION_RPM if is_prod else s.RATE_LIMIT_UPLOAD_RPM),
        "public_read": s.RATE_LIMIT_PUBLIC_RPM or (PROD_PUBLIC_RPM if is_prod else s.RATE_LIMIT_UPLOAD_RPM),
    }


def _resolve_rate_tier(method: str, path: str, s: Settings) -> Tuple[int, str]:
    if path.startswith(("/v1/auth/login", "/v1/auth/register", "/v1/auth/forgot-password")):
        tier = "auth_strict"
    elif path.startswith(("/v1/media/upload/chunk", "/uploads")) or path == "/health":
        tier = "chunk_upload"
    elif method in ("POST", "PUT", "PATCH", "DELETE"):
        tier = "mutation"
    else:
        tier = "public_read"
    return max(1, _tier_limits(s)[tier]), tier


def _is_trusted(ip: str, trusted: List[Any]) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(addr in net for net in trusted)


def resolve_client_ip(scope: Scope, trusted: List[Any]) -> str:
    """ASGI peer, unless the peer is a trusted proxy: then the right-most untrusted X-Forwarded-For hop."""
    peer = scope["client"][0] if scope.get("client") else "127.0.0.1"
    if not trusted or not _is_trusted(peer, trusted):
        return peer
    xff = ",".join(v.decode("latin1") for k, v in scope.get("headers") or [] if k == b"x-forwarded-for")
    hops = [h.strip() for h in xff.split(",") if h.strip()]
    for hop in reversed(hops):
        if not _is_trusted(hop, trusted):
            return hop
    return hops[0] if hops else peer

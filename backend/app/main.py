import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.logging_setup import configure_logging, request_id_var

settings = get_settings()
settings.trusted_proxies  # fail fast on a malformed TRUSTED_PROXY_IPS
configure_logging(settings.LOG_LEVEL, settings.LOG_FORMAT)
logger = logging.getLogger("belooga")

from app.core.cache import platform_cache
from app.core.database import get_db
from app.core.events import event_stream, router as events_router
from app.core.gateway import APIGatewayMiddleware, router as gateway_router
from app.core.rpc import router as rpc_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.profile import router as profile_router
from app.api.v1.endpoints.timeline import router as timeline_router
from app.api.v1.endpoints.search import router as search_router
from app.api.v1.endpoints.catalogs import router as catalogs_router
from app.api.v1.endpoints.cms import router as cms_router
from app.api.v1.endpoints.media import router as media_router
from app.api.v1.endpoints.expert_review import router as expert_review_router
from app.api.v1.endpoints.ats_matching import router as ats_matching_router
from app.api.v1.endpoints.job_tracker import router as job_tracker_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.payments import router as payments_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.bookmarks import router as bookmarks_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await event_stream.drain_all()

def docs_kwargs(s: Settings) -> dict:
    """/docs, /redoc, /openapi.json are off in production unless ENABLE_API_DOCS=1."""
    if s.docs_enabled:
        return {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}
    return {"docs_url": None, "redoc_url": None, "openapi_url": None}


app = FastAPI(
    title="Belooga Modern API Engine",
    description="High-performance async modular monolith powering the Next.js recruitment platform.",
    version="1.0.0",
    lifespan=lifespan,
    **docs_kwargs(settings),
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last-resort 500: log the traceback with the request id, never leak internals to the client."""
    request_id = request_id_var.get()
    logger.error(
        "Unhandled exception on %s %s", request.method, request.url.path,
        exc_info=exc, extra={"request_id": request_id},
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "request_id": request_id},
        headers={"x-request-id": request_id},
    )


# API Gateway & Compression Middlewares
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(APIGatewayMiddleware)

# CORS Configuration
def get_cors_origins() -> list[str]:
    return Settings().cors_origins  # fresh read of env on purpose (tests patch CORS_ORIGINS)


from app.services.media_transcoder import AVATARS_DIR, VIDEOS_DIR

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only public media is served statically. Resumes (owner-only download endpoint) and raw upload
# chunks live under the same UPLOAD_DIR but are never mounted.
app.mount("/uploads/avatars", StaticFiles(directory=AVATARS_DIR), name="uploads-avatars")
app.mount("/uploads/videos", StaticFiles(directory=VIDEOS_DIR), name="uploads-videos")

# Domain Routers Mounting
app.include_router(auth_router, prefix="/v1")
app.include_router(profile_router, prefix="/v1")
app.include_router(timeline_router, prefix="/v1")
app.include_router(search_router, prefix="/v1")
app.include_router(catalogs_router, prefix="/v1")
app.include_router(cms_router, prefix="/v1")
app.include_router(media_router, prefix="/v1")
app.include_router(expert_review_router, prefix="/v1")
app.include_router(ats_matching_router, prefix="/v1")
app.include_router(job_tracker_router, prefix="/v1")
app.include_router(analytics_router, prefix="/v1")
app.include_router(payments_router, prefix="/v1")
app.include_router(notifications_router, prefix="/v1")
app.include_router(bookmarks_router, prefix="/v1")
app.include_router(gateway_router, prefix="/v1")
app.include_router(rpc_router, prefix="/v1")
app.include_router(events_router, prefix="/v1")

@app.get("/health", tags=["Health Probe"])
async def health_check():
    return {
        "status": "healthy",
        "service": "belooga-backend",
        "version": "1.0.0"
    }

@app.get("/health/live", tags=["Health Probe"])
async def k8s_liveness_probe():
    """Kubernetes Liveness Probe: Zero-DB event-loop responsiveness check."""
    return {
        "status": "alive",
        "probe": "liveness",
        "service": "belooga-backend",
    }

@app.get("/health/ready", tags=["Health Probe"])
async def k8s_readiness_probe(db: AsyncSession = Depends(get_db)):
    """Kubernetes Readiness Probe.

    PostgreSQL is required: down -> 503. Redis is optional (cache and gateway fall back to per-pod
    state), so a Redis failure reports "degraded" but stays ready (200).
    """
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning("Readiness: PostgreSQL check failed: %s", type(exc).__name__)
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "probe": "readiness", "checks": {"postgres": "error"}},
        )
    redis_status = "disabled"
    r_client = await platform_cache._get_redis()
    if r_client is not None:
        try:
            await asyncio.wait_for(r_client.ping(), timeout=0.5)
            redis_status = "ok"
        except Exception as exc:
            logger.warning("Readiness: Redis ping failed (degraded, still ready): %s", type(exc).__name__)
            redis_status = "degraded"
    cache_stats = platform_cache.get_stats()
    evt_stats = event_stream.get_status()
    return {
        "status": "ready",
        "probe": "readiness",
        "checks": {
            "postgres": "ok",
            "redis": redis_status,
            "cache": "ok",
            "event_stream": "ok",
        },
        "cache_l1_entries": cache_stats["l1_entries"],
        "event_stream_lag": evt_stats["total_lag"],
    }

@app.get("/v1", tags=["Root"])
async def api_root():
    return {
        "message": "Welcome to Belooga Modern API v1",
        "documentation": "/docs",
        "domains": [
            "Domain 1: Identity & Authentication",
            "Domain 2: Candidate Profile",
            "Domain 3: Timeline CRUD & Reordering",
            "Domain 4: Media & Video Uploads",
            "Domain 5: Video Studio (WebRTC)",
            "Domain 6: Talent Discovery & Trigram Search",
            "Domain 7: Master Catalogs",
            "Domain 8: Public CMS & Moderation"
        ]
    }

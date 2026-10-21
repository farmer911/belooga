import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await event_stream.drain_all()

app = FastAPI(
    title="Belooga Modern API Engine",
    description="High-performance async modular monolith powering the Next.js recruitment platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# API Gateway & Compression Middlewares
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(APIGatewayMiddleware)

# CORS Configuration
def get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


from app.services.media_transcoder import UPLOAD_BASE

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for sub in ["avatars", "resumes", "videos", "chunks"]:
    os.makedirs(os.path.join(UPLOAD_BASE, sub), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_BASE), name="uploads")

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
    """Kubernetes Readiness Probe: Verifies PostgreSQL, Tiered Cache, and Partitioned Event Stream."""
    await db.execute(text("SELECT 1"))
    cache_stats = platform_cache.get_stats()
    evt_stats = event_stream.get_status()
    return {
        "status": "ready",
        "probe": "readiness",
        "checks": {
            "postgres": "ok",
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

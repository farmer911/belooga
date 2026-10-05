from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="Belooga Modern API Engine",
    description="High-performance async modular monolith powering the Next.js recruitment platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os
from app.api.v1.endpoints.media import UPLOAD_BASE

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

@app.get("/health", tags=["Health Probe"])
async def health_check():
    return {
        "status": "healthy",
        "service": "belooga-backend",
        "version": "1.0.0"
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

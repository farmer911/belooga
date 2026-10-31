"""Central typed settings (pydantic-settings), read from environment variables.

`get_settings()` is cached; env is read on first call (tests set env vars before importing the app).
Tests that need different values either `monkeypatch.setattr(get_settings(), "FIELD", value)` for
values read per request (rate limits, trusted proxies, upload caps), or build a fresh `Settings(...)`.
"""

import ipaddress
from functools import lru_cache
from typing import List, Optional, Union

from pydantic_settings import BaseSettings, SettingsConfigDict

MB = 1024 * 1024
IPNetwork = Union[ipaddress.IPv4Network, ipaddress.IPv6Network]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, extra="ignore")

    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+asyncpg://belooga:belooga_secret_password@postgres:5432/belooga_db"
    DATABASE_READ_URL: Optional[str] = None
    REDIS_URL: str = "redis://localhost:6379/0"
    GATEWAY_REDIS_ENABLED: bool = False  # only consulted when ENVIRONMENT == "testing"

    # Auth (JWT_SECRET is enforced in production by app.core.security at import)
    JWT_SECRET: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ENABLE_API_DOCS: bool = False  # docs are always on outside production
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # "json" or "text"

    # DB pool: per pod. 10 + 10 x HPA max 10 pods = 200 connections worst case.
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Uploads
    UPLOAD_DIR: Optional[str] = None
    UPLOAD_MAX_AVATAR_BYTES: int = 5 * MB
    UPLOAD_MAX_RESUME_BYTES: int = 10 * MB
    UPLOAD_MAX_CHUNK_BYTES: int = 10 * MB
    UPLOAD_MAX_VIDEO_BYTES: int = 200 * MB
    MAX_JSON_BODY_BYTES: int = 10 * MB

    # Gateway rate limits (requests/minute per client IP and tier).
    # Public/mutation unset -> 600/180 in production, relaxed to the upload tier elsewhere.
    # Auth limits apply in every environment.
    RATE_LIMIT_AUTH_RPM: int = 30
    RATE_LIMIT_MUTATION_RPM: Optional[int] = None
    RATE_LIMIT_PUBLIC_RPM: Optional[int] = None
    RATE_LIMIT_UPLOAD_RPM: int = 2400
    # Comma-separated IPs/CIDRs of reverse proxies allowed to set X-Forwarded-For. Empty = trust none.
    TRUSTED_PROXY_IPS: str = ""

    # Integrations (consumed by other modules; migrate their os.getenv calls here)
    PUBLIC_API_URL: str = "http://localhost:8080"
    FRONTEND_URL: str = "http://localhost:3000"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    MOMO_SECRET_KEY: Optional[str] = None
    MOMO_PARTNER_CODE: str = ""
    MOMO_ACCESS_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@belooga.com"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod", "staging")

    @property
    def docs_enabled(self) -> bool:
        return self.ENABLE_API_DOCS or self.ENVIRONMENT.lower() not in ("production", "prod")

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def trusted_proxies(self) -> List[IPNetwork]:
        return [ipaddress.ip_network(p.strip(), strict=False) for p in self.TRUSTED_PROXY_IPS.split(",") if p.strip()]

    @property
    def public_api_url(self) -> str:
        return self.PUBLIC_API_URL.rstrip("/")

    @property
    def read_database_url(self) -> str:
        return (self.DATABASE_READ_URL or self.DATABASE_URL).strip()


@lru_cache
def get_settings() -> Settings:
    return Settings()

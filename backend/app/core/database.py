from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import get_settings

_settings = get_settings()
DATABASE_URL = _settings.DATABASE_URL

# Per-pod pool; keep pool_size + max_overflow x max replicas below Postgres max_connections.
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_size=_settings.DB_POOL_SIZE,
    max_overflow=_settings.DB_MAX_OVERFLOW,
    pool_timeout=_settings.DB_POOL_TIMEOUT,
    pool_pre_ping=True,
    pool_recycle=_settings.DB_POOL_RECYCLE,
)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

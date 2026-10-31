from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import get_settings

_settings = get_settings()
DATABASE_URL = _settings.DATABASE_URL
DATABASE_READ_URL = _settings.read_database_url

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

read_engine = (
    engine
    if DATABASE_READ_URL == DATABASE_URL
    else create_async_engine(
        DATABASE_READ_URL,
        echo=False,
        future=True,
        pool_size=_settings.DB_POOL_SIZE,
        max_overflow=_settings.DB_MAX_OVERFLOW,
        pool_timeout=_settings.DB_POOL_TIMEOUT,
        pool_pre_ping=True,
        pool_recycle=_settings.DB_POOL_RECYCLE,
    )
)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
read_session_maker = (
    async_session_maker
    if read_engine is engine
    else async_sessionmaker(read_engine, class_=AsyncSession, expire_on_commit=False)
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


async def get_read_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a read-replica session when DATABASE_READ_URL is configured; otherwise use primary pool."""
    async with read_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

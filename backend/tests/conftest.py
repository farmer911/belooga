import os
import sys
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Use the isolated PostgreSQL test database on port 5433
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://belooga:belooga_secret_password@localhost:5433/belooga_test"
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["ENVIRONMENT"] = "testing"
os.environ["JWT_SECRET"] = "test_jwt_secret_key_safe_for_testing_12345"

from sqlalchemy.pool import NullPool
from app.main import app
from app.core.database import get_db
from app.core.security import create_access_token, hash_token, generate_refresh_token


test_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool, echo=False)
test_session_maker = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with test_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def ensure_test_database_seeded():
    """Hermetic test fixture: ensures test database has required seed data."""
    import importlib.util
    from pathlib import Path

    seed_script = Path(__file__).resolve().parent.parent.parent / "scripts" / "seed-data.py"
    if seed_script.exists():
        spec = importlib.util.spec_from_file_location("seed_data_script", str(seed_script))
        seed_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(seed_mod)
        await seed_mod.seed(TEST_DATABASE_URL)



@pytest_asyncio.fixture
async def db_session():
    async with test_session_maker() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_candidate_a(db_session: AsyncSession):
    """Creates test user A with an active profile."""
    uid = uuid.uuid4()
    pid = uuid.uuid4()
    username = f"user_a_{uuid.uuid4().hex[:6]}"
    email = f"{username}@test.com"

    await db_session.execute(
        text("INSERT INTO identities (id, email, password_hash, role, status) VALUES (:id, :email, 'hash', 'candidate', 'active')"),
        {"id": uid, "email": email}
    )
    await db_session.execute(
        text("INSERT INTO candidate_profiles (id, identity_id, username, first_name, last_name) VALUES (:id, :iid, :u, 'Alice', 'Tester')"),
        {"id": pid, "iid": uid, "u": username}
    )
    await db_session.commit()

    token = create_access_token({"sub": str(uid), "username": username, "email": email, "role": "candidate"})
    return {"id": uid, "profile_id": pid, "username": username, "email": email, "token": token}


@pytest_asyncio.fixture
async def test_candidate_b(db_session: AsyncSession):
    """Creates test user B with an active profile."""
    uid = uuid.uuid4()
    pid = uuid.uuid4()
    username = f"user_b_{uuid.uuid4().hex[:6]}"
    email = f"{username}@test.com"

    await db_session.execute(
        text("INSERT INTO identities (id, email, password_hash, role, status) VALUES (:id, :email, 'hash', 'candidate', 'active')"),
        {"id": uid, "email": email}
    )
    await db_session.execute(
        text("INSERT INTO candidate_profiles (id, identity_id, username, first_name, last_name) VALUES (:id, :iid, :u, 'Bob', 'Tester')"),
        {"id": pid, "iid": uid, "u": username}
    )
    await db_session.commit()

    token = create_access_token({"sub": str(uid), "username": username, "email": email, "role": "candidate"})
    return {"id": uid, "profile_id": pid, "username": username, "email": email, "token": token}

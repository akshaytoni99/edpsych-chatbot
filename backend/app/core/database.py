"""
Database Connection and Session Management
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from app.core.config import settings

# Build async URL
db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Handle Neon's sslmode parameter
connect_args = {}
if "sslmode=" in db_url:
    db_url = db_url.split("?")[0]  # Remove query params
    connect_args["ssl"] = "require"
elif "neon.tech" in db_url:
    connect_args["ssl"] = "require"

# Create async engine
engine = create_async_engine(
    db_url,
    echo=settings.DEBUG_MODE,
    future=True,
    pool_size=5,
    max_overflow=2,
    connect_args=connect_args,
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for models
Base = declarative_base()


# Dependency for getting database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

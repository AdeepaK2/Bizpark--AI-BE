from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings


def _to_async_url(url: str) -> str:
    """Convert postgresql:// to postgresql+asyncpg:// and fix sslmode for asyncpg."""
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # asyncpg uses 'ssl' param not 'sslmode'
    url = url.replace("?sslmode=require", "?ssl=require")
    url = url.replace("&sslmode=require", "&ssl=require")
    return url


engine = create_async_engine(
    _to_async_url(settings.runner_database_url),
    echo=False,
    pool_size=5,
    max_overflow=10,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session

from pathlib import Path

from pydantic_settings import BaseSettings

CORE_ENV = Path(__file__).resolve().parent.parent.parent / "Bizpark.Core" / ".env"


class Settings(BaseSettings):
    runner_database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/bizpark"
    runner_db_schema: str = "runner"
    redis_host: str = "localhost"
    redis_port: int = 6379
    port: int = 3001

    model_config = {"env_file": str(CORE_ENV), "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()

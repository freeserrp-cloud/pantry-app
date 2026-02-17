from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./pantry.db"
    household_id: str = "00000000-0000-0000-0000-000000000001"
    cors_origins: list[str] = ["http://localhost:4200"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

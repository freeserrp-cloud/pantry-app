from functools import lru_cache
import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./pantry.db"
    household_id: str = "00000000-0000-0000-0000-000000000001"
    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if value is None or value == "":
            return ["*"]
        if isinstance(value, str):
            text = value.strip()
            if text == "*":
                return ["*"]
            if text.startswith("["):
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    return ["*"]
            return [origin.strip() for origin in text.split(",") if origin.strip()]
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

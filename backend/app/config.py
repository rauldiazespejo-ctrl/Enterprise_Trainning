from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://admin:password@localhost:5432/training_system"
    DEEPSEEK_API_KEY: Optional[str] = None
    TEMPORAL_HOST: str = "localhost:7233"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

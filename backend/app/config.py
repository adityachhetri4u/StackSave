from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = "https://your-project-id.supabase.co"
    supabase_key: str = "your-supabase-anon-key"
    supabase_jwt_secret: str = "your-supabase-jwt-secret"

    # Database
    database_url: str = "postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres"

    # App
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173"

    model_config = {
        "env_file": ".env", 
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()

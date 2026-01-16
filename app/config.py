from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./bareq_alyusr.db"
    
    # JWT Settings
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Application Settings
    APP_NAME: str = "Bareq Al-Yusr"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    
    # Transaction Settings
    TRANSACTION_FEE_PERCENTAGE: float = 0.5
    
    # Flask Admin
    FLASK_SECRET_KEY: str = "flask-admin-secret-key"
    FLASK_PORT: int = 5000
    
    # FastAPI
    FASTAPI_PORT: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

"""
Application configuration using pydantic-settings for environment management
"""
from typing import Annotated, Any, List, Optional

from pydantic import AliasChoices, BeforeValidator, Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_database_url(v: Any) -> Any:
    if isinstance(v, str) and v.startswith("postgres://"):
        return v.replace("postgres://", "postgresql://", 1)
    return v


def _split_cors_string(s: str) -> List[str]:
    parts = [x.strip() for x in s.split(",") if x.strip()]
    return parts if parts else ["http://localhost:5173", "http://localhost:3000"]


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "Salon Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, description="Enable debug mode")

    DATABASE_URL: Annotated[str, BeforeValidator(_normalize_database_url)] = Field(
        default="sqlite:///./salon.db",
        description="Database connection URL (PostgreSQL or SQLite)",
    )
    
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production-min-32-chars-required",
        description="Secret key for JWT encoding"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for caching and celery"
    )
    
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/1",
        description="Celery broker URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/2",
        description="Celery result backend URL"
    )
    
    RAZORPAY_KEY_ID: Optional[str] = Field(
        default=None,
        description="Razorpay API Key ID"
    )
    RAZORPAY_KEY_SECRET: Optional[str] = Field(
        default=None,
        description="Razorpay API Key Secret"
    )
    
    GEOCODING_API_KEY: Optional[str] = Field(
        default=None,
        description="Google Geocoding API Key"
    )
    
    FIREBASE_CREDENTIALS_PATH: Optional[str] = Field(
        default=None,
        description="Path to Firebase credentials JSON file"
    )

    CLOUDINARY_URL: Optional[str] = Field(
        default=None,
        description="cloudinary:// API URL for image CDN (optional; uses local /uploads if unset)",
    )

    API_PUBLIC_URL: str = Field(
        default="http://localhost:8000",
        description="Public base URL of this API (used for local disk image URLs)",
    )

    cors_origins_raw: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        validation_alias=AliasChoices("CORS_ORIGINS", "ALLOWED_ORIGINS"),
        description="Comma-separated origins (e.g. https://app.vercel.app,http://localhost:5173)",
    )

    @computed_field
    @property
    def cors_origins(self) -> List[str]:
        return _split_cors_string(self.cors_origins_raw)
    
    SMTP_HOST: Optional[str] = Field(default=None, description="SMTP server host")
    SMTP_PORT: Optional[int] = Field(default=587, description="SMTP server port")
    SMTP_USER: Optional[str] = Field(default=None, description="SMTP username")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP password")
    EMAIL_FROM: Optional[str] = Field(default=None, description="Email sender address")
    
    MAX_UPLOAD_SIZE: int = Field(default=5 * 1024 * 1024, description="Max file upload size in bytes (5MB)")
    
    POINTS_PER_RUPEE: float = Field(default=0.1, description="Points earned per rupee spent")
    POINTS_FOR_FREE_SERVICE: int = Field(default=100, description="Points required for free service")


settings = Settings()


def get_database_url() -> str:
    """Get database URL for SQLAlchemy"""
    return settings.DATABASE_URL


def is_production() -> bool:
    """Check if running in production mode"""
    return not settings.DEBUG and not settings.DATABASE_URL.startswith("sqlite")


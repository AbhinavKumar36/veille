"""
VEILLE v4.0 — Centralised Configuration
All settings are loaded from environment variables (or .env file).
Never hardcode credentials anywhere else in the codebase — import from here.

Usage:
    from core.config import settings
    print(settings.DATABASE_URL)
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator


class Settings(BaseSettings):
    """
    All configuration values for the VEILLE backend.
    Values are read from environment variables or a .env file in the project root.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",   # Silently ignore unrecognised env vars
    )

    # ── Application ────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    DEMO_MODE: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ── PostgreSQL ─────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://veille:veille_password@localhost:5432/veille_db"

    # ── Neo4j ──────────────────────────────────────────────────────────────
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "veille_graph"

    # ── Redis ──────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── MinIO / S3 ─────────────────────────────────────────────────────────
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadminpassword"
    MINIO_BUCKET_NAME: str = "veille-evidence"

    # ── Kafka ──────────────────────────────────────────────────────────────
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_CDR_TOPIC: str = "veille_cdr_stream"
    KAFKA_GROUP_ID: str = "veille-consumers"

    # ── Gemini AI ──────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # ── JWT Authentication ─────────────────────────────────────────────────
    JWT_SECRET: str = "CHANGE_ME_USE_A_LONG_RANDOM_STRING_AT_LEAST_64_CHARS"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Admin Bootstrap ────────────────────────────────────────────────────
    ADMIN_EMAIL: str = "admin@veille.gov.in"
    ADMIN_PASSWORD: str = "admin123"

    # ── OpenTelemetry (optional, Phase 4) ─────────────────────────────────
    OTEL_EXPORTER_OTLP_ENDPOINT: str = ""
    OTEL_SERVICE_NAME: str = "veille-backend"

    @model_validator(mode='after')
    def validate_security_settings(self) -> 'Settings':
        if self.APP_ENV == "production":
            if self.JWT_SECRET == "CHANGE_ME_USE_A_LONG_RANDOM_STRING_AT_LEAST_64_CHARS":
                raise ValueError("JWT_SECRET must be explicitly set in production environments.")
            if self.ADMIN_PASSWORD == "admin123" or len(self.ADMIN_PASSWORD) < 8:
                raise ValueError("ADMIN_PASSWORD must be changed from default and at least 8 characters in production.")
        return self


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached singleton Settings instance.
    Use this everywhere instead of importing Settings directly.
    """
    return Settings()


# Module-level singleton — import this throughout the codebase
settings = get_settings()

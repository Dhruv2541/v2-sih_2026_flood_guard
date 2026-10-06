from typing import Literal, Union
import json
import logging
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("flood_guard.config")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Assam Flood Guard"
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/api/v1"
    DATABASE_URL: str = ""
    DATABASE_URL_TEST: str = ""
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_TIMEOUT_SECONDS: float = 10.0
    SCHEDULER_ENABLED: bool = False
    INGESTION_INTERVAL_MINUTES: int = 60
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    PREDICTION_MODE: Literal["baseline", "ml"] = "baseline"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list[str]]) -> list[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    parsed = json.loads(v_trimmed)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed]
                except Exception:
                    pass
            return [item.strip() for item in v.split(",") if item.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v]
        return []

    @field_validator("INGESTION_INTERVAL_MINUTES")
    @classmethod
    def validate_ingestion_interval(cls, v: int) -> int:
        """Validates ingestion interval.
        Configured default is 60 minutes. Adjusting the interval is an operational
        configuration decision subject to provider rate limits. Zero or negative values
        are strictly prohibited.
        """
        if v <= 0:
            raise ValueError("INGESTION_INTERVAL_MINUTES must be a positive integer greater than 0.")
        return v

    @field_validator("PREDICTION_MODE")
    @classmethod
    def validate_prediction_mode(cls, v: str) -> str:
        """Validates prediction mode.
        Only 'baseline' and 'ml' are accepted.
        """
        if v not in ("baseline", "ml"):
            raise ValueError("PREDICTION_MODE must be 'baseline' or 'ml'.")
        return v

    @model_validator(mode="after")
    def validate_cors_for_production(self) -> "Settings":
        """Validate CORS configuration for production environment.
        
        In production, CORS_ORIGINS must not contain only localhost/127.0.0.1 origins.
        This prevents accidental deployment with development-only CORS settings.
        """
        if self.ENVIRONMENT == "production":
            localhost_patterns = (
                "localhost",
                "127.0.0.1",
                "0.0.0.0",
                "[::1]",
            )
            
            # Check if ALL origins are localhost patterns
            non_localhost_origins = [
                origin for origin in self.CORS_ORIGINS
                if not any(pattern in origin for pattern in localhost_patterns)
            ]
            
            if not non_localhost_origins and self.CORS_ORIGINS:
                logger.warning(
                    "PRODUCTION MISCONFIGURATION DETECTED: "
                    "ENVIRONMENT=production but CORS_ORIGINS contains only localhost origins. "
                    "The deployed frontend will be blocked by CORS. "
                    "Set CORS_ORIGINS to include your production frontend URL (e.g., https://your-app.vercel.app)."
                )
            elif not self.CORS_ORIGINS:
                logger.warning(
                    "PRODUCTION MISCONFIGURATION DETECTED: "
                    "ENVIRONMENT=production but CORS_ORIGINS is empty. "
                    "All cross-origin requests will be blocked. "
                    "Set CORS_ORIGINS to include your production frontend URL."
                )
        return self


settings = Settings()

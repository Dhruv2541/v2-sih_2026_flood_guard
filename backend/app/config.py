from typing import Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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


settings = Settings()

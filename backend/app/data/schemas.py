from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class NormalizedObservation(BaseModel):
    """Provider-independent normalized representation of an environmental observation.
    
    Adheres strictly to the authoritative data contract:
    - Core rainfall inputs: rainfall_1h_mm, rainfall_3h_mm, rainfall_6h_mm, rainfall_24h_mm
    - Optional environmental inputs: temperature_c, humidity_pct, water_level_m
    - Timestamps: timezone-aware UTC
    - Completely free of provider-specific field names
    """

    model_config = ConfigDict(
        extra="forbid",
        arbitrary_types_allowed=False,
    )

    region_id: str
    recorded_at: datetime
    rainfall_1h_mm: Decimal
    rainfall_3h_mm: Decimal
    rainfall_6h_mm: Decimal
    rainfall_24h_mm: Decimal
    water_level_m: Optional[Decimal] = None
    temperature_c: Optional[Decimal] = None
    humidity_pct: Optional[Decimal] = None
    data_source: str

    @field_validator("region_id", "data_source")
    @classmethod
    def validate_non_empty_strings(cls, v: str, info) -> str:
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} must be a non-empty string.")
        return v.strip()

    @field_validator("recorded_at")
    @classmethod
    def validate_timezone_aware_utc(cls, v: datetime) -> datetime:
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("recorded_at must be a timezone-aware UTC datetime, not naive.")
        # Normalize to UTC
        return v.astimezone(timezone.utc)

    @field_validator(
        "rainfall_1h_mm",
        "rainfall_3h_mm",
        "rainfall_6h_mm",
        "rainfall_24h_mm",
    )
    @classmethod
    def validate_rainfall_non_negative(cls, v: Decimal, info) -> Decimal:
        if v < Decimal("0"):
            raise ValueError(f"{info.field_name} cannot be negative: {v}")
        return v

    @field_validator("humidity_pct")
    @classmethod
    def validate_humidity_range(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None:
            if v < Decimal("0.0") or v > Decimal("100.0"):
                raise ValueError(f"humidity_pct must be between 0.0 and 100.0, got: {v}")
        return v

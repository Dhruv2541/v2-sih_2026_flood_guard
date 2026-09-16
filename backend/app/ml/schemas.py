from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class MLPredictionInput(BaseModel):
    """Provider- and model-independent input features supplied to the flood prediction model.
    
    Adheres strictly to the authoritative ML inference contract:
    - Canonical identifier: region_id (non-empty string)
    - Reference timestamp: timezone-aware UTC
    - Core rainfall features: 1h, 3h, 6h, 24h accumulations (mandatory, non-negative Decimal)
    - Hydrological features: river gauge height water_level_m (optional, nullable)
    - Environmental/topographical features: elevation_m, temperature_c, humidity_pct (optional, nullable)
    - Missing data policy: optional fields remain explicitly None when unavailable; never fabricated.
    - extra="forbid" strictly rejects unapproved features.
    """

    model_config = ConfigDict(
        extra="forbid",
        arbitrary_types_allowed=False,
    )

    region_id: str
    reference_time: datetime
    rainfall_1h_mm: Decimal
    rainfall_3h_mm: Decimal
    rainfall_6h_mm: Decimal
    rainfall_24h_mm: Decimal
    water_level_m: Optional[Decimal] = None
    elevation_m: Optional[Decimal] = None
    temperature_c: Optional[Decimal] = None
    humidity_pct: Optional[Decimal] = None

    @field_validator("region_id")
    @classmethod
    def validate_region_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("region_id must be a non-empty string.")
        return v.strip()

    @field_validator("reference_time")
    @classmethod
    def validate_reference_time(cls, v: datetime) -> datetime:
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("reference_time must be a timezone-aware UTC datetime, not naive.")
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
    def validate_humidity_bounds(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None:
            if v < Decimal("0.0") or v > Decimal("100.0"):
                raise ValueError(f"humidity_pct must be between 0.0 and 100.0, got: {v}")
        return v


class MLPredictionOutput(BaseModel):
    """Model-independent prediction result produced by the flood prediction model.
    
    Adheres strictly to the Phase 4A ML output contract:
    - Canonical identifier: region_id (non-empty string)
    - Run timestamp: generated_at (timezone-aware UTC)
    - Validity window: forecast_valid_until (timezone-aware UTC, must be >= generated_at)
    - Flood probability: strictly bounded 0.0 <= flood_probability <= 1.0
    - Model version: mandatory non-empty string identifier
    - extra="forbid" strictly rejects unapproved fields (risk_level, fallback flags, etc.)
    """

    model_config = ConfigDict(
        extra="forbid",
        arbitrary_types_allowed=False,
    )

    region_id: str
    generated_at: datetime
    forecast_valid_until: datetime
    flood_probability: Decimal
    model_version: str

    @field_validator("region_id")
    @classmethod
    def validate_region_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("region_id must be a non-empty string.")
        return v.strip()

    @field_validator("model_version")
    @classmethod
    def validate_model_version(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("model_version must be a non-empty string.")
        return v.strip()

    @field_validator("generated_at", "forecast_valid_until")
    @classmethod
    def validate_timestamps(cls, v: datetime, info) -> datetime:
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError(f"{info.field_name} must be a timezone-aware UTC datetime, not naive.")
        return v.astimezone(timezone.utc)

    @field_validator("flood_probability")
    @classmethod
    def validate_flood_probability(cls, v: Decimal) -> Decimal:
        if v < Decimal("0.0") or v > Decimal("1.0"):
            raise ValueError(f"flood_probability must be between 0.0 and 1.0, got: {v}")
        return v

    @model_validator(mode="after")
    def validate_forecast_horizon(self) -> "MLPredictionOutput":
        if self.forecast_valid_until < self.generated_at:
            raise ValueError(
                f"forecast_valid_until ({self.forecast_valid_until}) cannot be earlier than "
                f"generated_at ({self.generated_at})."
            )
        return self

"""API response schemas for flood prediction endpoints."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator


class PredictionResponse(BaseModel):
    """API response for a single-region flood prediction.

    Contains the ML model output plus backend-classified risk level.
    """

    model_config = ConfigDict(
        extra="forbid",
        arbitrary_types_allowed=False,
    )

    region_id: str
    generated_at: datetime
    forecast_valid_until: datetime
    flood_probability: Decimal
    risk_level: str
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
        return v.astimezone(info.data.get("timezone", None) if hasattr(info, "data") else None) or v  # Simplified

    @field_validator("flood_probability")
    @classmethod
    def validate_flood_probability(cls, v: Decimal) -> Decimal:
        if v < Decimal("0.0") or v > Decimal("1.0"):
            raise ValueError(f"flood_probability must be between 0.0 and 1.0, got: {v}")
        return v

    @field_validator("risk_level")
    @classmethod
    def validate_risk_level(cls, v: str) -> str:
        valid_levels = {"LOW", "MODERATE", "HIGH", "CRITICAL"}
        if v not in valid_levels:
            raise ValueError(f"risk_level must be one of {valid_levels}, got: {v}")
        return v


class FailedRegionPrediction(BaseModel):
    """Summary of a failed region prediction in a batch operation."""

    model_config = ConfigDict(extra="forbid")

    region_id: str
    error_type: str
    message: str


class RegionWidePredictionResponse(BaseModel):
    """API response for region-wide flood predictions.

    Contains successful predictions and explicit unavailable reasons for regions
    that could not be processed.
    """

    model_config = ConfigDict(extra="forbid")

    generated_at: datetime
    total_regions: int
    predictions_available: int
    predictions_unavailable: int
    predictions: List[PredictionResponse]
    unavailable_regions: List[FailedRegionPrediction]

    @field_validator("generated_at")
    @classmethod
    def validate_generated_at(cls, v: datetime) -> datetime:
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("generated_at must be a timezone-aware UTC datetime, not naive.")
        return v.astimezone(timezone.utc)
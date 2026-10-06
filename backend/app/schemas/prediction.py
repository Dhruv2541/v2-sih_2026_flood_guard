"""API response schemas for flood prediction endpoints."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, field_validator


class RegionResponse(BaseModel):
    """API response for a single region in the canonical region list."""

    model_config = ConfigDict(extra="forbid")

    region_id: str
    name: str
    district: str
    latitude: float
    longitude: float
    elevation_m: Optional[Decimal] = None

    @field_validator("region_id", "name", "district")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("must be a non-empty string.")
        return v.strip()

    @field_validator("elevation_m")
    @classmethod
    def validate_elevation(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < Decimal("0"):
            raise ValueError("elevation_m cannot be negative.")
        return v


class RegionListResponse(BaseModel):
    """API response for the canonical region list."""

    model_config = ConfigDict(extra="forbid")

    regions: List["RegionResponse"]
    total_regions: int

    @field_validator("total_regions")
    @classmethod
    def validate_total_regions(cls, v: int) -> int:
        if v < 0:
            raise ValueError("total_regions cannot be negative.")
        return v


class ObservationResponse(BaseModel):
    """API response for a single environmental observation."""

    model_config = ConfigDict(extra="forbid")

    recorded_at: datetime
    rainfall_1h_mm: Optional[Decimal] = None
    rainfall_3h_mm: Optional[Decimal] = None
    rainfall_6h_mm: Optional[Decimal] = None
    rainfall_24h_mm: Optional[Decimal] = None
    water_level_m: Optional[Decimal] = None
    temperature_c: Optional[Decimal] = None
    humidity_pct: Optional[Decimal] = None
    data_source: str

    @field_validator("recorded_at")
    @classmethod
    def validate_timestamp(cls, v: datetime) -> datetime:
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("recorded_at must be a timezone-aware UTC datetime, not naive.")
        return v.astimezone(timezone.utc)

    @field_validator(
        "rainfall_1h_mm",
        "rainfall_3h_mm",
        "rainfall_6h_mm",
        "rainfall_24h_mm",
        "water_level_m",
        "temperature_c",
        "humidity_pct",
    )
    @classmethod
    def validate_non_negative_decimal(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < Decimal("0"):
            raise ValueError("value cannot be negative.")
        return v

    @field_validator("humidity_pct")
    @classmethod
    def validate_humidity_range(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and (v < Decimal("0") or v > Decimal("100")):
            raise ValueError("humidity_pct must be between 0 and 100.")
        return v

    @field_validator("data_source")
    @classmethod
    def validate_data_source(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("data_source must be a non-empty string.")
        return v.strip()


class ObservationListResponse(BaseModel):
    """API response for a region's observation history."""

    model_config = ConfigDict(extra="forbid")

    region_id: str
    observations: List["ObservationResponse"]
    total_observations: int

    @field_validator("region_id")
    @classmethod
    def validate_region_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("region_id must be a non-empty string.")
        return v.strip()

    @field_validator("total_observations")
    @classmethod
    def validate_total_observations(cls, v: int) -> int:
        if v < 0:
            raise ValueError("total_observations cannot be negative.")
        return v


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
        return v.astimezone(timezone.utc)

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


class ModelInfoResponse(BaseModel):
    """API response for model information endpoint.

    Exposes the currently configured prediction model metadata.
    """

    model_config = ConfigDict(extra="forbid")

    prediction_mode: Literal["baseline", "ml"]
    model_type: str
    model_version: str
    status: Literal["available", "unavailable"]

    @field_validator("model_type")
    @classmethod
    def validate_model_type(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("model_type must be a non-empty string.")
        return v.strip()

    @field_validator("model_version")
    @classmethod
    def validate_model_version(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("model_version must be a non-empty string.")
        return v.strip()

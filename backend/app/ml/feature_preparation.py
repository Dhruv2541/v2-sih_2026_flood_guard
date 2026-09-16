from typing import Any, Optional, Union

from app.data.schemas import NormalizedObservation
from app.ml.exceptions import MLInputError
from app.ml.schemas import MLPredictionInput
from app.models.observation import Observation
from app.models.region import Region

ObservationType = Union[NormalizedObservation, Observation, Any]
RegionType = Optional[Union[Region, Any]]


def prepare_prediction_input(
    observation: ObservationType,
    region: RegionType = None,
) -> MLPredictionInput:
    """Prepares validated MLPredictionInput features from raw observation and region metadata.
    
    This function bridges the backend storage/ingestion layer and the ML prediction contract:
    - Extracts canonical region_id and reference timestamp (recorded_at).
    - Extracts core rainfall window accumulations (1h, 3h, 6h, 24h).
    - Extracts optional hydrological and environmental attributes (water_level_m, temperature_c, humidity_pct).
    - Optionally maps topographical elevation_m if exposed by the supplied region object.
    
    STRICT MISSING-DATA POLICY:
    - Missing required rainfall measurements raise MLInputError. Rainfall is NEVER fabricated or assumed to be 0.
    - Missing optional features (water level, elevation, temperature, humidity) remain explicitly None.
    - Optional features are NEVER silently filled with 0, averaged, or interpolated without an approved rule.
    - No speculative feature engineering is performed (no rainfall ratios, runoff estimations, or terrain slopes).

    Args:
        observation: A NormalizedObservation or SQLAlchemy Observation record.
        region: Optional Region record containing regional metadata (e.g. elevation_m).

    Returns:
        MLPredictionInput: Validated Pydantic input contract for model inference.

    Raises:
        MLInputError: If observation is missing, malformed, lacks required fields, or has missing rainfall.
    """
    if observation is None:
        raise MLInputError("Observation data is required to prepare prediction input.")

    # Verify presence of required observation attributes
    required_attrs = (
        "region_id",
        "recorded_at",
        "rainfall_1h_mm",
        "rainfall_3h_mm",
        "rainfall_6h_mm",
        "rainfall_24h_mm",
    )
    for attr in required_attrs:
        if not hasattr(observation, attr):
            raise MLInputError(f"Observation lacks required attribute: '{attr}'.")

    # Strict check: all required rainfall windows must be present (not None)
    missing_rainfall = []
    for r_field in ("rainfall_1h_mm", "rainfall_3h_mm", "rainfall_6h_mm", "rainfall_24h_mm"):
        val = getattr(observation, r_field)
        if val is None:
            missing_rainfall.append(r_field)

    if missing_rainfall:
        raise MLInputError(
            f"Observation is missing required rainfall measurements: {', '.join(missing_rainfall)}. "
            f"Missing rainfall cannot be fabricated or imputed."
        )

    # Regional metadata extraction with region_id consistency check
    elevation_m = None
    if region is not None:
        reg_id = getattr(region, "region_id", None)
        obs_reg_id = getattr(observation, "region_id", None)
        if reg_id is not None and obs_reg_id is not None and reg_id != obs_reg_id:
            raise MLInputError(
                f"Region mismatch: observation region_id '{obs_reg_id}' does not match "
                f"supplied region region_id '{reg_id}'."
            )
        elevation_m = getattr(region, "elevation_m", None)

    # Optional environmental attributes (preserved as None if absent or None)
    water_level_m = getattr(observation, "water_level_m", None)
    temperature_c = getattr(observation, "temperature_c", None)
    humidity_pct = getattr(observation, "humidity_pct", None)

    try:
        return MLPredictionInput(
            region_id=observation.region_id,
            reference_time=observation.recorded_at,
            rainfall_1h_mm=observation.rainfall_1h_mm,
            rainfall_3h_mm=observation.rainfall_3h_mm,
            rainfall_6h_mm=observation.rainfall_6h_mm,
            rainfall_24h_mm=observation.rainfall_24h_mm,
            water_level_m=water_level_m,
            elevation_m=elevation_m,
            temperature_c=temperature_c,
            humidity_pct=humidity_pct,
        )
    except Exception as exc:
        raise MLInputError(f"Failed to construct valid MLPredictionInput: {exc}") from exc

"""Model feature preparation — bridges backend contract to ML model feature vector.

This module prepares the complete 14-feature vector required by the ML model
from the backend's MLPredictionInput + historical data + forecast + static metadata.

DOES NOT integrate the ML model. Only prepares features for future adapter.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.ml.schemas import MLPredictionInput
from app.ml.exceptions import MLInputError
from app.services.historical_aggregation import (
    HistoricalRainfallAggregationService,
    HistoricalDataInsufficientError,
)
from app.services.region_features import RegionFeatureService, RegionMetadataMissingError
from app.services.derived_features import (
    compute_runoff_potential_index,
    compute_proximity_risk_score,
)
from app.data.providers.open_meteo import OpenMeteoProvider
from app.data.exceptions import WeatherProviderError


class ModelFeaturePreparationError(MLInputError):
    """Raised when model feature preparation fails due to missing data."""
    pass


class ModelFeatureVector:
    """Complete feature vector for ML model inference.

    Contains all 14 features required by the trained model:
    1. rainfall_1h
    2. rainfall_3h
    3. rainfall_6h
    4. rainfall_12h
    5. rainfall_24h
    6. forecast_rainfall_6h
    7. rainfall_3d_cumulative
    8. rainfall_7d_cumulative
    9. elevation
    10. distance_to_river_m
    11. soil_clay_pct
    12. population_density
    13. runoff_potential_index
    14. proximity_risk_score

    Also includes metadata for traceability.
    """

    # Exact feature order expected by model (from model_version_metadata.json)
    FEATURE_ORDER = [
        "rainfall_1h",
        "rainfall_3h",
        "rainfall_6h",
        "rainfall_12h",
        "rainfall_24h",
        "forecast_rainfall_6h",
        "rainfall_3d_cumulative",
        "rainfall_7d_cumulative",
        "elevation",
        "distance_to_river_m",
        "soil_clay_pct",
        "population_density",
        "runoff_potential_index",
        "proximity_risk_score",
    ]

    def __init__(
        self,
        region_id: str,
        reference_time: datetime,
        rainfall_1h: Decimal,
        rainfall_3h: Decimal,
        rainfall_6h: Decimal,
        rainfall_12h: Decimal,
        rainfall_24h: Decimal,
        forecast_rainfall_6h: Decimal,
        rainfall_3d_cumulative: Decimal,
        rainfall_7d_cumulative: Decimal,
        elevation: Decimal,
        distance_to_river_m: Decimal,
        soil_clay_pct: Decimal,
        population_density: Decimal,
        runoff_potential_index: Decimal,
        proximity_risk_score: Decimal,
    ):
        self.region_id = region_id
        self.reference_time = reference_time
        self.rainfall_1h = rainfall_1h
        self.rainfall_3h = rainfall_3h
        self.rainfall_6h = rainfall_6h
        self.rainfall_12h = rainfall_12h
        self.rainfall_24h = rainfall_24h
        self.forecast_rainfall_6h = forecast_rainfall_6h
        self.rainfall_3d_cumulative = rainfall_3d_cumulative
        self.rainfall_7d_cumulative = rainfall_7d_cumulative
        self.elevation = elevation
        self.distance_to_river_m = distance_to_river_m
        self.soil_clay_pct = soil_clay_pct
        self.population_density = population_density
        self.runoff_potential_index = runoff_potential_index
        self.proximity_risk_score = proximity_risk_score

    def to_model_array(self) -> list:
        """Convert to ordered list matching model's expected feature order."""
        return [
            float(self.rainfall_1h),
            float(self.rainfall_3h),
            float(self.rainfall_6h),
            float(self.rainfall_12h),
            float(self.rainfall_24h),
            float(self.forecast_rainfall_6h),
            float(self.rainfall_3d_cumulative),
            float(self.rainfall_7d_cumulative),
            float(self.elevation),
            float(self.distance_to_river_m),
            float(self.soil_clay_pct),
            float(self.population_density),
            float(self.runoff_potential_index),
            float(self.proximity_risk_score),
        ]

    def to_dict(self) -> dict:
        """Convert to dictionary with feature names."""
        return {
            "region_id": self.region_id,
            "reference_time": self.reference_time.isoformat(),
            "features": {
                "rainfall_1h": float(self.rainfall_1h),
                "rainfall_3h": float(self.rainfall_3h),
                "rainfall_6h": float(self.rainfall_6h),
                "rainfall_12h": float(self.rainfall_12h),
                "rainfall_24h": float(self.rainfall_24h),
                "forecast_rainfall_6h": float(self.forecast_rainfall_6h),
                "rainfall_3d_cumulative": float(self.rainfall_3d_cumulative),
                "rainfall_7d_cumulative": float(self.rainfall_7d_cumulative),
                "elevation": float(self.elevation),
                "distance_to_river_m": float(self.distance_to_river_m),
                "soil_clay_pct": float(self.soil_clay_pct),
                "population_density": float(self.population_density),
                "runoff_potential_index": float(self.runoff_potential_index),
                "proximity_risk_score": float(self.proximity_risk_score),
            },
        }


class ModelFeaturePreparationService:
    """Service for preparing complete ML model feature vectors.

    Composes:
    - MLPredictionInput (current observation: 1h, 3h, 6h, 12h, 24h rainfall + optional env)
    - HistoricalRainfallAggregationService (3d, 7d cumulative from DB)
    - RegionFeatureService (static metadata from regions table)
    - OpenMeteoProvider (forecast_rainfall_6h)
    - Derived feature calculations (runoff_index, proximity_score)

    All data sources are explicit; no values are fabricated.
    """

    def __init__(self, session: Session):
        self.session = session
        self.historical_service = HistoricalRainfallAggregationService(session)
        self.region_service = RegionFeatureService(session)
        self.weather_provider = OpenMeteoProvider()

    async def prepare(
        self,
        ml_input: MLPredictionInput,
        region_latitude: float,
        region_longitude: float,
    ) -> ModelFeatureVector:
        """Prepare complete model feature vector.

        Args:
            ml_input: Validated MLPredictionInput from feature_preparation.py
            region_latitude: Latitude for forecast API call
            region_longitude: Longitude for forecast API call

        Returns:
            ModelFeatureVector: Complete 14-feature vector

        Raises:
            ModelFeaturePreparationError: If any required feature cannot be obtained
        """
        region_id = ml_input.region_id
        reference_time = ml_input.reference_time

        # 1. Core rainfall from MLPredictionInput (already validated)
        rainfall_1h = ml_input.rainfall_1h_mm
        rainfall_3h = ml_input.rainfall_3h_mm
        rainfall_6h = ml_input.rainfall_6h_mm
        rainfall_12h = ml_input.rainfall_12h_mm
        rainfall_24h = ml_input.rainfall_24h_mm

        # 2. Historical cumulative rainfall
        try:
            rainfall_3d_cumulative = self.historical_service.get_rainfall_3d_cumulative(
                region_id, reference_time
            )
        except HistoricalDataInsufficientError as exc:
            raise ModelFeaturePreparationError(f"No historical rainfall observations: {exc}") from exc

        try:
            rainfall_7d_cumulative = self.historical_service.get_rainfall_7d_cumulative(
                region_id, reference_time
            )
        except HistoricalDataInsufficientError as exc:
            raise ModelFeaturePreparationError(f"No historical rainfall observations: {exc}") from exc

        # 3. Forecast rainfall
        try:
            forecast_rainfall_6h = await self.weather_provider.fetch_forecast_rainfall_6h(
                region_id=region_id,
                latitude=region_latitude,
                longitude=region_longitude,
                reference_time=reference_time,
            )
        except WeatherProviderError as exc:
            raise ModelFeaturePreparationError(
                f"Failed to obtain forecast_rainfall_6h: {exc.message}"
            ) from exc

        # 4. Static region metadata
        try:
            static_features = self.region_service.get_all_static_features(region_id)
            elevation = static_features["elevation"]
            distance_to_river_m = static_features["distance_to_river_m"]
            soil_clay_pct = static_features["soil_clay_pct"]
            population_density = static_features["population_density"]
            curve_number = static_features["curve_number"]
        except RegionMetadataMissingError as exc:
            raise ModelFeaturePreparationError(str(exc)) from exc

        # 5. Derived features
        runoff_potential_index = compute_runoff_potential_index(
            rainfall_24h, soil_clay_pct, elevation, curve_number
        )
        proximity_risk_score = compute_proximity_risk_score(
            rainfall_24h, distance_to_river_m
        )

        return ModelFeatureVector(
            region_id=region_id,
            reference_time=reference_time,
            rainfall_1h=rainfall_1h,
            rainfall_3h=rainfall_3h,
            rainfall_6h=rainfall_6h,
            rainfall_12h=rainfall_12h,
            rainfall_24h=rainfall_24h,
            forecast_rainfall_6h=forecast_rainfall_6h,
            rainfall_3d_cumulative=rainfall_3d_cumulative,
            rainfall_7d_cumulative=rainfall_7d_cumulative,
            elevation=elevation,
            distance_to_river_m=distance_to_river_m,
            soil_clay_pct=soil_clay_pct,
            population_density=population_density,
            runoff_potential_index=runoff_potential_index,
            proximity_risk_score=proximity_risk_score,
        )
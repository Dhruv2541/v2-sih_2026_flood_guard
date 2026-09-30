"""
Baseline Prediction Provider — Deterministic demo model for submission.

This provider implements a deterministic hydrological baseline model that:
- Uses real observation/weather data when available
- Falls back to region static metadata
- Returns predictions compatible with the ML output contract
- Is completely deterministic and requires no trained ML artifacts

This is the DEFAULT prediction mode for submission (PREDICTION_MODE=baseline).
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional
import logging

from app.ml.schemas import MLPredictionInput, MLPredictionOutput
from app.services.region_features import RegionFeatureService, RegionMetadataMissingError
from app.services.derived_features import (
    compute_runoff_potential_index,
    compute_proximity_risk_score,
)
from app.data.providers.open_meteo import OpenMeteoProvider
from app.data.exceptions import WeatherProviderError

logger = logging.getLogger(__name__)


class BaselinePredictionError(Exception):
    """Raised when baseline prediction cannot be generated."""
    pass


class BaselineProvider:
    """
    Deterministic baseline flood risk predictor for demo/submission mode.
    
    Uses hydrological formulas derived from the original SIH model:
    - Flood probability based on rainfall, elevation, river distance, soil
    - Risk levels: low, moderate, high, severe
    - Returns flood_probability in [0, 1]
    """

    def __init__(self, region_service: "RegionFeatureService", weather_provider: "OpenMeteoProvider"):
        self.region_service = region_service
        self.weather_provider = weather_provider
        self.model_version = "demo-baseline-v1"

    def _compute_flood_probability(
        self,
        rainfall_24h: Decimal,
        elevation: Decimal,
        distance_to_river_m: Decimal,
        soil_clay_pct: Decimal,
        population_density: Decimal,
        forecast_rainfall_6h: Optional[Decimal] = None,
    ) -> Decimal:
        """
        Deterministic flood probability calculation.
        
        Formula based on hydrological principles:
        - Higher rainfall increases probability
        - Lower elevation increases probability
        - Closer to river increases probability
        - Higher soil clay increases probability (less infiltration)
        - Forecast rainfall adds to current risk
        """
        r24 = float(rainfall_24h)
        elev = float(elevation)
        dist = float(distance_to_river_m)
        clay = float(soil_clay_pct)
        pop_dens = float(population_density)
        
        # Base risk from 24h rainfall (sigmoid-like response)
        # 50mm -> ~0.3, 100mm -> ~0.6, 200mm -> ~0.9
        rain_risk = min(1.0, r24 / 150.0)
        
        # Elevation protection (higher = safer)
        # 100m -> 0.8 factor, 200m -> 0.5 factor, 300m+ -> 0.3 factor
        elev_factor = max(0.2, 1.0 - (elev / 400.0))
        
        # River proximity (closer = higher risk)
        # 100m -> 1.0, 1000m -> 0.5, 5000m+ -> 0.2
        dist_factor = max(0.2, min(1.0, dist / 5000.0))
        
        # Soil clay (higher clay = less infiltration = higher risk)
        clay_factor = clay / 100.0
        
        # Population density (more people = more impact)
        pop_factor = min(1.0, pop_dens / 1000.0) * 0.2  # Small weight
        
        # Combine factors
        base_prob = (
            rain_risk * 0.5 +
            (1.0 - elev_factor) * 0.2 +
            (1.0 - dist_factor) * 0.15 +
            clay_factor * 0.1 +
            pop_factor * 0.05
        )
        
        # Add forecast contribution if available
        if forecast_rainfall_6h is not None:
            fc_risk = min(1.0, float(forecast_rainfall_6h) / 50.0) * 0.2
            base_prob += fc_risk
        
        # Clamp to [0, 1]
        prob = max(0.0, min(1.0, base_prob))
        
        return Decimal(str(round(prob, 3)))

    def _get_risk_level(self, probability: Decimal) -> str:
        """Map probability to risk level."""
        p = float(probability)
        if p < 0.25:
            return "low"
        elif p < 0.5:
            return "moderate"
        elif p < 0.75:
            return "high"
        return "severe"

    async def predict(self, ml_input: MLPredictionInput) -> MLPredictionOutput:
        """
        Generate baseline prediction from validated input.
        
        Args:
            ml_input: Validated prediction input with current observations
            
        Returns:
            MLPredictionOutput with flood probability, risk level, and metadata
            
        Raises:
            BaselinePredictionError: If required data cannot be obtained
        """
        region_id = ml_input.region_id
        reference_time = ml_input.reference_time

        # 1. Get static region metadata
        try:
            static_features = self.region_service.get_all_static_features(region_id)
            elevation = static_features["elevation"]
            distance_to_river_m = static_features["distance_to_river_m"]
            soil_clay_pct = static_features["soil_clay_pct"]
            population_density = static_features["population_density"]
        except RegionMetadataMissingError as exc:
            logger.warning(f"Region metadata missing for {region_id}: {exc}")
            # Use safe defaults
            elevation = Decimal("50.0")
            distance_to_river_m = Decimal("1000.0")
            soil_clay_pct = Decimal("25.0")
            population_density = Decimal("300.0")

        # 2. Get forecast rainfall (optional for baseline)
        forecast_rainfall_6h = None
        try:
            region = self.region_service.get_region(region_id)
            if region:
                forecast_rainfall_6h = await self.weather_provider.fetch_forecast_rainfall_6h(
                    region_id=region_id,
                    latitude=region.latitude,
                    longitude=region.longitude,
                    reference_time=reference_time,
                )
        except (WeatherProviderError, Exception) as e:
            logger.debug(f"Forecast unavailable for {region_id}: {e}")
            forecast_rainfall_6h = None

        # 3. Compute flood probability using deterministic formula
        flood_probability = self._compute_flood_probability(
            rainfall_24h=ml_input.rainfall_24h_mm,
            elevation=elevation,
            distance_to_river_m=distance_to_river_m,
            soil_clay_pct=soil_clay_pct,
            population_density=population_density,
            forecast_rainfall_6h=forecast_rainfall_6h,
        )

        risk_level = self._get_risk_level(flood_probability)

        # 4. Build output
        generated_at = datetime.now(timezone.utc)
        forecast_valid_until = generated_at + timedelta(hours=6)

        return MLPredictionOutput(
            region_id=region_id,
            generated_at=generated_at,
            forecast_valid_until=forecast_valid_until,
            flood_probability=flood_probability,
            risk_level=risk_level,
            model_version=self.model_version,
        )


async def get_baseline_prediction(
    ml_input: MLPredictionInput,
    region_service: "RegionFeatureService",
    weather_provider: "OpenMeteoProvider",
) -> MLPredictionOutput:
    """
    Convenience function to get a baseline prediction.
    
    Creates provider instance and returns prediction.
    """
    provider = BaselineProvider(region_service, weather_provider)
    return await provider.predict(ml_input)
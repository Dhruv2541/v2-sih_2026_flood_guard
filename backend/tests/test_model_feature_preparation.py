"""Tests for model feature preparation service."""

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.orm import Session

from app.ml.schemas import MLPredictionInput
from app.ml.model_feature_preparation import (
    ModelFeaturePreparationService,
    ModelFeaturePreparationError,
    ModelFeatureVector,
)
from app.services.historical_aggregation import HistoricalDataInsufficientError
from app.services.region_features import RegionMetadataMissingError
from app.data.exceptions import WeatherProviderError


class TestModelFeaturePreparationService:
    """Tests for ModelFeaturePreparationService."""

    @pytest.fixture
    def mock_session(self):
        return MagicMock(spec=Session)

    @pytest.fixture
    def service(self, mock_session):
        return ModelFeaturePreparationService(mock_session)

    @pytest.fixture
    def ml_input(self):
        return MLPredictionInput(
            region_id="18-300-00101",
            reference_time=datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc),
            rainfall_1h_mm=Decimal("10.0"),
            rainfall_3h_mm=Decimal("25.0"),
            rainfall_6h_mm=Decimal("45.0"),
            rainfall_12h_mm=Decimal("80.0"),
            rainfall_24h_mm=Decimal("120.0"),
        )

    @pytest.fixture
    def mock_region_features(self):
        return {
            "elevation": Decimal("78.79"),
            "distance_to_river_m": Decimal("1718.8"),
            "soil_clay_pct": Decimal("28.3"),
            "population_density": Decimal("322.7"),
            "curve_number": Decimal("76.4"),
        }

    @pytest.mark.asyncio
    async def test_prepare_success(
        self,
        service,
        ml_input,
        mock_region_features,
    ):
        """Test successful feature preparation."""
        # Mock historical service
        service.historical_service.get_rainfall_3d_cumulative = MagicMock(
            return_value=Decimal("280.0")
        )
        service.historical_service.get_rainfall_7d_cumulative = MagicMock(
            return_value=Decimal("520.0")
        )

        # Mock region service
        service.region_service.get_all_static_features = MagicMock(
            return_value=mock_region_features
        )

        # Mock weather provider
        service.weather_provider.fetch_forecast_rainfall_6h = AsyncMock(
            return_value=Decimal("15.0")
        )

        result = await service.prepare(ml_input, 26.565942, 89.99337)

        assert isinstance(result, ModelFeatureVector)
        assert result.region_id == "18-300-00101"
        assert result.rainfall_1h == Decimal("10.0")
        assert result.rainfall_3h == Decimal("25.0")
        assert result.rainfall_6h == Decimal("45.0")
        assert result.rainfall_12h == Decimal("80.0")
        assert result.rainfall_24h == Decimal("120.0")
        assert result.forecast_rainfall_6h == Decimal("15.0")
        assert result.rainfall_3d_cumulative == Decimal("280.0")
        assert result.rainfall_7d_cumulative == Decimal("520.0")
        assert result.elevation == Decimal("78.79")
        assert result.distance_to_river_m == Decimal("1718.8")
        assert result.soil_clay_pct == Decimal("28.3")
        assert result.population_density == Decimal("322.7")
        # Verify derived features
        assert result.runoff_potential_index is not None
        assert result.proximity_risk_score is not None

    @pytest.mark.asyncio
    async def test_historical_insufficient_raises_error(self, service, ml_input):
        """Test that insufficient historical data raises error."""
        service.historical_service.get_rainfall_3d_cumulative = MagicMock(
            side_effect=HistoricalDataInsufficientError("No data")
        )

        with pytest.raises(ModelFeaturePreparationError) as exc_info:
            await service.prepare(ml_input, 26.565942, 89.99337)

        assert "No historical rainfall observations" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_forecast_unavailable_raises_error(self, service, ml_input):
        """Test that unavailable forecast raises error."""
        service.historical_service.get_rainfall_3d_cumulative = MagicMock(
            return_value=Decimal("280.0")
        )
        service.historical_service.get_rainfall_7d_cumulative = MagicMock(
            return_value=Decimal("520.0")
        )
        service.region_service.get_all_static_features = MagicMock(
            return_value={
                "elevation": Decimal("78.79"),
                "distance_to_river_m": Decimal("1718.8"),
                "soil_clay_pct": Decimal("28.3"),
                "population_density": Decimal("322.7"),
                "curve_number": Decimal("76.4"),
            }
        )
        service.weather_provider.fetch_forecast_rainfall_6h = AsyncMock(
            side_effect=WeatherProviderError("Forecast unavailable", provider="open-meteo")
        )

        with pytest.raises(ModelFeaturePreparationError) as exc_info:
            await service.prepare(ml_input, 26.565942, 89.99337)

        assert "Failed to obtain forecast_rainfall_6h" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_missing_region_metadata_raises_error(self, service, ml_input):
        """Test that missing region metadata raises error."""
        service.historical_service.get_rainfall_3d_cumulative = MagicMock(
            return_value=Decimal("280.0")
        )
        service.historical_service.get_rainfall_7d_cumulative = MagicMock(
            return_value=Decimal("520.0")
        )
        service.region_service.get_all_static_features = MagicMock(
            side_effect=RegionMetadataMissingError("Missing elevation")
        )
        service.weather_provider.fetch_forecast_rainfall_6h = AsyncMock(
            return_value=Decimal("15.0")
        )

        with pytest.raises(ModelFeaturePreparationError) as exc_info:
            await service.prepare(ml_input, 26.565942, 89.99337)

        assert "Missing elevation" in str(exc_info.value)


class TestModelFeatureVector:
    """Tests for ModelFeatureVector."""

    def test_to_model_array_order(self):
        """Test that to_model_array returns features in correct order."""
        vector = ModelFeatureVector(
            region_id="18-300-00101",
            reference_time=datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc),
            rainfall_1h=Decimal("1.0"),
            rainfall_3h=Decimal("2.0"),
            rainfall_6h=Decimal("3.0"),
            rainfall_12h=Decimal("4.0"),
            rainfall_24h=Decimal("5.0"),
            forecast_rainfall_6h=Decimal("6.0"),
            rainfall_3d_cumulative=Decimal("7.0"),
            rainfall_7d_cumulative=Decimal("8.0"),
            elevation=Decimal("9.0"),
            distance_to_river_m=Decimal("10.0"),
            soil_clay_pct=Decimal("11.0"),
            population_density=Decimal("12.0"),
            runoff_potential_index=Decimal("13.0"),
            proximity_risk_score=Decimal("14.0"),
        )

        arr = vector.to_model_array()
        expected = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0]
        assert arr == expected
        assert len(arr) == 14

    def test_feature_order_constant(self):
        """Test that FEATURE_ORDER constant matches expected order."""
        expected_order = [
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
        assert ModelFeatureVector.FEATURE_ORDER == expected_order


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
"""Tests for PREDICTION_MODE configuration and model factory."""

from pydantic import ValidationError
import pytest

from app.config import Settings
from app.ml import create_model
from app.ml.baseline import HydrologicalBaselineModel
from app.ml.exceptions import MLModelUnavailableError


# ==============================================================================
# PREDICTION_MODE Configuration Tests
# ==============================================================================

def test_prediction_mode_default_is_baseline():
    """Default PREDICTION_MODE is 'baseline'."""
    s = Settings()
    assert s.PREDICTION_MODE == "baseline"


def test_prediction_mode_accepts_baseline():
    """PREDICTION_MODE='baseline' is accepted."""
    s = Settings(PREDICTION_MODE="baseline")
    assert s.PREDICTION_MODE == "baseline"


def test_prediction_mode_accepts_ml():
    """PREDICTION_MODE='ml' is accepted."""
    s = Settings(PREDICTION_MODE="ml")
    assert s.PREDICTION_MODE == "ml"


def test_prediction_mode_rejects_invalid_value():
    """Invalid PREDICTION_MODE value is rejected at config validation."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(PREDICTION_MODE="invalid")
    # Pydantic's literal validation error message
    assert "Input should be 'baseline' or 'ml'" in str(exc_info.value)


def test_prediction_mode_case_sensitive():
    """PREDICTION_MODE validation is case-sensitive (uppercase rejected)."""
    with pytest.raises(ValidationError):
        Settings(PREDICTION_MODE="BASELINE")
    with pytest.raises(ValidationError):
        Settings(PREDICTION_MODE="Ml")


# ==============================================================================
# Model Factory Tests
# ==============================================================================

def test_create_model_baseline_returns_hydrological_baseline():
    """create_model('baseline') returns HydrologicalBaselineModel instance."""
    model = create_model("baseline")
    assert isinstance(model, HydrologicalBaselineModel)


def test_create_model_ml_raises_unavailable():
    """create_model('ml') raises MLModelUnavailableError with clear message."""
    with pytest.raises(MLModelUnavailableError) as exc_info:
        create_model("ml")
    assert "ML prediction mode selected but no ML model adapter is implemented yet" in str(exc_info.value)
    assert "PREDICTION_MODE=baseline" in str(exc_info.value)


def test_create_model_invalid_raises_value_error():
    """create_model('invalid') raises ValueError."""
    with pytest.raises(ValueError) as exc_info:
        create_model("invalid")
    assert "Unknown PREDICTION_MODE" in str(exc_info.value)
    assert "baseline" in str(exc_info.value)
    assert "ml" in str(exc_info.value)


def test_create_model_returns_flood_prediction_model_interface():
    """create_model returns object implementing FloodPredictionModel interface."""
    from app.ml.base import FloodPredictionModel
    model = create_model("baseline")
    assert isinstance(model, FloodPredictionModel)


# ==============================================================================
# Integration Tests: PredictionService with Factory
# ==============================================================================

def test_prediction_service_via_factory_baseline():
    """PredictionService works with model from factory in baseline mode."""
    from unittest.mock import MagicMock
    from sqlalchemy.orm import Session
    from datetime import datetime, timezone
    from decimal import Decimal
    from app.services.prediction import PredictionService
    from app.models.region import Region
    from app.models.observation import Observation

    mock_session = MagicMock(spec=Session)
    region = Region(
        region_id="DEV_AS_BAR_01",
        name="Barpeta",
        district="Barpeta",
        latitude=26.32,
        longitude=91.01,
        elevation_m=Decimal("35.0"),
    )
    observation = Observation(
        region_id="DEV_AS_BAR_01",
        recorded_at=datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=Decimal("10.0"),
        rainfall_3h_mm=Decimal("25.0"),
        rainfall_6h_mm=Decimal("50.0"),
        rainfall_24h_mm=Decimal("100.0"),
        water_level_m=None,
        temperature_c=Decimal("28.0"),
        humidity_pct=Decimal("80.0"),
        data_source="open-meteo",
    )

    mock_session.get.return_value = region
    mock_session.scalar.return_value = observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    model = create_model("baseline")
    service = PredictionService(model=model, session=mock_session)
    output = service.generate_prediction("DEV_AS_BAR_01")

    assert output.model_version == "baseline-v1"
    assert Decimal("0.0") <= output.flood_probability <= Decimal("1.0")


def test_prediction_service_via_factory_ml_fails_gracefully():
    """PredictionService with ML mode fails with MLModelUnavailableError at factory call."""
    # The factory raises MLModelUnavailableError immediately when mode is "ml"
    with pytest.raises(MLModelUnavailableError) as exc_info:
        create_model("ml")
    assert "ML prediction mode selected but no ML model adapter is implemented yet" in str(exc_info.value)
    assert "PREDICTION_MODE=baseline" in str(exc_info.value)
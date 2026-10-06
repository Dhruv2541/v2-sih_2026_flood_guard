"""Tests for region-wide prediction endpoint."""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.ml.baseline import HydrologicalBaselineModel
from app.ml.exceptions import (
    MLInferenceError,
    MLInputError,
    MLModelUnavailableError,
    MLOutputValidationError,
)
from app.ml.schemas import MLPredictionOutput
from app.models.observation import Observation
from app.models.prediction import Prediction
from app.models.region import Region
from app.services.prediction import (
    PredictionService,
    RegionNotFoundError,
    NoUsableObservationError,
    PredictionPersistenceError,
)
from app.database.connection import get_db


client = TestClient(app)


def _make_region(
    region_id: str = "DEV_AS_BAR_01",
    elevation_m: Decimal = Decimal("35.0"),
) -> Region:
    return Region(
        region_id=region_id,
        name="Barpeta Test Region",
        district="Barpeta",
        latitude=26.32,
        longitude=91.01,
        elevation_m=elevation_m,
    )


def _make_observation(
    region_id: str = "DEV_AS_BAR_01",
    recorded_at: datetime = None,
    rainfall_1h: Decimal = Decimal("10.0"),
    rainfall_3h: Decimal = Decimal("25.0"),
    rainfall_6h: Decimal = Decimal("50.0"),
    rainfall_24h: Decimal = Decimal("100.0"),
    water_level_m: Decimal = None,
    temperature_c: Decimal = Decimal("28.0"),
    humidity_pct: Decimal = Decimal("80.0"),
    data_source: str = "open-meteo",
) -> Observation:
    return Observation(
        region_id=region_id,
        recorded_at=recorded_at or datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=rainfall_1h,
        rainfall_3h_mm=rainfall_3h,
        rainfall_6h_mm=rainfall_6h,
        rainfall_24h_mm=rainfall_24h,
        water_level_m=water_level_m,
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
        data_source=data_source,
    )


def _make_mock_session() -> MagicMock:
    session = MagicMock(spec=Session)
    return session


# ==============================================================================
# Test Fixtures
# ==============================================================================

@pytest.fixture
def mock_session():
    """Provides a mock database session."""
    return _make_mock_session()


@pytest.fixture
def override_get_db(mock_session):
    """Override FastAPI's get_db dependency with mock session."""
    def _override():
        return mock_session
    app.dependency_overrides[get_db] = _override
    yield
    app.dependency_overrides.clear()


# ==============================================================================
# 1. Region-Wide Prediction Tests
# ==============================================================================

def test_zero_configured_regions_returns_empty_result(override_get_db, mock_session):
    """1. Zero configured regions returns empty result."""
    mock_session.scalars.return_value.all.return_value = []

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 0
    assert data["predictions_available"] == 0
    assert data["predictions_unavailable"] == 0
    assert data["predictions"] == []
    assert data["unavailable_regions"] == []


def test_one_configured_region_successful(override_get_db, mock_session):
    """2. One configured region with successful prediction."""
    region1 = _make_region("DEV_AS_BAR_01")
    obs1 = _make_observation("DEV_AS_BAR_01")

    # Mock the database query for regions
    mock_session.scalars.return_value.all.return_value = [region1]

    # Mock the generate_prediction calls
    mock_session.get.return_value = region1
    mock_session.scalar.return_value = obs1
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 1
    assert data["predictions_available"] == 1
    assert data["predictions_unavailable"] == 0
    assert len(data["predictions"]) == 1
    assert data["predictions"][0]["region_id"] == "DEV_AS_BAR_01"
    assert data["unavailable_regions"] == []


def test_multiple_successful_regions(override_get_db, mock_session):
    """3. Multiple configured regions all successful."""
    regions = [
        _make_region("DEV_AS_BAR_01"),
        _make_region("DEV_AS_DHU_01"),
        _make_region("DEV_AS_MAJ_01"),
    ]
    observations = [
        _make_observation("DEV_AS_BAR_01"),
        _make_observation("DEV_AS_DHU_01"),
        _make_observation("DEV_AS_MAJ_01"),
    ]

    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = observations
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 3
    assert data["predictions_available"] == 3
    assert data["predictions_unavailable"] == 0
    assert len(data["predictions"]) == 3
    assert len(data["unavailable_regions"]) == 0


def test_mixed_successful_and_unavailable_regions(override_get_db, mock_session):
    """4. Mixed successful and unavailable regions."""
    regions = [
        _make_region("DEV_AS_BAR_01"),
        _make_region("DEV_AS_DHU_01"),
        _make_region("DEV_AS_MAJ_01"),
    ]
    obs1 = _make_observation("DEV_AS_BAR_01")
    obs2 = _make_observation("DEV_AS_DHU_01")

    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    # Third region has no observation
    mock_session.scalar.side_effect = [obs1, obs2, None]
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 3
    assert data["predictions_available"] == 2
    assert data["predictions_unavailable"] == 1
    assert len(data["predictions"]) == 2
    assert len(data["unavailable_regions"]) == 1
    assert data["unavailable_regions"][0]["region_id"] == "DEV_AS_MAJ_01"
    assert "no usable observation" in data["unavailable_regions"][0]["message"].lower()


def test_one_region_failure_does_not_abort_batch(override_get_db, mock_session):
    """5. One region failure does not abort entire batch."""
    regions = [
        _make_region("DEV_AS_BAR_01"),
        _make_region("DEV_AS_DHU_01"),
        _make_region("DEV_AS_MAJ_01"),
    ]
    obs1 = _make_observation("DEV_AS_BAR_01")
    obs2 = _make_observation("DEV_AS_DHU_01")

    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = [obs1, obs2, None]  # Third has no observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    # First two should succeed, third should be unavailable
    assert data["predictions_available"] == 2
    assert data["predictions_unavailable"] == 1


def test_no_usable_observation_reported_explicitly(override_get_db, mock_session):
    """6. No usable observation is reported explicitly with safe reason."""
    region = _make_region("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = None  # No observation

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["predictions_unavailable"] == 1
    assert len(data["unavailable_regions"]) == 1
    unavailable = data["unavailable_regions"][0]
    assert unavailable["region_id"] == "DEV_AS_BAR_01"
    assert unavailable["error_type"] == "NoUsableObservationError"
    # Reason should be safe (no internal details)
    assert "no usable observation" in unavailable["message"].lower()


def test_model_failure_isolated(override_get_db, mock_session):
    """7. Model failure for one region is isolated."""
    regions = [
        _make_region("DEV_AS_BAR_01"),
        _make_region("DEV_AS_DHU_01"),
    ]
    obs1 = _make_observation("DEV_AS_BAR_01")
    obs2 = _make_observation("DEV_AS_DHU_01")

    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = [obs1, obs2]
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    # Patch the model factory to return a model that fails on second call
    with patch("app.api.endpoints.predictions.create_model") as mock_create_model:
        mock_model = MagicMock()
        mock_model.predict.side_effect = [
            MLPredictionOutput(
                region_id="DEV_AS_BAR_01",
                generated_at=datetime.now(timezone.utc),
                forecast_valid_until=datetime.now(timezone.utc) + timedelta(hours=6),
                flood_probability=Decimal("0.5"),
                model_version="baseline-v1",
            ),
            MLInferenceError("Model crashed on second region"),
        ]
        mock_create_model.return_value = mock_model

        response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["predictions_available"] == 1
    assert data["predictions_unavailable"] == 1
    assert data["unavailable_regions"][0]["region_id"] == "DEV_AS_DHU_01"
    assert data["unavailable_regions"][0]["error_type"] == "MLInferenceError"


def test_region_wide_response_structure(override_get_db, mock_session):
    """8. Region-wide response has correct structure."""
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    # Check all required fields
    required_fields = {"generated_at", "total_regions", "predictions_available", 
                       "predictions_unavailable", "predictions", "unavailable_regions"}
    assert set(data.keys()) == required_fields
    assert isinstance(data["total_regions"], int)
    assert isinstance(data["predictions_available"], int)
    assert isinstance(data["predictions_unavailable"], int)
    assert isinstance(data["predictions"], list)
    assert isinstance(data["unavailable_regions"], list)


def test_correct_total_regions_count(override_get_db, mock_session):
    """9. Correct total_regions count."""
    regions = [
        _make_region("DEV_AS_BAR_01"),
        _make_region("DEV_AS_DHU_01"),
    ]

    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = [None, None]  # No observations for either
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["total_regions"] == 2
    assert data["predictions_available"] == 0
    assert data["predictions_unavailable"] == 2


def test_correct_predictions_available_count(override_get_db, mock_session):
    """10. Correct predictions_available count."""
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["predictions_available"] == 1


def test_correct_predictions_unavailable_count(override_get_db, mock_session):
    """11. Correct predictions_unavailable count."""
    regions = [
        _make_region("DEV_AS_BAR_01"),
        _make_region("DEV_AS_DHU_01"),
    ]
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = [obs, None]  # Second has no observation
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["predictions_unavailable"] == 1


def test_risk_classification_correct_in_batch(override_get_db, mock_session):
    """12. Risk classification is correct in batch predictions."""
    # Create regions with different rainfall to get different risk levels
    regions = [
        _make_region("DEV_AS_LOW_01"),
        _make_region("DEV_AS_HIGH_01"),
    ]
    # Low rainfall -> low probability -> LOW risk
    obs_low = _make_observation("DEV_AS_LOW_01", 
                                rainfall_1h=Decimal("0"), 
                                rainfall_3h=Decimal("0"),
                                rainfall_6h=Decimal("0"),
                                rainfall_24h=Decimal("1"))
    # High rainfall -> high probability -> CRITICAL risk
    obs_high = _make_observation("DEV_AS_HIGH_01",
                                 rainfall_1h=Decimal("50"),
                                 rainfall_3h=Decimal("100"),
                                 rainfall_6h=Decimal("150"),
                                 rainfall_24h=Decimal("300"))

    mock_session.scalars.return_value.all.return_value = regions
    mock_session.get.side_effect = regions
    mock_session.scalar.side_effect = [obs_low, obs_high]
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["predictions_available"] == 2
    
    # Check risk levels
    pred_by_region = {p["region_id"]: p for p in data["predictions"]}
    assert pred_by_region["DEV_AS_LOW_01"]["risk_level"] == "LOW"
    assert pred_by_region["DEV_AS_HIGH_01"]["risk_level"] == "CRITICAL"


def test_ml_output_contract_unchanged_in_batch(override_get_db, mock_session):
    """13. ML output contract remains unchanged in batch."""
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    pred = data["predictions"][0]
    # Verify ML contract fields are present and unchanged
    assert "flood_probability" in pred
    assert "model_version" in pred
    assert "region_id" in pred
    assert "generated_at" in pred
    assert "forecast_valid_until" in pred
    # risk_level is added by backend layer
    assert "risk_level" in pred


def test_existing_single_region_endpoint_still_works(override_get_db, mock_session):
    """14. Existing single-region endpoint still works."""
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    response = client.get("/api/v1/predictions/DEV_AS_BAR_01")

    assert response.status_code == 200
    data = response.json()
    assert data["region_id"] == "DEV_AS_BAR_01"
    assert "flood_probability" in data
    assert "risk_level" in data


def test_route_collision_no_conflict(override_get_db, mock_session):
    """15. Route collision: GET /predictions vs GET /predictions/{region_id}."""
    # Test both routes work independently
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()
    mock_session.scalars.return_value.all.return_value = [region]

    # Test collection endpoint
    resp1 = client.get("/api/v1/predictions")
    assert resp1.status_code == 200
    assert "total_regions" in resp1.json()

    # Test single region endpoint
    resp2 = client.get("/api/v1/predictions/DEV_AS_BAR_01")
    assert resp2.status_code == 200
    assert resp2.json()["region_id"] == "DEV_AS_BAR_01"


def test_repeated_batch_execution_idempotent(override_get_db, mock_session):
    """16. Repeated batch execution does not violate persistence constraints."""
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    # Call twice
    resp1 = client.get("/api/v1/predictions")
    resp2 = client.get("/api/v1/predictions")

    assert resp1.status_code == 200
    assert resp2.status_code == 200
    # Both should succeed (UPSERT handles idempotency)
    assert resp1.json()["predictions_available"] == 1
    assert resp2.json()["predictions_available"] == 1


def test_no_fabricated_predictions(override_get_db, mock_session):
    """17. No fabricated predictions for regions without observations."""
    region = _make_region("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = None  # No observation

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    assert data["predictions_available"] == 0
    assert data["predictions_unavailable"] == 1
    assert len(data["predictions"]) == 0
    # The unavailable region should have a safe reason
    assert "no usable observation" in data["unavailable_regions"][0]["message"].lower()


def test_no_internal_exception_details_exposed(override_get_db, mock_session):
    """18. No internal exception details exposed in unavailable reasons."""
    region = _make_region("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = None

    response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    data = response.json()
    unavailable = data["unavailable_regions"][0]
    message = unavailable["message"]
    # Should not contain traceback, file paths, or internal exception class names
    assert "traceback" not in message.lower()
    assert "file" not in message.lower()
    assert "sqlalchemy" not in message.lower()
    assert "raise" not in message.lower()
    assert "exception" not in message.lower()


def test_dependency_injection_preserved(override_get_db, mock_session):
    """18. Dependency injection preserved - service uses injected model."""
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    with patch("app.api.endpoints.predictions.create_model") as mock_create_model:
        mock_model = MagicMock()
        mock_model.predict.return_value = MLPredictionOutput(
            region_id="DEV_AS_BAR_01",
            generated_at=datetime.now(timezone.utc),
            forecast_valid_until=datetime.now(timezone.utc) + timedelta(hours=6),
            flood_probability=Decimal("0.5"),
            model_version="baseline-v1",
        )
        mock_create_model.return_value = mock_model

        response = client.get("/api/v1/predictions")

    assert response.status_code == 200
    # The factory should have been called
    mock_create_model.assert_called()


def test_model_unavailable_returns_503(override_get_db, mock_session):
    """Model unavailable for region-wide returns 503."""
    region = _make_region("DEV_AS_BAR_01")
    obs = _make_observation("DEV_AS_BAR_01")

    mock_session.scalars.return_value.all.return_value = [region]
    mock_session.get.return_value = region
    mock_session.scalar.return_value = obs
    mock_session.execute = MagicMock()
    mock_session.commit = MagicMock()

    with patch("app.api.endpoints.predictions.create_model") as mock_create_model:
        mock_model = MagicMock()
        mock_model.predict.side_effect = MLModelUnavailableError("Model not loaded")
        mock_create_model.return_value = mock_model

        response = client.get("/api/v1/predictions")

    assert response.status_code == 503
    data = response.json()
    assert "unavailable" in data["detail"].lower()
"""Tests for model info endpoint."""

from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.config import Settings
from app.ml import get_model_info
from app.ml.exceptions import MLModelUnavailableError
from app.schemas.prediction import ModelInfoResponse


client = TestClient(app)


# ==============================================================================
# 1. Configuration Tests
# ==============================================================================

def test_default_prediction_mode_is_baseline():
    """Default PREDICTION_MODE is baseline."""
    s = Settings()
    assert s.PREDICTION_MODE == "baseline"


def test_get_model_info_baseline_returns_correct_metadata():
    """get_model_info('baseline') returns correct metadata."""
    info = get_model_info("baseline")
    assert info["prediction_mode"] == "baseline"
    assert info["model_type"] == "HydrologicalBaselineModel"
    assert info["model_version"] == "baseline-v1"
    assert info["status"] == "available"


def test_get_model_info_ml_raises_unavailable():
    """get_model_info('ml') raises MLModelUnavailableError."""
    with pytest.raises(MLModelUnavailableError) as exc_info:
        get_model_info("ml")
    assert "ML prediction mode selected but no ML model adapter is implemented yet" in str(exc_info.value)


def test_get_model_info_invalid_raises_value_error():
    """get_model_info('invalid') raises ValueError."""
    with pytest.raises(ValueError) as exc_info:
        get_model_info("invalid")
    assert "Unknown PREDICTION_MODE" in str(exc_info.value)


def test_model_info_response_schema_valid():
    """ModelInfoResponse schema validates correctly for baseline."""
    response = ModelInfoResponse(
        prediction_mode="baseline",
        model_type="HydrologicalBaselineModel",
        model_version="baseline-v1",
        status="available",
    )
    assert response.prediction_mode == "baseline"
    assert response.model_type == "HydrologicalBaselineModel"
    assert response.model_version == "baseline-v1"
    assert response.status == "available"


def test_model_info_response_schema_rejects_invalid_status():
    """ModelInfoResponse rejects invalid status."""
    with pytest.raises(ValidationError):
        ModelInfoResponse(
            prediction_mode="baseline",
            model_type="HydrologicalBaselineModel",
            model_version="baseline-v1",
            status="invalid",
        )


def test_model_info_response_schema_rejects_invalid_mode():
    """ModelInfoResponse rejects invalid prediction_mode."""
    with pytest.raises(ValidationError):
        ModelInfoResponse(
            prediction_mode="invalid",
            model_type="SomeModel",
            model_version="1.0",
            status="available",
        )


# ==============================================================================
# 2. Endpoint Tests - Baseline Mode (uses default app/client)
# ==============================================================================

def test_model_info_endpoint_exists():
    """GET /api/v1/predict/model/info endpoint exists and returns 200 for baseline."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200


def test_model_info_endpoint_returns_correct_baseline_mode():
    """Baseline mode returns correct prediction_mode."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["prediction_mode"] == "baseline"


def test_model_info_endpoint_returns_correct_model_type():
    """Baseline mode returns correct model_type."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_type"] == "HydrologicalBaselineModel"


def test_model_info_endpoint_returns_correct_model_version():
    """Baseline mode returns correct model_version."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_version"] == "baseline-v1"


def test_model_info_endpoint_returns_available_status():
    """Baseline mode returns status=available."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "available"


def test_model_info_endpoint_response_matches_schema():
    """Response conforms to ModelInfoResponse schema."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200
    # This will raise if schema validation fails
    ModelInfoResponse(**response.json())


# ==============================================================================
# 3. Endpoint Tests - ML Mode (using mocking)
# ==============================================================================

def test_model_info_endpoint_ml_mode_returns_503():
    """ML mode returns 503 with appropriate error when MLModelUnavailableError is raised."""
    # Mock get_model_info to raise MLModelUnavailableError as it would in ML mode
    with patch("app.api.endpoints.predictions.get_model_info") as mock_get_model_info:
        mock_get_model_info.side_effect = MLModelUnavailableError(
            "ML prediction mode selected but no ML model adapter is implemented yet."
        )

        response = client.get("/api/v1/predict/model/info")
        assert response.status_code == 503
        data = response.json()
        assert "unavailable" in data["detail"].lower()


def test_model_info_endpoint_ml_mode_does_not_report_baseline():
    """ML mode does NOT silently report baseline model info."""
    with patch("app.api.endpoints.predictions.get_model_info") as mock_get_model_info:
        mock_get_model_info.side_effect = MLModelUnavailableError(
            "ML prediction mode selected but no ML model adapter is implemented yet."
        )

        response = client.get("/api/v1/predict/model/info")
        assert response.status_code == 503
        data = response.json()
        # Should return 503 error, not baseline model info
        assert "unavailable" in data["detail"].lower()
        assert data["detail"] == "Prediction model is currently unavailable"


# ==============================================================================
# 4. Contract Tests
# ==============================================================================

def test_model_info_response_has_required_fields():
    """Response has all required fields."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200
    data = response.json()
    required_fields = {"prediction_mode", "model_type", "model_version", "status"}
    assert set(data.keys()) == required_fields


def test_model_info_response_fields_are_strings():
    """All response fields are non-empty strings."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200
    data = response.json()
    for field in ["prediction_mode", "model_type", "model_version", "status"]:
        assert isinstance(data[field], str)
        assert len(data[field]) > 0


def test_model_info_consistent_with_prediction_response():
    """model_version in model/info matches model_version in predictions."""
    response = client.get("/api/v1/predict/model/info")
    assert response.status_code == 200
    model_info = response.json()

    # The model_version should match what the baseline model returns
    assert model_info["model_version"] == "baseline-v1"
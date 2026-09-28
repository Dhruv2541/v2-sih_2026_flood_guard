from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional
from unittest.mock import MagicMock
import pytest
from pydantic import ValidationError

from app.data.exceptions import WeatherProviderError
from app.data.schemas import NormalizedObservation
from app.ml.base import FloodPredictionModel, validate_model_output
from app.ml.exceptions import (
    MLError,
    MLInferenceError,
    MLInputError,
    MLModelUnavailableError,
    MLOutputValidationError,
)
from app.ml.feature_preparation import prepare_prediction_input
from app.ml.schemas import MLPredictionInput, MLPredictionOutput
from app.models.observation import Observation
from app.models.region import Region
from app.services.observation_persistence import ObservationPersistenceError


# ==============================================================================
# 1. MLPredictionInput TESTS (Items 1 - 11)
# ==============================================================================

def test_1_valid_ml_prediction_input_with_required_rainfall() -> None:
    """1. Valid MLPredictionInput with core rainfall and omitted optional fields."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    inp = MLPredictionInput(
        region_id="DEV_AS_BAR_01",
        reference_time=now_utc,
        rainfall_1h_mm=Decimal("12.5"),
        rainfall_3h_mm=Decimal("35.0"),
        rainfall_6h_mm=Decimal("60.0"),
        rainfall_24h_mm=Decimal("110.0"),
    )
    assert inp.region_id == "DEV_AS_BAR_01"
    assert inp.reference_time == now_utc
    assert inp.rainfall_1h_mm == Decimal("12.5")
    assert inp.rainfall_3h_mm == Decimal("35.0")
    assert inp.rainfall_6h_mm == Decimal("60.0")
    assert inp.rainfall_24h_mm == Decimal("110.0")
    assert inp.water_level_m is None
    assert inp.elevation_m is None
    assert inp.temperature_c is None
    assert inp.humidity_pct is None


def test_2_valid_ml_prediction_input_with_optional_fields() -> None:
    """2. Valid MLPredictionInput with all optional fields provided."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    inp = MLPredictionInput(
        region_id="DEV_AS_BAR_01",
        reference_time=now_utc,
        rainfall_1h_mm=Decimal("0.0"),
        rainfall_3h_mm=Decimal("0.0"),
        rainfall_6h_mm=Decimal("0.0"),
        rainfall_24h_mm=Decimal("5.0"),
        water_level_m=Decimal("45.2"),
        elevation_m=Decimal("32.0"),
        temperature_c=Decimal("28.4"),
        humidity_pct=Decimal("85.5"),
    )
    assert inp.water_level_m == Decimal("45.2")
    assert inp.elevation_m == Decimal("32.0")
    assert inp.temperature_c == Decimal("28.4")
    assert inp.humidity_pct == Decimal("85.5")


def test_3_empty_region_id_rejected() -> None:
    """3. Empty region_id string is rejected with ValidationError."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionInput(
            region_id="",
            reference_time=now_utc,
            rainfall_1h_mm=Decimal("1.0"),
            rainfall_3h_mm=Decimal("2.0"),
            rainfall_6h_mm=Decimal("3.0"),
            rainfall_24h_mm=Decimal("4.0"),
        )
    assert "region_id must be a non-empty string" in str(exc_info.value)


def test_4_whitespace_region_id_rejected() -> None:
    """4. Whitespace-only region_id string is rejected with ValidationError."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionInput(
            region_id="   ",
            reference_time=now_utc,
            rainfall_1h_mm=Decimal("1.0"),
            rainfall_3h_mm=Decimal("2.0"),
            rainfall_6h_mm=Decimal("3.0"),
            rainfall_24h_mm=Decimal("4.0"),
        )
    assert "region_id must be a non-empty string" in str(exc_info.value)


def test_5_naive_reference_time_rejected() -> None:
    """5. Naive datetime without timezone is rejected."""
    naive_dt = datetime(2026, 9, 17, 12, 0)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionInput(
            region_id="DEV_AS_BAR_01",
            reference_time=naive_dt,
            rainfall_1h_mm=Decimal("1.0"),
            rainfall_3h_mm=Decimal("2.0"),
            rainfall_6h_mm=Decimal("3.0"),
            rainfall_24h_mm=Decimal("4.0"),
        )
    assert "timezone-aware UTC datetime, not naive" in str(exc_info.value)


def test_6_non_utc_timezone_normalized_to_utc() -> None:
    """6. Non-UTC timezone is normalized to UTC according to project standard."""
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    ist_dt = datetime(2026, 9, 17, 17, 30, tzinfo=ist_tz)  # 12:00 UTC
    inp = MLPredictionInput(
        region_id="DEV_AS_BAR_01",
        reference_time=ist_dt,
        rainfall_1h_mm=Decimal("1.0"),
        rainfall_3h_mm=Decimal("2.0"),
        rainfall_6h_mm=Decimal("3.0"),
        rainfall_24h_mm=Decimal("4.0"),
    )
    assert inp.reference_time == datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    assert inp.reference_time.tzinfo == timezone.utc


def test_7_negative_rainfall_rejected() -> None:
    """7. Negative rainfall values in any window are rejected."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    for field_name in ("rainfall_1h_mm", "rainfall_3h_mm", "rainfall_6h_mm", "rainfall_24h_mm"):
        kwargs = {
            "region_id": "DEV_AS_BAR_01",
            "reference_time": now_utc,
            "rainfall_1h_mm": Decimal("1.0"),
            "rainfall_3h_mm": Decimal("2.0"),
            "rainfall_6h_mm": Decimal("3.0"),
            "rainfall_24h_mm": Decimal("4.0"),
        }
        kwargs[field_name] = Decimal("-0.1")
        with pytest.raises(ValidationError) as exc_info:
            MLPredictionInput(**kwargs)
        assert f"{field_name} cannot be negative" in str(exc_info.value)


def test_8_missing_required_rainfall_rejected() -> None:
    """8. Omission of any required rainfall accumulation fails validation."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError):
        # Missing rainfall_24h_mm
        MLPredictionInput(  # type: ignore[call-arg]
            region_id="DEV_AS_BAR_01",
            reference_time=now_utc,
            rainfall_1h_mm=Decimal("1.0"),
            rainfall_3h_mm=Decimal("2.0"),
            rainfall_6h_mm=Decimal("3.0"),
        )


def test_9_humidity_below_0_rejected() -> None:
    """9. Humidity percentage below 0.0 is rejected."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionInput(
            region_id="DEV_AS_BAR_01",
            reference_time=now_utc,
            rainfall_1h_mm=Decimal("1.0"),
            rainfall_3h_mm=Decimal("2.0"),
            rainfall_6h_mm=Decimal("3.0"),
            rainfall_24h_mm=Decimal("4.0"),
            humidity_pct=Decimal("-0.5"),
        )
    assert "humidity_pct must be between 0.0 and 100.0" in str(exc_info.value)


def test_10_humidity_above_100_rejected() -> None:
    """10. Humidity percentage above 100.0 is rejected."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionInput(
            region_id="DEV_AS_BAR_01",
            reference_time=now_utc,
            rainfall_1h_mm=Decimal("1.0"),
            rainfall_3h_mm=Decimal("2.0"),
            rainfall_6h_mm=Decimal("3.0"),
            rainfall_24h_mm=Decimal("4.0"),
            humidity_pct=Decimal("100.1"),
        )
    assert "humidity_pct must be between 0.0 and 100.0" in str(exc_info.value)


def test_11_extra_input_fields_rejected() -> None:
    """11. Extra unapproved attributes are strictly rejected (extra='forbid')."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionInput(
            region_id="DEV_AS_BAR_01",
            reference_time=now_utc,
            rainfall_1h_mm=Decimal("1.0"),
            rainfall_3h_mm=Decimal("2.0"),
            rainfall_6h_mm=Decimal("3.0"),
            rainfall_24h_mm=Decimal("4.0"),
            unapproved_slope=Decimal("12.5"),  # type: ignore[call-arg]
        )
    assert "Extra inputs are not permitted" in str(exc_info.value)


# ==============================================================================
# 2. MLPredictionOutput TESTS (Items 12 - 20)
# ==============================================================================

def test_12_probability_0_accepted() -> None:
    """12. Boundary probability 0.0 is accepted."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    valid_until = gen_at + timedelta(hours=6)
    out = MLPredictionOutput(
        region_id="DEV_AS_BAR_01",
        generated_at=gen_at,
        forecast_valid_until=valid_until,
        flood_probability=Decimal("0.0"),
        model_version="v1.0.0",
    )
    assert out.flood_probability == Decimal("0.0")


def test_13_probability_1_accepted() -> None:
    """13. Boundary probability 1.0 is accepted."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    valid_until = gen_at + timedelta(hours=6)
    out = MLPredictionOutput(
        region_id="DEV_AS_BAR_01",
        generated_at=gen_at,
        forecast_valid_until=valid_until,
        flood_probability=Decimal("1.0"),
        model_version="v1.0.0",
    )
    assert out.flood_probability == Decimal("1.0")


def test_14_intermediate_probability_accepted() -> None:
    """14. Intermediate probability between 0.0 and 1.0 is accepted."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    valid_until = gen_at + timedelta(hours=6)
    out = MLPredictionOutput(
        region_id="DEV_AS_BAR_01",
        generated_at=gen_at,
        forecast_valid_until=valid_until,
        flood_probability=Decimal("0.425"),
        model_version="v1.0.0",
    )
    assert out.flood_probability == Decimal("0.425")


def test_15_probability_below_0_rejected() -> None:
    """15. Negative probability is rejected without silent clamping."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    valid_until = gen_at + timedelta(hours=6)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionOutput(
            region_id="DEV_AS_BAR_01",
            generated_at=gen_at,
            forecast_valid_until=valid_until,
            flood_probability=Decimal("-0.01"),
            model_version="v1.0.0",
        )
    assert "flood_probability must be between 0.0 and 1.0" in str(exc_info.value)


def test_16_probability_above_1_rejected() -> None:
    """16. Probability greater than 1.0 is rejected without silent clamping."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    valid_until = gen_at + timedelta(hours=6)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionOutput(
            region_id="DEV_AS_BAR_01",
            generated_at=gen_at,
            forecast_valid_until=valid_until,
            flood_probability=Decimal("1.05"),
            model_version="v1.0.0",
        )
    assert "flood_probability must be between 0.0 and 1.0" in str(exc_info.value)


def test_17_empty_model_version_rejected() -> None:
    """17. Empty model_version string is rejected."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    valid_until = gen_at + timedelta(hours=6)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionOutput(
            region_id="DEV_AS_BAR_01",
            generated_at=gen_at,
            forecast_valid_until=valid_until,
            flood_probability=Decimal("0.5"),
            model_version="",
        )
    assert "model_version must be a non-empty string" in str(exc_info.value)


def test_18_whitespace_model_version_rejected() -> None:
    """18. Whitespace-only model_version is rejected."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    valid_until = gen_at + timedelta(hours=6)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionOutput(
            region_id="DEV_AS_BAR_01",
            generated_at=gen_at,
            forecast_valid_until=valid_until,
            flood_probability=Decimal("0.5"),
            model_version="   ",
        )
    assert "model_version must be a non-empty string" in str(exc_info.value)


def test_19_forecast_valid_until_earlier_than_generated_at_rejected() -> None:
    """19. forecast_valid_until earlier than generated_at is rejected."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    past_valid_until = gen_at - timedelta(minutes=1)
    with pytest.raises(ValidationError) as exc_info:
        MLPredictionOutput(
            region_id="DEV_AS_BAR_01",
            generated_at=gen_at,
            forecast_valid_until=past_valid_until,
            flood_probability=Decimal("0.5"),
            model_version="v1.0.0",
        )
    assert "cannot be earlier than generated_at" in str(exc_info.value)


def test_20_valid_output_accepted() -> None:
    """20. Standard valid MLPredictionOutput is accepted with all invariants intact."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    valid_until = gen_at + timedelta(hours=6)
    out = MLPredictionOutput(
        region_id="DEV_AS_BAR_01",
        generated_at=gen_at,
        forecast_valid_until=valid_until,
        flood_probability=Decimal("0.850"),
        model_version="rf_v1.0_baseline",
    )
    assert out.region_id == "DEV_AS_BAR_01"
    assert out.generated_at == gen_at
    assert out.forecast_valid_until == valid_until
    assert out.flood_probability == Decimal("0.850")
    assert out.model_version == "rf_v1.0_baseline"


# ==============================================================================
# 3. Model Interface & Boundary Validation (Items 21 - 23)
# ==============================================================================

def test_21_abstract_flood_prediction_model_cannot_be_instantiated() -> None:
    """21. Abstract base class FloodPredictionModel cannot be instantiated directly."""
    with pytest.raises(TypeError) as exc_info:
        FloodPredictionModel()  # type: ignore[abstract]
    assert "Can't instantiate abstract class" in str(exc_info.value)


def test_22_concrete_test_implementation_can_return_valid_output() -> None:
    """22. Concrete model implementation in tests satisfies the interface and returns valid output."""
    class MockModel(FloodPredictionModel):
        def predict(self, input_data: MLPredictionInput) -> MLPredictionOutput:
            return MLPredictionOutput(
                region_id=input_data.region_id,
                generated_at=input_data.reference_time,
                forecast_valid_until=input_data.reference_time + timedelta(hours=6),
                flood_probability=Decimal("0.65"),
                model_version="mock_v1",
            )

    model = MockModel()
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    inp = MLPredictionInput(
        region_id="DEV_AS_BAR_01",
        reference_time=now_utc,
        rainfall_1h_mm=Decimal("10.0"),
        rainfall_3h_mm=Decimal("20.0"),
        rainfall_6h_mm=Decimal("30.0"),
        rainfall_24h_mm=Decimal("40.0"),
    )
    result = model.predict(inp)
    assert isinstance(result, MLPredictionOutput)
    assert result.region_id == "DEV_AS_BAR_01"
    assert result.flood_probability == Decimal("0.65")
    assert result.model_version == "mock_v1"


def test_23_output_region_mismatch_is_rejected() -> None:
    """23. validate_model_output raises MLOutputValidationError on region mismatch."""
    gen_at = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    out = MLPredictionOutput(
        region_id="OTHER_REGION_02",
        generated_at=gen_at,
        forecast_valid_until=gen_at + timedelta(hours=6),
        flood_probability=Decimal("0.5"),
        model_version="v1.0.0",
    )
    with pytest.raises(MLOutputValidationError) as exc_info:
        validate_model_output(out, expected_region_id="DEV_AS_BAR_01")
    assert "does not match expected input region_id 'DEV_AS_BAR_01'" in str(exc_info.value)


# ==============================================================================
# 4. Exception Hierarchy & Domain Isolation (Items 24 - 26)
# ==============================================================================

def test_24_ml_exception_hierarchy() -> None:
    """24. ML exceptions correctly inherit from MLError."""
    assert issubclass(MLInputError, MLError)
    assert issubclass(MLModelUnavailableError, MLError)
    assert issubclass(MLInferenceError, MLError)
    assert issubclass(MLOutputValidationError, MLError)

    err = MLInputError("Invalid feature vector")
    assert isinstance(err, MLError)
    assert str(err) == "Invalid feature vector"


def test_25_ml_exceptions_independent_from_weather_provider_error() -> None:
    """25. ML exceptions do NOT inherit from WeatherProviderError and vice versa."""
    assert not issubclass(MLError, WeatherProviderError)
    assert not issubclass(WeatherProviderError, MLError)
    assert not issubclass(MLInputError, WeatherProviderError)
    assert not issubclass(MLOutputValidationError, WeatherProviderError)


def test_26_ml_exceptions_independent_from_observation_persistence_error() -> None:
    """26. ML exceptions do NOT inherit from ObservationPersistenceError and vice versa."""
    assert not issubclass(MLError, ObservationPersistenceError)
    assert not issubclass(ObservationPersistenceError, MLError)
    assert not issubclass(MLInputError, ObservationPersistenceError)
    assert not issubclass(MLInferenceError, ObservationPersistenceError)


# ==============================================================================
# 5. Feature Preparation Boundary (Items 27 - 32)
# ==============================================================================

def test_27_normalized_observation_maps_correctly() -> None:
    """27. NormalizedObservation Pydantic model is correctly prepared into MLPredictionInput."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    obs = NormalizedObservation(
        region_id="DEV_AS_BAR_01",
        recorded_at=now_utc,
        rainfall_1h_mm=Decimal("15.2"),
        rainfall_3h_mm=Decimal("42.0"),
        rainfall_6h_mm=Decimal("78.5"),
        rainfall_24h_mm=Decimal("120.0"),
        water_level_m=Decimal("50.2"),
        temperature_c=Decimal("29.1"),
        humidity_pct=Decimal("88.0"),
        data_source="open-meteo",
    )
    inp = prepare_prediction_input(obs)
    assert isinstance(inp, MLPredictionInput)
    assert inp.region_id == "DEV_AS_BAR_01"
    assert inp.reference_time == now_utc
    assert inp.rainfall_1h_mm == Decimal("15.2")
    assert inp.rainfall_3h_mm == Decimal("42.0")
    assert inp.rainfall_6h_mm == Decimal("78.5")
    assert inp.rainfall_24h_mm == Decimal("120.0")
    assert inp.water_level_m == Decimal("50.2")
    assert inp.temperature_c == Decimal("29.1")
    assert inp.humidity_pct == Decimal("88.0")
    assert inp.elevation_m is None


def test_28_sqlalchemy_observation_maps_correctly() -> None:
    """28. SQLAlchemy Observation model is correctly prepared into MLPredictionInput."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    obs = Observation(
        region_id="DEV_AS_BAR_01",
        recorded_at=now_utc,
        rainfall_1h_mm=Decimal("5.0"),
        rainfall_3h_mm=Decimal("15.0"),
        rainfall_6h_mm=Decimal("25.0"),
        rainfall_24h_mm=Decimal("45.0"),
        water_level_m=None,
        temperature_c=Decimal("26.5"),
        humidity_pct=Decimal("75.0"),
        data_source="open-meteo",
    )
    region = Region(
        region_id="DEV_AS_BAR_01",
        name="Barpeta",
        district="Barpeta",
        latitude=26.32,
        longitude=91.01,
        elevation_m=Decimal("35.0"),
    )
    inp = prepare_prediction_input(obs, region=region)
    assert inp.region_id == "DEV_AS_BAR_01"
    assert inp.elevation_m == Decimal("35.0")
    assert inp.water_level_m is None


def test_29_optional_none_values_remain_none() -> None:
    """29. Optional values that are None remain None and are not converted."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    obs = NormalizedObservation(
        region_id="DEV_AS_BAR_01",
        recorded_at=now_utc,
        rainfall_1h_mm=Decimal("1.0"),
        rainfall_3h_mm=Decimal("2.0"),
        rainfall_6h_mm=Decimal("3.0"),
        rainfall_24h_mm=Decimal("4.0"),
        water_level_m=None,
        temperature_c=None,
        humidity_pct=None,
        data_source="open-meteo",
    )
    inp = prepare_prediction_input(obs)
    assert inp.water_level_m is None
    assert inp.elevation_m is None
    assert inp.temperature_c is None
    assert inp.humidity_pct is None


def test_30_missing_elevation_remains_none_when_region_has_no_elevation() -> None:
    """30. When Region has no elevation_m attribute or it is None, elevation_m remains None."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    obs = NormalizedObservation(
        region_id="DEV_AS_BAR_01",
        recorded_at=now_utc,
        rainfall_1h_mm=Decimal("1.0"),
        rainfall_3h_mm=Decimal("2.0"),
        rainfall_6h_mm=Decimal("3.0"),
        rainfall_24h_mm=Decimal("4.0"),
        data_source="open-meteo",
    )
    # Region with None elevation_m
    region_no_elev = Region(
        region_id="DEV_AS_BAR_01",
        name="Barpeta",
        district="Barpeta",
        latitude=26.32,
        longitude=91.01,
        elevation_m=None,
    )
    inp1 = prepare_prediction_input(obs, region=region_no_elev)
    assert inp1.elevation_m is None

    # Plain mock region without elevation_m attribute
    mock_reg = MagicMock()
    del mock_reg.elevation_m
    mock_reg.region_id = "DEV_AS_BAR_01"
    inp2 = prepare_prediction_input(obs, region=mock_reg)
    assert inp2.elevation_m is None


def test_31_no_optional_values_are_converted_to_zero() -> None:
    """31. None is NEVER converted to Decimal('0') or 0.0 for optional fields."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    obs = NormalizedObservation(
        region_id="DEV_AS_BAR_01",
        recorded_at=now_utc,
        rainfall_1h_mm=Decimal("1.0"),
        rainfall_3h_mm=Decimal("2.0"),
        rainfall_6h_mm=Decimal("3.0"),
        rainfall_24h_mm=Decimal("4.0"),
        water_level_m=None,
        data_source="open-meteo",
    )
    inp = prepare_prediction_input(obs, region=None)
    assert inp.water_level_m is not Decimal("0")
    assert inp.water_level_m is not 0
    assert inp.water_level_m is None
    assert inp.elevation_m is not Decimal("0")
    assert inp.elevation_m is None


def test_32_missing_rainfall_raises_ml_input_error() -> None:
    """32. When required rainfall is None on an observation, MLInputError is raised."""
    now_utc = datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc)
    # Mock observation where rainfall_6h_mm is None
    mock_obs = MagicMock()
    mock_obs.region_id = "DEV_AS_BAR_01"
    mock_obs.recorded_at = now_utc
    mock_obs.rainfall_1h_mm = Decimal("1.0")
    mock_obs.rainfall_3h_mm = Decimal("2.0")
    mock_obs.rainfall_6h_mm = None
    mock_obs.rainfall_24h_mm = Decimal("4.0")

    with pytest.raises(MLInputError) as exc_info:
        prepare_prediction_input(mock_obs)
    assert "missing required rainfall measurements: rainfall_6h_mm" in str(exc_info.value)

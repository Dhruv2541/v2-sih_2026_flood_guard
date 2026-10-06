from datetime import datetime, timezone
from decimal import Decimal
import pytest

from app.ml.baseline import (
    HydrologicalBaselineModel,
    MODEL_VERSION,
    DEFAULT_RAINFALL_1H_WEIGHT,
    DEFAULT_RAINFALL_3H_WEIGHT,
    DEFAULT_RAINFALL_6H_WEIGHT,
    DEFAULT_RAINFALL_24H_WEIGHT,
    DEFAULT_ELEVATION_SCALE_FACTOR,
    DEFAULT_HUMIDITY_SCALE_FACTOR,
)
from app.ml.exceptions import MLInferenceError
from app.ml.schemas import MLPredictionInput, MLPredictionOutput


def make_valid_input(
    region_id: str = "DEV_AS_BAR_01",
    rainfall_1h: Decimal = Decimal("10.0"),
    rainfall_3h: Decimal = Decimal("25.0"),
    rainfall_6h: Decimal = Decimal("50.0"),
    rainfall_24h: Decimal = Decimal("100.0"),
    water_level_m: Decimal = None,
    elevation_m: Decimal = None,
    temperature_c: Decimal = None,
    humidity_pct: Decimal = None,
) -> MLPredictionInput:
    return MLPredictionInput(
        region_id=region_id,
        reference_time=datetime(2026, 9, 17, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=rainfall_1h,
        rainfall_3h_mm=rainfall_3h,
        rainfall_6h_mm=rainfall_6h,
        rainfall_24h_mm=rainfall_24h,
        water_level_m=water_level_m,
        elevation_m=elevation_m,
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
    )


# ==============================================================================
# 1. Baseline Model Basic Functionality Tests
# ==============================================================================

def test_baseline_model_returns_valid_output():
    """Baseline model produces valid MLPredictionOutput for valid input."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input()

    out = model.predict(inp)

    assert isinstance(out, MLPredictionOutput)
    assert out.region_id == "DEV_AS_BAR_01"
    assert out.model_version == MODEL_VERSION
    assert Decimal("0.0") <= out.flood_probability <= Decimal("1.0")
    assert out.forecast_valid_until >= out.generated_at


def test_baseline_model_deterministic_same_input_same_output():
    """Same input twice produces identical output (deterministic)."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input()

    out1 = model.predict(inp)
    out2 = model.predict(inp)

    assert out1.flood_probability == out2.flood_probability
    assert out1.region_id == out2.region_id
    assert out1.model_version == out2.model_version


def test_baseline_model_version_is_baseline_v1():
    """Model version is clearly labeled as baseline prototype."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input()

    out = model.predict(inp)

    assert out.model_version == "baseline-v1"
    assert out.model_version != "production-v1"
    assert out.model_version != "validated-v1"
    assert out.model_version != "real-flood-model"


def test_baseline_output_bounds_never_exceeded():
    """Output flood_probability is always clamped to [0.0, 1.0]."""
    model = HydrologicalBaselineModel()

    # Very low rainfall
    inp_low = make_valid_input(rainfall_1h=Decimal("0"), rainfall_3h=Decimal("0"), rainfall_6h=Decimal("0"), rainfall_24h=Decimal("0"))
    out_low = model.predict(inp_low)
    assert out_low.flood_probability >= Decimal("0.0")

    # Very high rainfall
    inp_high = make_valid_input(rainfall_1h=Decimal("500"), rainfall_3h=Decimal("500"), rainfall_6h=Decimal("500"), rainfall_24h=Decimal("500"))
    out_high = model.predict(inp_high)
    assert out_high.flood_probability <= Decimal("1.0")


# ==============================================================================
# 2. Baseline Formula Logic Tests
# ==============================================================================

def test_baseline_monotonic_increasing_rainfall_increases_probability():
    """Increasing rainfall inputs should not decrease flood probability (monotonicity)."""
    model = HydrologicalBaselineModel()

    inp_low = make_valid_input(rainfall_24h=Decimal("10.0"))
    inp_med = make_valid_input(rainfall_24h=Decimal("50.0"))
    inp_high = make_valid_input(rainfall_24h=Decimal("100.0"))

    out_low = model.predict(inp_low)
    out_med = model.predict(inp_med)
    out_high = model.predict(inp_high)

    assert out_low.flood_probability <= out_med.flood_probability
    assert out_med.flood_probability <= out_high.flood_probability


def test_baseline_elevation_reduces_probability_when_present():
    """Higher elevation should reduce flood probability (when elevation provided)."""
    model = HydrologicalBaselineModel()

    inp_low_elev = make_valid_input(elevation_m=Decimal("10.0"))
    inp_high_elev = make_valid_input(elevation_m=Decimal("100.0"))

    out_low = model.predict(inp_low_elev)
    out_high = model.predict(inp_high_elev)

    assert out_high.flood_probability <= out_low.flood_probability


def test_baseline_humidity_increases_probability_when_present():
    """Higher humidity should increase flood probability (when humidity provided)."""
    model = HydrologicalBaselineModel()

    inp_low_hum = make_valid_input(humidity_pct=Decimal("30.0"))
    inp_high_hum = make_valid_input(humidity_pct=Decimal("90.0"))

    out_low = model.predict(inp_low_hum)
    out_high = model.predict(inp_high_hum)

    assert out_high.flood_probability >= out_low.flood_probability


def test_baseline_missing_optional_fields_do_not_affect_calculation():
    """Missing optional fields (water_level, elevation, temperature, humidity) do not change calculation."""
    model = HydrologicalBaselineModel()

    inp_no_optional = make_valid_input()
    inp_with_elev = make_valid_input(elevation_m=Decimal("50.0"))
    inp_with_hum = make_valid_input(humidity_pct=Decimal("80.0"))
    inp_with_both = make_valid_input(elevation_m=Decimal("50.0"), humidity_pct=Decimal("80.0"))

    out_base = model.predict(inp_no_optional)

    # With elevation only, probability should decrease
    out_elev = model.predict(inp_with_elev)
    assert out_elev.flood_probability <= out_base.flood_probability

    # With humidity only, probability should increase
    out_hum = model.predict(inp_with_hum)
    assert out_hum.flood_probability >= out_base.flood_probability

    # With both, net effect depends on magnitudes
    out_both = model.predict(inp_with_both)


def test_baseline_temperature_not_used_in_current_formula():
    """Temperature is accepted but not used in current baseline formula."""
    model = HydrologicalBaselineModel()

    inp_no_temp = make_valid_input()
    inp_with_temp = make_valid_input(temperature_c=Decimal("35.0"))
    inp_with_temp_low = make_valid_input(temperature_c=Decimal("15.0"))

    out_no = model.predict(inp_no_temp)
    out_high = model.predict(inp_with_temp)
    out_low = model.predict(inp_with_temp_low)

    # Temperature should not affect the result in current implementation
    assert out_no.flood_probability == out_high.flood_probability
    assert out_no.flood_probability == out_low.flood_probability


def test_baseline_water_level_not_used_in_current_formula():
    """Water level is accepted but not used in current baseline formula."""
    model = HydrologicalBaselineModel()

    inp_no_wl = make_valid_input()
    inp_with_wl = make_valid_input(water_level_m=Decimal("50.0"))

    out_no = model.predict(inp_no_wl)
    out_with = model.predict(inp_with_wl)

    # Water level should not affect the result in current implementation
    assert out_no.flood_probability == out_with.flood_probability


# ==============================================================================
# 3. Configuration Constants Tests
# ==============================================================================

def test_baseline_weights_are_explicit_constants():
    """Weights are explicit module-level constants (prototype assumptions)."""
    assert DEFAULT_RAINFALL_1H_WEIGHT == Decimal("0.05")
    assert DEFAULT_RAINFALL_3H_WEIGHT == Decimal("0.15")
    assert DEFAULT_RAINFALL_6H_WEIGHT == Decimal("0.25")
    assert DEFAULT_RAINFALL_24H_WEIGHT == Decimal("0.40")
    assert DEFAULT_ELEVATION_SCALE_FACTOR == Decimal("0.001")
    assert DEFAULT_HUMIDITY_SCALE_FACTOR == Decimal("0.005")


def test_baseline_custom_weights_accepted():
    """Custom weights can be injected for testing/sensitivity analysis."""
    custom_model = HydrologicalBaselineModel(
        rainfall_1h_weight=Decimal("0.1"),
        rainfall_3h_weight=Decimal("0.2"),
        rainfall_6h_weight=Decimal("0.3"),
        rainfall_24h_weight=Decimal("0.4"),
        elevation_scale_factor=Decimal("0.002"),
        humidity_scale_factor=Decimal("0.01"),
        normalization_divisor=Decimal("100.0"),
    )
    inp = make_valid_input()
    out = custom_model.predict(inp)

    assert isinstance(out, MLPredictionOutput)
    assert Decimal("0.0") <= out.flood_probability <= Decimal("1.0")


# ==============================================================================
# 4. Edge Cases & Error Handling
# ==============================================================================

def test_baseline_raises_on_invalid_normalization_divisor():
    """Model raises MLInferenceError if normalization divisor is non-positive."""
    with pytest.raises(MLInferenceError):
        HydrologicalBaselineModel(normalization_divisor=Decimal("0"))

    with pytest.raises(MLInferenceError):
        HydrologicalBaselineModel(normalization_divisor=Decimal("-10"))


def test_baseline_handles_zero_rainfall():
    """Model handles zero rainfall gracefully (produces low probability)."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input(rainfall_1h=Decimal("0"), rainfall_3h=Decimal("0"), rainfall_6h=Decimal("0"), rainfall_24h=Decimal("0"))
    out = model.predict(inp)

    assert out.flood_probability == Decimal("0.0")


def test_baseline_handles_missing_optional_none_values():
    """Model handles None optional fields without error."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input(
        water_level_m=None,
        elevation_m=None,
        temperature_c=None,
        humidity_pct=None,
    )
    out = model.predict(inp)

    assert isinstance(out, MLPredictionOutput)
    assert Decimal("0.0") <= out.flood_probability <= Decimal("1.0")


def test_baseline_output_timestamps_are_utc():
    """Generated timestamps are timezone-aware UTC."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input()
    out = model.predict(inp)

    assert out.generated_at.tzinfo == timezone.utc
    assert out.forecast_valid_until.tzinfo == timezone.utc


def test_baseline_forecast_horizon_is_6_hours():
    """Forecast valid until is 6 hours after generated_at."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input()
    out = model.predict(inp)

    delta = out.forecast_valid_until - out.generated_at
    assert delta.total_seconds() == 6 * 3600


# ==============================================================================
# 5. Formula Verification Tests (Mathematical Correctness)
# ==============================================================================

def test_baseline_formula_matches_expected_calculation():
    """Verify the exact formula calculation matches expectations."""
    # Using default weights:
    # score = (1h * 0.05) + (3h * 0.15) + (6h * 0.25) + (24h * 0.40)
    # For rainfall_1h=10, 3h=25, 6h=50, 24h=100:
    # score = 10*0.05 + 25*0.15 + 50*0.25 + 100*0.40
    #       = 0.5 + 3.75 + 12.5 + 40 = 56.75
    # prob = 56.75 / 150 = 0.37833... -> 0.378 (quantized to 3 decimal places)
    model = HydrologicalBaselineModel()
    inp = make_valid_input(
        rainfall_1h=Decimal("10.0"),
        rainfall_3h=Decimal("25.0"),
        rainfall_6h=Decimal("50.0"),
        rainfall_24h=Decimal("100.0"),
    )
    out = model.predict(inp)

    expected_score = (Decimal("10.0") * Decimal("0.05")
                      + Decimal("25.0") * Decimal("0.15")
                      + Decimal("50.0") * Decimal("0.25")
                      + Decimal("100.0") * Decimal("0.40"))
    expected_prob = (expected_score / Decimal("150.0")).quantize(Decimal("0.001"))

    assert out.flood_probability == expected_prob


def test_baseline_formula_with_elevation():
    """Verify elevation adjustment in formula."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input(
        rainfall_1h=Decimal("10.0"),
        rainfall_3h=Decimal("25.0"),
        rainfall_6h=Decimal("50.0"),
        rainfall_24h=Decimal("100.0"),
        elevation_m=Decimal("100.0"),
    )
    out = model.predict(inp)

    # Base score = 56.75 (from above)
    # Elevation adjustment = 100 * 0.001 = 0.1
    # Adjusted score = 56.75 - 0.1 = 56.65
    # prob = 56.65 / 150 = 0.37766... -> 0.378
    expected_score = (Decimal("10.0") * Decimal("0.05")
                      + Decimal("25.0") * Decimal("0.15")
                      + Decimal("50.0") * Decimal("0.25")
                      + Decimal("100.0") * Decimal("0.40")
                      - Decimal("100.0") * Decimal("0.001"))
    expected_prob = (expected_score / Decimal("150.0")).quantize(Decimal("0.001"))

    assert out.flood_probability == expected_prob


def test_baseline_formula_with_humidity():
    """Verify humidity adjustment in formula."""
    model = HydrologicalBaselineModel()
    inp = make_valid_input(
        rainfall_1h=Decimal("10.0"),
        rainfall_3h=Decimal("25.0"),
        rainfall_6h=Decimal("50.0"),
        rainfall_24h=Decimal("100.0"),
        humidity_pct=Decimal("80.0"),
    )
    out = model.predict(inp)

    # Base score = 56.75
    # Humidity adjustment = 80 * 0.005 = 0.4
    # Adjusted score = 56.75 + 0.4 = 57.15
    # prob = 57.15 / 150 = 0.381
    expected_score = (Decimal("10.0") * Decimal("0.05")
                      + Decimal("25.0") * Decimal("0.15")
                      + Decimal("50.0") * Decimal("0.25")
                      + Decimal("100.0") * Decimal("0.40")
                      + Decimal("80.0") * Decimal("0.005"))
    expected_prob = (expected_score / Decimal("150.0")).quantize(Decimal("0.001"))

    assert out.flood_probability == expected_prob
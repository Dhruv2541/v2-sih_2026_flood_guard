from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pytest
from pydantic import ValidationError

from app.data.exceptions import (
    WeatherProviderError,
    ProviderUnavailableError,
    ProviderTimeoutError,
    ProviderResponseError,
    ProviderPartialDataError,
    ProviderNoDataError,
    ProviderRateLimitError,
)
from app.data.schemas import NormalizedObservation
from app.data.providers.open_meteo import OpenMeteoProvider


# ==============================================================================
# 1. NORMALIZED OBSERVATION SCHEMA TESTS (Deterministic Invariant Tests)
# ==============================================================================


def test_normalized_observation_valid_full():
    """Confirms that a fully populated NormalizedObservation passes validation."""
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    obs = NormalizedObservation(
        region_id="DEV_AS_BAR_01",
        recorded_at=now,
        rainfall_1h_mm=Decimal("5.20"),
        rainfall_3h_mm=Decimal("12.40"),
        rainfall_6h_mm=Decimal("25.00"),
        rainfall_24h_mm=Decimal("80.50"),
        water_level_m=Decimal("45.2"),
        temperature_c=Decimal("29.5"),
        humidity_pct=Decimal("84.0"),
        data_source="open-meteo",
    )
    assert obs.region_id == "DEV_AS_BAR_01"
    assert obs.recorded_at == now
    assert obs.rainfall_1h_mm == Decimal("5.20")
    assert obs.rainfall_24h_mm == Decimal("80.50")
    assert obs.water_level_m == Decimal("45.2")
    assert obs.temperature_c == Decimal("29.5")
    assert obs.humidity_pct == Decimal("84.0")
    assert obs.data_source == "open-meteo"


def test_normalized_observation_optional_fields_as_none():
    """Validates that optional environmental fields (temp, humidity, water level) accept None."""
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    obs = NormalizedObservation(
        region_id="DEV_AS_DHU_01",
        recorded_at=now,
        rainfall_1h_mm=Decimal("0.0"),
        rainfall_3h_mm=Decimal("0.0"),
        rainfall_6h_mm=Decimal("0.0"),
        rainfall_24h_mm=Decimal("0.0"),
        water_level_m=None,
        temperature_c=None,
        humidity_pct=None,
        data_source="open-meteo",
    )
    assert obs.water_level_m is None
    assert obs.temperature_c is None
    assert obs.humidity_pct is None


def test_normalized_observation_negative_rainfall_fails():
    """Validates that negative rainfall values trigger a validation error."""
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError) as exc_info:
        NormalizedObservation(
            region_id="DEV_AS_BAR_01",
            recorded_at=now,
            rainfall_1h_mm=Decimal("-0.01"),  # Invalid negative
            rainfall_3h_mm=Decimal("0.0"),
            rainfall_6h_mm=Decimal("0.0"),
            rainfall_24h_mm=Decimal("0.0"),
            data_source="open-meteo",
        )
    assert "rainfall_1h_mm" in str(exc_info.value)


def test_normalized_observation_humidity_bounds_fail():
    """Validates that humidity < 0.0 or > 100.0 triggers a validation error."""
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    # Below 0
    with pytest.raises(ValidationError):
        NormalizedObservation(
            region_id="DEV_AS_BAR_01",
            recorded_at=now,
            rainfall_1h_mm=Decimal("0.0"),
            rainfall_3h_mm=Decimal("0.0"),
            rainfall_6h_mm=Decimal("0.0"),
            rainfall_24h_mm=Decimal("0.0"),
            humidity_pct=Decimal("-0.1"),
            data_source="open-meteo",
        )
    # Above 100
    with pytest.raises(ValidationError):
        NormalizedObservation(
            region_id="DEV_AS_BAR_01",
            recorded_at=now,
            rainfall_1h_mm=Decimal("0.0"),
            rainfall_3h_mm=Decimal("0.0"),
            rainfall_6h_mm=Decimal("0.0"),
            rainfall_24h_mm=Decimal("0.0"),
            humidity_pct=Decimal("100.1"),
            data_source="open-meteo",
        )


def test_normalized_observation_naive_timestamp_rejected():
    """Validates that naive datetime timestamps are rejected (timezone awareness is strictly enforced)."""
    naive_dt = datetime(2026, 9, 15, 12, 0)  # No tzinfo
    with pytest.raises(ValidationError) as exc_info:
        NormalizedObservation(
            region_id="DEV_AS_BAR_01",
            recorded_at=naive_dt,
            rainfall_1h_mm=Decimal("0.0"),
            rainfall_3h_mm=Decimal("0.0"),
            rainfall_6h_mm=Decimal("0.0"),
            rainfall_24h_mm=Decimal("0.0"),
            data_source="open-meteo",
        )
    assert "timezone-aware" in str(exc_info.value)


def test_normalized_observation_extra_fields_forbidden():
    """Validates that provider-specific extra fields cannot leak into the domain schema."""
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    with pytest.raises(ValidationError):
        NormalizedObservation(
            region_id="DEV_AS_BAR_01",
            recorded_at=now,
            rainfall_1h_mm=Decimal("0.0"),
            rainfall_3h_mm=Decimal("0.0"),
            rainfall_6h_mm=Decimal("0.0"),
            rainfall_24h_mm=Decimal("0.0"),
            data_source="open-meteo",
            hourly_precipitation_leak=[1.0, 2.0],  # Extra forbidden field
        )


# ==============================================================================
# 2. STRUCTURED PROVIDER ERROR HIERARCHY TESTS
# ==============================================================================


def test_weather_provider_error_hierarchy():
    """Verifies that all structured provider exceptions correctly inherit from WeatherProviderError."""
    assert issubclass(ProviderUnavailableError, WeatherProviderError)
    assert issubclass(ProviderTimeoutError, WeatherProviderError)
    assert issubclass(ProviderResponseError, WeatherProviderError)
    assert issubclass(ProviderPartialDataError, WeatherProviderError)
    assert issubclass(ProviderNoDataError, WeatherProviderError)
    assert issubclass(ProviderRateLimitError, WeatherProviderError)

    err = ProviderPartialDataError("Missing required precipitation history", provider="open-meteo")
    assert str(err) == "[open-meteo] Missing required precipitation history"
    assert err.provider == "open-meteo"


# ==============================================================================
# 3. OPEN-METEO COMPLETED HOURLY INTERVAL ALIGNMENT & ROLLING RAINFALL TESTS
# ==============================================================================


def _build_mock_open_meteo_payload(
    start_hour: datetime,
    hours_count: int,
    base_precipitation: float = 1.0,
    precipitation_pattern: list = None,
    temperatures: list = None,
    humidities: list = None,
) -> dict:
    """Helper generating synthetic hourly Open-Meteo JSON payload."""
    times = []
    precips = []
    temps = []
    hums = []

    for i in range(hours_count):
        t = start_hour + timedelta(hours=i)
        times.append(t.strftime("%Y-%m-%dT%H:00"))
        if precipitation_pattern and i < len(precipitation_pattern):
            precips.append(precipitation_pattern[i])
        else:
            precips.append(base_precipitation)
        temps.append(temperatures[i] if temperatures and i < len(temperatures) else 25.0)
        hums.append(humidities[i] if humidities and i < len(humidities) else 80.0)

    return {
        "latitude": 26.32,
        "longitude": 91.01,
        "utc_offset_seconds": 0,
        "timezone": "UTC",
        "hourly": {
            "time": times,
            "precipitation": precips,
            "temperature_2m": temps,
            "relative_humidity_2m": hums,
        },
    }


def test_open_meteo_a_to_e_exact_completed_interval_accumulations():
    """Tests A, B, C, D, E:
    - 24 correctly aligned hourly values.
    - Latest completed interval is selected correctly.
    - 1h, 3h, 6h, and 24h sums use exact completed intervals.
    """
    provider = OpenMeteoProvider()
    base_start = datetime(2026, 9, 14, 13, 0, tzinfo=timezone.utc)
    # 24 hours of data ending at 2026-09-15 12:00 UTC
    # Set known precipitation values: each hour = 2.0 mm
    payload = _build_mock_open_meteo_payload(
        start_hour=base_start,
        hours_count=24,
        base_precipitation=2.0,
    )

    ref_time = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    obs = provider.parse_and_normalize(
        region_id="DEV_AS_BAR_01",
        payload=payload,
        observation_time=ref_time,
    )

    # Test B: Latest completed hourly interval is 12:00
    assert obs.recorded_at == ref_time
    # Test A & 1h: 1 * 2.0 = 2.0
    assert obs.rainfall_1h_mm == Decimal("2.0")
    # Test C: 3h sum = 3 * 2.0 = 6.0
    assert obs.rainfall_3h_mm == Decimal("6.0")
    # Test D: 6h sum = 6 * 2.0 = 12.0
    assert obs.rainfall_6h_mm == Decimal("12.0")
    # Test E: 24h sum = 24 * 2.0 = 48.0
    assert obs.rainfall_24h_mm == Decimal("48.0")


def test_open_meteo_f_future_uncompleted_intervals_strictly_excluded():
    """Test F: Verifies that future/uncompleted intervals are NOT accidentally included.
    Provides 36 hours of data (past 24h + next 12h forecast with heavy 100mm rain).
    Asserts rolling rainfall calculates strictly from the completed historical intervals <= ref_time.
    """
    provider = OpenMeteoProvider()
    base_start = datetime(2026, 9, 14, 13, 0, tzinfo=timezone.utc)
    # Create 36 hours: first 24 hours = 1.0mm, next 12 hours (forecast future) = 100.0mm!
    pattern = [1.0] * 24 + [100.0] * 12
    payload = _build_mock_open_meteo_payload(
        start_hour=base_start,
        hours_count=36,
        precipitation_pattern=pattern,
    )

    # Observation reference time: exactly at hour 24 (2026-09-15 12:00 UTC)
    ref_time = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    obs = provider.parse_and_normalize(
        region_id="DEV_AS_BAR_01",
        payload=payload,
        observation_time=ref_time,
    )

    # Recorded at should strictly be the latest completed interval (12:00), NOT future intervals
    assert obs.recorded_at == ref_time
    # Must NOT include the future 100.0 mm precipitation
    assert obs.rainfall_1h_mm == Decimal("1.0")
    assert obs.rainfall_3h_mm == Decimal("3.0")
    assert obs.rainfall_6h_mm == Decimal("6.0")
    assert obs.rainfall_24h_mm == Decimal("24.0")


def test_open_meteo_g_insufficient_completed_hours_raises_partial_data():
    """Test G: Fewer than 24 completed hourly intervals causes ProviderPartialDataError."""
    provider = OpenMeteoProvider()
    base_start = datetime(2026, 9, 15, 0, 0, tzinfo=timezone.utc)
    # Only 10 hours of data
    payload = _build_mock_open_meteo_payload(
        start_hour=base_start,
        hours_count=10,
        base_precipitation=1.0,
    )

    with pytest.raises(ProviderPartialDataError) as exc_info:
        provider.parse_and_normalize(
            region_id="DEV_AS_BAR_01",
            payload=payload,
            observation_time=datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc),
        )
    assert "Insufficient completed hourly intervals" in str(exc_info.value)


def test_open_meteo_g_null_precipitation_in_required_window_raises_partial_data():
    """Test G: Null precipitation value within the required completed window raises ProviderPartialDataError."""
    provider = OpenMeteoProvider()
    base_start = datetime(2026, 9, 14, 13, 0, tzinfo=timezone.utc)
    pattern = [1.0] * 23 + [None]  # Last completed hour has None
    payload = _build_mock_open_meteo_payload(
        start_hour=base_start,
        hours_count=24,
        precipitation_pattern=pattern,
    )

    with pytest.raises(ProviderPartialDataError) as exc_info:
        provider.parse_and_normalize(
            region_id="DEV_AS_BAR_01",
            payload=payload,
            observation_time=datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc),
        )
    assert "missing (null)" in str(exc_info.value)


def test_open_meteo_optional_temperature_and_humidity_null_accepted():
    """Verifies that missing temperature or humidity in Open-Meteo payload maps to None."""
    provider = OpenMeteoProvider()
    base_start = datetime(2026, 9, 14, 13, 0, tzinfo=timezone.utc)
    payload = _build_mock_open_meteo_payload(
        start_hour=base_start,
        hours_count=24,
        base_precipitation=1.5,
        temperatures=[None] * 24,
        humidities=[None] * 24,
    )

    obs = provider.parse_and_normalize(
        region_id="DEV_AS_BAR_01",
        payload=payload,
        observation_time=datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc),
    )
    assert obs.temperature_c is None
    assert obs.humidity_pct is None
    assert obs.water_level_m is None
    assert obs.rainfall_1h_mm == Decimal("1.5")


@pytest.mark.anyio
async def test_open_meteo_fetch_current_observation_contract():
    """Confirms fetch_current_observation is implemented as an async coroutine returning NormalizedObservation."""
    import httpx
    payload = _build_mock_open_meteo_payload(
        start_hour=datetime(2026, 9, 14, 13, 0, tzinfo=timezone.utc),
        hours_count=24,
        base_precipitation=1.0,
    )

    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        obs = await provider.fetch_current_observation("DEV_AS_BAR_01", 26.32, 91.01)
        assert isinstance(obs, NormalizedObservation)
        assert obs.region_id == "DEV_AS_BAR_01"
        assert obs.rainfall_1h_mm == Decimal("1.0")


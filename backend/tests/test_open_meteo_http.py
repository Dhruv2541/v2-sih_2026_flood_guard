import json
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pytest
import httpx

from app.data.exceptions import (
    ProviderNoDataError,
    ProviderPartialDataError,
    ProviderRateLimitError,
    ProviderResponseError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.data.providers.open_meteo import OpenMeteoProvider
from app.data.schemas import NormalizedObservation


def _make_sample_payload(
    hours_count: int = 24,
    base_precipitation: float = 2.5,
    precipitation_pattern: list = None,
) -> dict:
    """Generates synthetic hourly Open-Meteo response dictionary."""
    base_time = datetime(2026, 9, 14, 13, 0, tzinfo=timezone.utc)
    times = []
    precips = []
    temps = []
    hums = []

    for i in range(hours_count):
        t = base_time + timedelta(hours=i)
        times.append(t.strftime("%Y-%m-%dT%H:00"))
        if precipitation_pattern and i < len(precipitation_pattern):
            precips.append(precipitation_pattern[i])
        else:
            precips.append(base_precipitation)
        temps.append(28.0)
        hums.append(85.0)

    return {
        "latitude": 26.3245,
        "longitude": 91.0082,
        "timezone": "UTC",
        "hourly": {
            "time": times,
            "precipitation": precips,
            "temperature_2m": temps,
            "relative_humidity_2m": hums,
        },
    }


# ==============================================================================
# HTTP CLIENT CONTRACT TESTS (Deterministic MockTransport Tests)
# ==============================================================================


@pytest.mark.anyio
async def test_http_request_parameters_and_url():
    """Tests A, B, C, D, E, F:
    - HTTP method is GET
    - Correct URL is queried
    - Query parameters: latitude, longitude, hourly, past_hours=24, timezone=UTC
    - temperature_2m, relative_humidity_2m, precipitation requested
    """
    captured_request = None

    def mock_handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_request
        captured_request = request
        return httpx.Response(200, json=_make_sample_payload())

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        obs = await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)

    assert captured_request is not None
    assert captured_request.method == "GET"
    assert captured_request.url.path == "/v1/forecast"
    params = captured_request.url.params
    assert params["latitude"] == "26.3245"
    assert params["longitude"] == "91.0082"
    assert params["past_hours"] == "24"
    assert params["timezone"] == "UTC"
    assert "temperature_2m" in params["hourly"]
    assert "relative_humidity_2m" in params["hourly"]
    assert "precipitation" in params["hourly"]
    assert isinstance(obs, NormalizedObservation)


@pytest.mark.anyio
async def test_http_200_successful_normalization_and_accumulations():
    """Tests G, H, Q:
    - Successful HTTP 200 response passes through normalizer
    - Produces a valid NormalizedObservation
    - Preserves completed-hour rolling rainfall sums
    """
    payload = _make_sample_payload(hours_count=24, base_precipitation=3.0)

    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        obs = await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)

    assert obs.region_id == "DEV_AS_BAR_01"
    assert obs.data_source == "open-meteo"
    assert obs.rainfall_1h_mm == Decimal("3.0")
    assert obs.rainfall_3h_mm == Decimal("9.0")
    assert obs.rainfall_6h_mm == Decimal("18.0")
    assert obs.rainfall_24h_mm == Decimal("72.0")
    assert obs.temperature_c == Decimal("28.0")
    assert obs.humidity_pct == Decimal("85.0")
    assert obs.water_level_m is None
    assert obs.recorded_at.tzinfo == timezone.utc


@pytest.mark.anyio
async def test_http_429_rate_limit_error():
    """Test I: HTTP 429 raises ProviderRateLimitError."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, text="Too Many Requests")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderRateLimitError) as exc_info:
            await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)
    assert "rate limit" in str(exc_info.value).lower()


@pytest.mark.anyio
async def test_http_5xx_server_error():
    """Test J: HTTP 500/503 raises ProviderUnavailableError."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="Service Unavailable")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderUnavailableError) as exc_info:
            await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)
    assert "503" in str(exc_info.value)


@pytest.mark.anyio
async def test_http_timeout_error():
    """Test K: Timeout raises ProviderTimeoutError."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Connection timed out")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderTimeoutError) as exc_info:
            await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)
    assert "timed out" in str(exc_info.value).lower()


@pytest.mark.anyio
async def test_http_network_connection_failure():
    """Test L: Connection/DNS failure raises ProviderUnavailableError."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Failed to resolve host")

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderUnavailableError) as exc_info:
            await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)
    assert "unreachable" in str(exc_info.value).lower()


@pytest.mark.anyio
async def test_http_malformed_json_response():
    """Test M: Non-JSON response raises ProviderResponseError."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="<HTML>Not Found</HTML>", headers={"Content-Type": "text/html"})

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderResponseError) as exc_info:
            await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)
    assert "JSON" in str(exc_info.value)


@pytest.mark.anyio
async def test_http_missing_hourly_structure():
    """Test N: Missing 'hourly' object raises ProviderResponseError."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"latitude": 26.32, "longitude": 91.01})

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderResponseError):
            await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)


@pytest.mark.anyio
async def test_http_no_usable_hourly_data():
    """Test O: Empty hourly arrays or provider error flag raises ProviderNoDataError."""
    # Subcase 1: Provider returned error=True
    def mock_handler_err(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"error": True, "reason": "No coordinates data"})

    transport1 = httpx.MockTransport(mock_handler_err)
    async with httpx.AsyncClient(transport=transport1) as client:
        provider1 = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderNoDataError) as exc_info:
            await provider1.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)
    assert "No data returned" in str(exc_info.value)

    # Subcase 2: Empty hourly arrays
    def mock_handler_empty(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"hourly": {"time": [], "precipitation": []}})

    transport2 = httpx.MockTransport(mock_handler_empty)
    async with httpx.AsyncClient(transport=transport2) as client:
        provider2 = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderNoDataError) as exc_info2:
            await provider2.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)
    assert "No hourly weather data" in str(exc_info2.value)


@pytest.mark.anyio
async def test_http_partial_rainfall_data_raises_partial_data_error():
    """Test P: Incomplete rainfall window in response raises ProviderPartialDataError."""
    # Only 12 hours returned instead of required 24
    payload = _make_sample_payload(hours_count=12)

    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = OpenMeteoProvider(client=client)
        with pytest.raises(ProviderPartialDataError):
            await provider.fetch_current_observation("DEV_AS_BAR_01", 26.3245, 91.0082)


@pytest.mark.anyio
async def test_input_validation():
    """Test input validation: non-empty region_id, numeric coordinates."""
    provider = OpenMeteoProvider()
    with pytest.raises(ValueError):
        await provider.fetch_current_observation("", 26.32, 91.01)

    with pytest.raises(ValueError):
        await provider.fetch_current_observation("DEV_AS_BAR_01", "invalid_lat", 91.01)

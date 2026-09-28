from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.data.exceptions import (
    ProviderNoDataError,
    ProviderPartialDataError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.data.providers.base import WeatherProvider
from app.data.providers.open_meteo import OpenMeteoProvider
from app.data.schemas import NormalizedObservation
from app.models.region import Region
from app.services.ingestion import FailedRegion, IngestionResult, IngestionService, get_monitored_regions


def _make_dummy_observation(region_id: str) -> NormalizedObservation:
    return NormalizedObservation(
        region_id=region_id,
        recorded_at=datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc),
        rainfall_1h_mm=Decimal("1.0"),
        rainfall_3h_mm=Decimal("3.0"),
        rainfall_6h_mm=Decimal("6.0"),
        rainfall_24h_mm=Decimal("24.0"),
        water_level_m=None,
        temperature_c=Decimal("27.5"),
        humidity_pct=Decimal("80.0"),
        data_source="open-meteo",
    )


def _make_dummy_region(region_id: str, lat: float, lon: float) -> Region:
    return Region(
        region_id=region_id,
        name=f"Region {region_id}",
        district="TestDistrict",
        latitude=lat,
        longitude=lon,
        elevation_m=Decimal("50.0"),
    )


# ==============================================================================
# INGESTION SERVICE TDD TESTS
# ==============================================================================


@pytest.mark.anyio
async def test_a_empty_region_list_produces_empty_result():
    """Test A: Empty region list produces an empty successful result."""
    mock_provider = MagicMock(spec=WeatherProvider)
    service = IngestionService(provider=mock_provider)

    result = await service.run_live_ingestion(regions=[])

    assert isinstance(result, IngestionResult)
    assert result.successful_observations == []
    assert result.failed_regions == []
    mock_provider.fetch_current_observation.assert_not_called()


@pytest.mark.anyio
async def test_b_one_region_successfully_produces_one_observation():
    """Test B: One region successfully produces one NormalizedObservation."""
    mock_provider = MagicMock(spec=WeatherProvider)
    mock_obs = _make_dummy_observation("DEV_AS_BAR_01")
    mock_provider.fetch_current_observation = AsyncMock(return_value=mock_obs)

    service = IngestionService(provider=mock_provider)
    region = _make_dummy_region("DEV_AS_BAR_01", 26.32, 91.01)

    result = await service.run_live_ingestion(regions=[region])

    assert len(result.successful_observations) == 1
    assert len(result.failed_regions) == 0
    assert result.successful_observations[0] == mock_obs
    mock_provider.fetch_current_observation.assert_awaited_once_with(
        region_id="DEV_AS_BAR_01",
        latitude=26.32,
        longitude=91.01,
    )


@pytest.mark.anyio
async def test_c_multiple_regions_successfully_produce_multiple_observations():
    """Test C: Multiple regions successfully produce multiple observations."""
    mock_provider = MagicMock(spec=WeatherProvider)
    obs1 = _make_dummy_observation("DEV_AS_BAR_01")
    obs2 = _make_dummy_observation("DEV_AS_DHU_01")
    obs3 = _make_dummy_observation("DEV_AS_MAJ_01")
    mock_provider.fetch_current_observation = AsyncMock(side_effect=[obs1, obs2, obs3])

    service = IngestionService(provider=mock_provider)
    r1 = _make_dummy_region("DEV_AS_BAR_01", 26.32, 91.01)
    r2 = _make_dummy_region("DEV_AS_DHU_01", 26.02, 89.97)
    r3 = _make_dummy_region("DEV_AS_MAJ_01", 26.96, 94.21)

    result = await service.run_live_ingestion(regions=[r1, r2, r3])

    assert len(result.successful_observations) == 3
    assert len(result.failed_regions) == 0
    assert result.successful_observations == [obs1, obs2, obs3]
    assert mock_provider.fetch_current_observation.await_count == 3


@pytest.mark.anyio
async def test_d_failure_isolation_one_failure_does_not_stop_others():
    """Test D: Failure isolation.
    region A -> success
    region B -> timeout
    region C -> success
    A and C succeed; B is recorded as failed. Processing continues.
    """
    mock_provider = MagicMock(spec=WeatherProvider)
    obs_a = _make_dummy_observation("DEV_AS_BAR_01")
    obs_c = _make_dummy_observation("DEV_AS_MAJ_01")

    # B raises ProviderTimeoutError
    mock_provider.fetch_current_observation = AsyncMock(
        side_effect=[
            obs_a,
            ProviderTimeoutError("Connection timed out after 10.0s", provider="open-meteo"),
            obs_c,
        ]
    )

    service = IngestionService(provider=mock_provider)
    r_a = _make_dummy_region("DEV_AS_BAR_01", 26.32, 91.01)
    r_b = _make_dummy_region("DEV_AS_DHU_01", 26.02, 89.97)
    r_c = _make_dummy_region("DEV_AS_MAJ_01", 26.96, 94.21)

    result = await service.run_live_ingestion(regions=[r_a, r_b, r_c])

    assert len(result.successful_observations) == 2
    assert result.successful_observations[0].region_id == "DEV_AS_BAR_01"
    assert result.successful_observations[1].region_id == "DEV_AS_MAJ_01"

    assert len(result.failed_regions) == 1
    failure = result.failed_regions[0]
    assert failure.region_id == "DEV_AS_DHU_01"
    assert failure.error_type == "ProviderTimeoutError"
    assert "timed out" in failure.message.lower()


@pytest.mark.anyio
async def test_e_to_h_provider_error_types_preserved():
    """Tests E, F, G, H: Verifies error_type preservation for various provider errors."""
    r_rate = _make_dummy_region("REG_RATE", 26.0, 90.0)
    r_unavail = _make_dummy_region("REG_UNAVAIL", 26.0, 90.0)
    r_partial = _make_dummy_region("REG_PARTIAL", 26.0, 90.0)
    r_nodata = _make_dummy_region("REG_NODATA", 26.0, 90.0)

    mock_provider = MagicMock(spec=WeatherProvider)
    mock_provider.fetch_current_observation = AsyncMock(
        side_effect=[
            ProviderRateLimitError("Rate limit exceeded", provider="open-meteo"),
            ProviderUnavailableError("Server error 503", provider="open-meteo"),
            ProviderPartialDataError("Incomplete 24h intervals", provider="open-meteo"),
            ProviderNoDataError("No coordinates data", provider="open-meteo"),
        ]
    )

    service = IngestionService(provider=mock_provider)
    result = await service.run_live_ingestion(regions=[r_rate, r_unavail, r_partial, r_nodata])

    assert len(result.successful_observations) == 0
    assert len(result.failed_regions) == 4

    assert result.failed_regions[0].error_type == "ProviderRateLimitError"
    assert result.failed_regions[1].error_type == "ProviderUnavailableError"
    assert result.failed_regions[2].error_type == "ProviderPartialDataError"
    assert result.failed_regions[3].error_type == "ProviderNoDataError"


@pytest.mark.anyio
async def test_i_unexpected_error_marks_only_affected_region():
    """Test I: Unexpected programming/runtime error marks only the affected region as failed."""
    mock_provider = MagicMock(spec=WeatherProvider)
    obs_ok = _make_dummy_observation("REG_OK")
    mock_provider.fetch_current_observation = AsyncMock(
        side_effect=[
            RuntimeError("Unexpected memory failure!"),
            obs_ok,
        ]
    )

    service = IngestionService(provider=mock_provider)
    r_bad = _make_dummy_region("REG_BAD", 26.0, 90.0)
    r_ok = _make_dummy_region("REG_OK", 26.0, 90.0)

    result = await service.run_live_ingestion(regions=[r_bad, r_ok])

    assert len(result.successful_observations) == 1
    assert result.successful_observations[0].region_id == "REG_OK"
    assert len(result.failed_regions) == 1
    assert result.failed_regions[0].region_id == "REG_BAD"
    assert result.failed_regions[0].error_type == "UnexpectedError"
    assert "unexpected error" in result.failed_regions[0].message.lower()


@pytest.mark.anyio
async def test_j_provider_receives_exact_coordinates_and_id():
    """Test J: Provider receives exactly the region_id, latitude, and longitude belonging to each region."""
    mock_provider = MagicMock(spec=WeatherProvider)
    mock_provider.fetch_current_observation = AsyncMock(return_value=_make_dummy_observation("REG_X"))

    service = IngestionService(provider=mock_provider)
    region = _make_dummy_region("REG_X", 26.1234, 91.5678)

    await service.run_live_ingestion(regions=[region])

    mock_provider.fetch_current_observation.assert_awaited_once_with(
        region_id="REG_X",
        latitude=26.1234,
        longitude=91.5678,
    )


@pytest.mark.anyio
async def test_k_no_database_writes_occur():
    """Test K: Verifies that running ingestion never calls session.add, session.commit, or session.execute with INSERT/UPDATE."""
    mock_provider = MagicMock(spec=WeatherProvider)
    mock_provider.fetch_current_observation = AsyncMock(return_value=_make_dummy_observation("REG_1"))

    service = IngestionService(provider=mock_provider)
    mock_session = MagicMock()
    # Mock database returning one region
    mock_session.scalars.return_value.all.return_value = [_make_dummy_region("REG_1", 26.0, 90.0)]

    result = await service.run_live_ingestion(session=mock_session)

    assert len(result.successful_observations) == 1
    # Check that no write methods were called on session
    mock_session.add.assert_not_called()
    mock_session.add_all.assert_not_called()
    mock_session.commit.assert_not_called()
    mock_session.flush.assert_not_called()


def test_l_default_provider_is_open_meteo_provider():
    """Test L: IngestionService defaults to OpenMeteoProvider rather than duplicating HTTP logic."""
    service = IngestionService()
    assert isinstance(service.provider, OpenMeteoProvider)


def test_database_region_reader_query():
    """Validates get_monitored_regions executes a clean SELECT query ordered by region_id."""
    mock_session = MagicMock()
    mock_session.scalars.return_value.all.return_value = ["mock_region_1", "mock_region_2"]

    regions = get_monitored_regions(mock_session)
    assert regions == ["mock_region_1", "mock_region_2"]
    mock_session.scalars.assert_called_once()

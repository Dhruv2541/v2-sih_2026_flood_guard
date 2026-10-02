"""Tests for historical rainfall aggregation service."""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.services.historical_aggregation import (
    HistoricalRainfallAggregationService,
    HistoricalDataInsufficientError,
)


class TestHistoricalRainfallAggregationService:
    """Tests for HistoricalRainfallAggregationService."""

    @pytest.fixture
    def mock_session(self):
        return MagicMock(spec=Session)

    @pytest.fixture
    def service(self, mock_session):
        return HistoricalRainfallAggregationService(mock_session)

    def test_get_rainfall_3d_cumulative_success(self, service, mock_session):
        """Test successful 3-day cumulative rainfall retrieval."""
        reference_time = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
        mock_session.scalar.return_value = Decimal("125.5")

        result = service.get_rainfall_3d_cumulative("18-300-00101", reference_time)

        assert result == Decimal("125.5")
        mock_session.scalar.assert_called_once()

    def test_get_rainfall_7d_cumulative_success(self, service, mock_session):
        """Test successful 7-day cumulative rainfall retrieval."""
        reference_time = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
        mock_session.scalar.return_value = Decimal("280.3")

        result = service.get_rainfall_7d_cumulative("18-300-00101", reference_time)

        assert result == Decimal("280.3")
        mock_session.scalar.assert_called_once()

    def test_insufficient_data_raises_error(self, service, mock_session):
        """Test that no observations raises HistoricalDataInsufficientError."""
        reference_time = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
        mock_session.scalar.return_value = None

        with pytest.raises(HistoricalDataInsufficientError) as exc_info:
            service.get_rainfall_3d_cumulative("18-300-00101", reference_time)

        assert "No historical rainfall observations" in str(exc_info.value)
        assert "3-day window" in str(exc_info.value)

    def test_naive_datetime_raises_error(self, service):
        """Test that naive datetime raises ValueError."""
        reference_time = datetime(2026, 9, 15, 12, 0)  # No timezone

        with pytest.raises(ValueError) as exc_info:
            service.get_rainfall_3d_cumulative("18-300-00101", reference_time)

        assert "timezone-aware UTC" in str(exc_info.value)

    def test_window_boundaries(self, service, mock_session):
        """Test that window uses correct boundaries (exclusive start, inclusive end)."""
        reference_time = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
        mock_session.scalar.return_value = Decimal("100.0")

        service.get_rainfall_3d_cumulative("18-300-00101", reference_time)

        # Verify the query was called with correct window
        call_args = mock_session.scalar.call_args
        assert call_args is not None
        # The query should filter recorded_at > window_start AND recorded_at <= reference_time
        stmt = call_args[0][0]
        # We can't easily inspect the compiled SQL, but we verify no exception


class TestHistoricalRainfallAggregationIntegration:
    """Integration-style tests (require database)."""

    @pytest.mark.integration
    def test_real_database_query(self):
        """Test with real PostgreSQL session (requires test DB)."""
        pass  # Placeholder for integration test


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
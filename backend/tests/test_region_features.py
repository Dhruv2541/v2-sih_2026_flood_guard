"""Tests for region feature service."""

from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.services.region_features import (
    RegionFeatureService,
    RegionMetadataMissingError,
)
from app.models.region import Region


class TestRegionFeatureService:
    """Tests for RegionFeatureService."""

    @pytest.fixture
    def mock_session(self):
        return MagicMock(spec=Session)

    @pytest.fixture
    def service(self, mock_session):
        return RegionFeatureService(mock_session)

    @pytest.fixture
    def mock_region(self):
        region = MagicMock(spec=Region)
        region.region_id = "18-300-00101"
        region.elevation_m = Decimal("78.79")
        region.distance_to_river_m = Decimal("1718.8")
        region.soil_clay_pct = Decimal("28.3")
        region.population_density = Decimal("322.7")
        region.curve_number = Decimal("76.4")
        return region

    def test_get_elevation_success(self, service, mock_session, mock_region):
        """Test successful elevation retrieval."""
        mock_session.get.return_value = mock_region

        result = service.get_elevation("18-300-00101")

        assert result == Decimal("78.79")
        mock_session.get.assert_called_once_with(Region, "18-300-00101")

    def test_get_distance_to_river_success(self, service, mock_session, mock_region):
        """Test successful distance to river retrieval."""
        mock_session.get.return_value = mock_region

        result = service.get_distance_to_river("18-300-00101")

        assert result == Decimal("1718.8")

    def test_get_soil_clay_pct_success(self, service, mock_session, mock_region):
        """Test successful soil clay percentage retrieval."""
        mock_session.get.return_value = mock_region

        result = service.get_soil_clay_pct("18-300-00101")

        assert result == Decimal("28.3")

    def test_get_population_density_success(self, service, mock_session, mock_region):
        """Test successful population density retrieval."""
        mock_session.get.return_value = mock_region

        result = service.get_population_density("18-300-00101")

        assert result == Decimal("322.7")

    def test_get_curve_number_success(self, service, mock_session, mock_region):
        """Test successful curve number retrieval."""
        mock_session.get.return_value = mock_region

        result = service.get_curve_number("18-300-00101")

        assert result == Decimal("76.4")

    def test_get_all_static_features_success(self, service, mock_session, mock_region):
        """Test successful retrieval of all static features."""
        mock_session.get.return_value = mock_region

        result = service.get_all_static_features("18-300-00101")

        assert result["elevation"] == Decimal("78.79")
        assert result["distance_to_river_m"] == Decimal("1718.8")
        assert result["soil_clay_pct"] == Decimal("28.3")
        assert result["population_density"] == Decimal("322.7")
        assert result["curve_number"] == Decimal("76.4")

    def test_region_not_found_raises_error(self, service, mock_session):
        """Test that missing region raises RegionMetadataMissingError."""
        mock_session.get.return_value = None

        with pytest.raises(RegionMetadataMissingError) as exc_info:
            service.get_elevation("NONEXISTENT")

        assert "not found in database" in str(exc_info.value)

    def test_missing_elevation_raises_error(self, service, mock_session, mock_region):
        """Test that NULL elevation raises RegionMetadataMissingError."""
        mock_region.elevation_m = None
        mock_session.get.return_value = mock_region

        with pytest.raises(RegionMetadataMissingError) as exc_info:
            service.get_elevation("18-300-00101")

        assert "missing required static feature: elevation" in str(exc_info.value)

    def test_get_all_missing_field_raises_error(self, service, mock_session, mock_region):
        """Test that any missing field in get_all raises error."""
        mock_region.soil_clay_pct = None
        mock_session.get.return_value = mock_region

        with pytest.raises(RegionMetadataMissingError) as exc_info:
            service.get_all_static_features("18-300-00101")

        assert "missing required static fields" in str(exc_info.value)
        assert "soil_clay_pct" in str(exc_info.value)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
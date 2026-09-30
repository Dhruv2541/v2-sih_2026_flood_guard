"""Tests for derived feature calculations."""

from decimal import Decimal
import pytest

from app.services.derived_features import (
    compute_runoff_potential_index,
    compute_proximity_risk_score,
)


class TestRunoffPotentialIndex:
    """Tests for compute_runoff_potential_index."""

    def test_basic_computation(self):
        """Test basic formula: (rainfall * clay/100 * CN) / (elevation + 10)"""
        # rainfall=100mm, clay=30%, elevation=50m, CN=75
        # (100 * 0.3 * 75) / (50 + 10) = 2250 / 60 = 37.5
        result = compute_runoff_potential_index(
            rainfall_24h=Decimal("100.0"),
            soil_clay_pct=Decimal("30.0"),
            elevation=Decimal("50.0"),
            curve_number=Decimal("75.0"),
        )
        assert result == Decimal("37.5")

    def test_zero_rainfall(self):
        """Test with zero rainfall."""
        result = compute_runoff_potential_index(
            rainfall_24h=Decimal("0.0"),
            soil_clay_pct=Decimal("30.0"),
            elevation=Decimal("50.0"),
            curve_number=Decimal("75.0"),
        )
        assert result == Decimal("0.0")

    def test_high_elevation_reduces_index(self):
        """Test that higher elevation reduces runoff index."""
        result_low = compute_runoff_potential_index(
            rainfall_24h=Decimal("100.0"),
            soil_clay_pct=Decimal("30.0"),
            elevation=Decimal("10.0"),
            curve_number=Decimal("75.0"),
        )
        result_high = compute_runoff_potential_index(
            rainfall_24h=Decimal("100.0"),
            soil_clay_pct=Decimal("30.0"),
            elevation=Decimal("100.0"),
            curve_number=Decimal("75.0"),
        )
        assert result_low > result_high

    def test_higher_clay_increases_index(self):
        """Test that higher clay percentage increases runoff index."""
        result_low = compute_runoff_potential_index(
            rainfall_24h=Decimal("100.0"),
            soil_clay_pct=Decimal("10.0"),
            elevation=Decimal("50.0"),
            curve_number=Decimal("75.0"),
        )
        result_high = compute_runoff_potential_index(
            rainfall_24h=Decimal("100.0"),
            soil_clay_pct=Decimal("50.0"),
            elevation=Decimal("50.0"),
            curve_number=Decimal("75.0"),
        )
        assert result_high > result_low

    def test_custom_curve_number(self):
        """Test with custom curve number."""
        result = compute_runoff_potential_index(
            rainfall_24h=Decimal("100.0"),
            soil_clay_pct=Decimal("30.0"),
            elevation=Decimal("50.0"),
            curve_number=Decimal("85.0"),
        )
        # (100 * 0.3 * 85) / 60 = 2550 / 60 = 42.5
        assert result == Decimal("42.5")

    def test_precision_rounding(self):
        """Test that result is rounded to 4 decimal places."""
        # This produces a repeating decimal
        result = compute_runoff_potential_index(
            rainfall_24h=Decimal("100.0"),
            soil_clay_pct=Decimal("33.3"),
            elevation=Decimal("50.0"),
            curve_number=Decimal("75.0"),
        )
        # (100 * 0.333 * 75) / 60 = 2497.5 / 60 = 41.625
        assert result == Decimal("41.625")


class TestProximityRiskScore:
    """Tests for compute_proximity_risk_score."""

    def test_basic_computation(self):
        """Test basic formula: (rainfall * 1000) / (distance + 100)"""
        # rainfall=100mm, distance=1000m
        # (100 * 1000) / (1000 + 100) = 100000 / 1100 = 90.9090...
        result = compute_proximity_risk_score(
            rainfall_24h=Decimal("100.0"),
            distance_to_river_m=Decimal("1000.0"),
        )
        assert result == Decimal("90.9091")

    def test_zero_rainfall(self):
        """Test with zero rainfall."""
        result = compute_proximity_risk_score(
            rainfall_24h=Decimal("0.0"),
            distance_to_river_m=Decimal("1000.0"),
        )
        assert result == Decimal("0.0")

    def test_closer_river_increases_score(self):
        """Test that closer distance to river increases risk score."""
        result_close = compute_proximity_risk_score(
            rainfall_24h=Decimal("100.0"),
            distance_to_river_m=Decimal("100.0"),
        )
        result_far = compute_proximity_risk_score(
            rainfall_24h=Decimal("100.0"),
            distance_to_river_m=Decimal("10000.0"),
        )
        assert result_close > result_far

    def test_very_close_river(self):
        """Test with very close river (100m)."""
        result = compute_proximity_risk_score(
            rainfall_24h=Decimal("100.0"),
            distance_to_river_m=Decimal("100.0"),
        )
        # (100 * 1000) / (100 + 100) = 100000 / 200 = 500
        assert result == Decimal("500.0")

    def test_precision_rounding(self):
        """Test that result is rounded to 4 decimal places."""
        result = compute_proximity_risk_score(
            rainfall_24h=Decimal("123.45"),
            distance_to_river_m=Decimal("678.90"),
        )
        # (123.45 * 1000) / (678.90 + 100) = 123450 / 778.90 = 158.4927...
        assert result == Decimal("158.4927")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
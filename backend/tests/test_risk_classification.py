"""Tests for risk classification service."""

from decimal import Decimal
import math
import pytest

from app.services.risk import (
    RiskLevel,
    InvalidProbabilityError,
    classify_risk_level,
    LOW_MAX,
    MODERATE_MAX,
    HIGH_MAX,
)


# ==============================================================================
# 1. Threshold Constant Tests
# ==============================================================================

def test_threshold_constants_are_explicit():
    """Threshold constants are explicit module-level values (not magic numbers)."""
    assert LOW_MAX == Decimal("0.25")
    assert MODERATE_MAX == Decimal("0.50")
    assert HIGH_MAX == Decimal("0.75")


# ==============================================================================
# 2. Boundary Value Tests (Deterministic)
# ==============================================================================

def test_zero_probability_is_low():
    """0.00 -> LOW"""
    assert classify_risk_level(Decimal("0.00")) == RiskLevel.LOW


def test_0_249_is_low():
    """0.249 -> LOW (just below LOW_MAX)"""
    assert classify_risk_level(Decimal("0.249")) == RiskLevel.LOW


def test_0_25_is_moderate():
    """0.25 -> MODERATE (boundary inclusive at LOW_MAX)"""
    assert classify_risk_level(Decimal("0.25")) == RiskLevel.MODERATE


def test_0_499_is_moderate():
    """0.499 -> MODERATE (just below MODERATE_MAX)"""
    assert classify_risk_level(Decimal("0.499")) == RiskLevel.MODERATE


def test_0_50_is_high():
    """0.50 -> HIGH (boundary inclusive at MODERATE_MAX)"""
    assert classify_risk_level(Decimal("0.50")) == RiskLevel.HIGH


def test_0_749_is_high():
    """0.749 -> HIGH (just below HIGH_MAX)"""
    assert classify_risk_level(Decimal("0.749")) == RiskLevel.HIGH


def test_0_75_is_critical():
    """0.75 -> CRITICAL (boundary inclusive at HIGH_MAX)"""
    assert classify_risk_level(Decimal("0.75")) == RiskLevel.CRITICAL


def test_1_00_is_critical():
    """1.00 -> CRITICAL"""
    assert classify_risk_level(Decimal("1.00")) == RiskLevel.CRITICAL


# ==============================================================================
# 3. Intermediate Value Tests
# ==============================================================================

def test_intermediate_values_in_each_range():
    """Test various intermediate values map to correct risk levels."""
    test_cases = [
        (Decimal("0.10"), RiskLevel.LOW),
        (Decimal("0.20"), RiskLevel.LOW),
        (Decimal("0.24"), RiskLevel.LOW),
        (Decimal("0.26"), RiskLevel.MODERATE),
        (Decimal("0.35"), RiskLevel.MODERATE),
        (Decimal("0.45"), RiskLevel.MODERATE),
        (Decimal("0.55"), RiskLevel.HIGH),
        (Decimal("0.65"), RiskLevel.HIGH),
        (Decimal("0.70"), RiskLevel.HIGH),
        (Decimal("0.80"), RiskLevel.CRITICAL),
        (Decimal("0.90"), RiskLevel.CRITICAL),
        (Decimal("0.99"), RiskLevel.CRITICAL),
    ]
    for prob, expected in test_cases:
        assert classify_risk_level(prob) == expected, f"Failed for {prob}"


# ==============================================================================
# 4. Invalid Input Rejection Tests
# ==============================================================================

def test_negative_probability_rejected():
    """Negative probability raises InvalidProbabilityError."""
    with pytest.raises(InvalidProbabilityError) as exc_info:
        classify_risk_level(Decimal("-0.01"))
    assert "negative" in str(exc_info.value).lower()


def test_probability_above_one_rejected():
    """Probability > 1 raises InvalidProbabilityError."""
    with pytest.raises(InvalidProbabilityError) as exc_info:
        classify_risk_level(Decimal("1.01"))
    assert "exceed" in str(exc_info.value).lower()


def test_nan_rejected():
    """NaN probability raises InvalidProbabilityError."""
    nan_decimal = Decimal("NaN")
    with pytest.raises(InvalidProbabilityError) as exc_info:
        classify_risk_level(nan_decimal)
    assert "nan" in str(exc_info.value).lower()


def test_positive_infinity_rejected():
    """Positive infinity raises InvalidProbabilityError."""
    inf_decimal = Decimal("Infinity")
    with pytest.raises(InvalidProbabilityError) as exc_info:
        classify_risk_level(inf_decimal)
    assert "infinite" in str(exc_info.value).lower()


def test_negative_infinity_rejected():
    """Negative infinity raises InvalidProbabilityError."""
    neg_inf_decimal = Decimal("-Infinity")
    with pytest.raises(InvalidProbabilityError) as exc_info:
        classify_risk_level(neg_inf_decimal)
    assert "infinite" in str(exc_info.value).lower()


# ==============================================================================
# 5. RiskLevel Enum Tests
# ==============================================================================

def test_risk_level_enum_values():
    """RiskLevel enum has expected string values."""
    assert RiskLevel.LOW.value == "LOW"
    assert RiskLevel.MODERATE.value == "MODERATE"
    assert RiskLevel.HIGH.value == "HIGH"
    assert RiskLevel.CRITICAL.value == "CRITICAL"


def test_classify_returns_enum():
    """classify_risk_level returns RiskLevel enum, not string."""
    result = classify_risk_level(Decimal("0.5"))
    assert isinstance(result, RiskLevel)
    assert result == RiskLevel.HIGH
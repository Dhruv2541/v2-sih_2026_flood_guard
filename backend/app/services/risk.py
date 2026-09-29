"""Risk classification for flood probability.

Provides backend-layer classification of flood probability into risk levels.
This is separate from the ML model contract which only outputs flood_probability.
"""

from decimal import Decimal
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level classification for flood probability.

    These thresholds are PROTOTYPE PLACEHOLDERS.
    They are NOT scientifically validated flood-risk thresholds.
    They may be recalibrated after validation against real flood observations.
    Do not present them as official government/IMD/ASDMA thresholds.
    """
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# Prototype threshold constants (explicit, not magic numbers)
# These are placeholder values and will be replaced by the risk engine in a later phase.
LOW_MAX = Decimal("0.25")
MODERATE_MAX = Decimal("0.50")
HIGH_MAX = Decimal("0.75")


class InvalidProbabilityError(ValueError):
    """Raised when flood probability is invalid for risk classification."""
    pass


def classify_risk_level(flood_probability: Decimal) -> RiskLevel:
    """Classify flood probability into a risk level.

    Args:
        flood_probability: Flood probability from ML model (must be 0.0 to 1.0)

    Returns:
        RiskLevel: LOW, MODERATE, HIGH, or CRITICAL

    Raises:
        InvalidProbabilityError: If probability is NaN, infinite, < 0, or > 1

    Boundary behavior (deterministic):
        0.00      -> LOW
        0.249     -> LOW
        0.25      -> MODERATE
        0.499     -> MODERATE
        0.50      -> HIGH
        0.749     -> HIGH
        0.75      -> CRITICAL
        1.00      -> CRITICAL
    """
    # Defensive validation - model output should already guarantee 0..1
    if flood_probability.is_nan():
        raise InvalidProbabilityError("flood_probability cannot be NaN")
    if flood_probability.is_infinite():
        raise InvalidProbabilityError("flood_probability cannot be infinite")
    if flood_probability < Decimal("0"):
        raise InvalidProbabilityError(f"flood_probability cannot be negative: {flood_probability}")
    if flood_probability > Decimal("1"):
        raise InvalidProbabilityError(f"flood_probability cannot exceed 1.0: {flood_probability}")

    if flood_probability < LOW_MAX:
        return RiskLevel.LOW
    elif flood_probability < MODERATE_MAX:
        return RiskLevel.MODERATE
    elif flood_probability < HIGH_MAX:
        return RiskLevel.HIGH
    else:
        return RiskLevel.CRITICAL
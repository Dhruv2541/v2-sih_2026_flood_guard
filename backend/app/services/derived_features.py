"""Derived feature calculations for ML model.

Centralizes the exact formulas used during training to ensure training/inference parity.
Formulas verified against src/ml/live_inference_adapter.py and src/ml/train_real_model.py
"""

from decimal import Decimal


def compute_runoff_potential_index(
    rainfall_24h: Decimal,
    soil_clay_pct: Decimal,
    elevation: Decimal,
    curve_number: Decimal = Decimal("75.0"),
) -> Decimal:
    """Compute runoff potential index.

    Formula (from training code):
    runoff_potential_index = (rainfall_24h * (soil_clay_pct / 100.0) * curve_number) / (elevation + 10.0)

    Args:
        rainfall_24h: 24-hour accumulated rainfall (mm)
        soil_clay_pct: Soil clay percentage (0-100)
        elevation: Elevation above sea level (m)
        curve_number: SCS Curve Number (default 75.0 from training)

    Returns:
        Decimal: Runoff potential index
    """
    # Convert to float for computation, then back to Decimal
    r24 = float(rainfall_24h)
    clay = float(soil_clay_pct)
    elev = float(elevation)
    cn = float(curve_number)

    # Formula: (rainfall_24h * (soil_clay_pct / 100.0) * curve_number) / (elevation + 10.0)
    result = (r24 * (clay / 100.0) * cn) / (elev + 10.0)

    return Decimal(str(round(result, 4)))


def compute_proximity_risk_score(
    rainfall_24h: Decimal,
    distance_to_river_m: Decimal,
) -> Decimal:
    """Compute proximity risk score.

    Formula (from training code):
    proximity_risk_score = (rainfall_24h * 1000.0) / (distance_to_river_m + 100.0)

    Args:
        rainfall_24h: 24-hour accumulated rainfall (mm)
        distance_to_river_m: Distance to nearest major river (m)

    Returns:
        Decimal: Proximity risk score
    """
    r24 = float(rainfall_24h)
    dist = float(distance_to_river_m)

    # Formula: (rainfall_24h * 1000.0) / (distance_to_river_m + 100.0)
    result = (r24 * 1000.0) / (dist + 100.0)

    return Decimal(str(round(result, 4)))
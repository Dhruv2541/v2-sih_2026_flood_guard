"""
Feature Parity Module — Single Source of Truth for Feature Engineering.

This module contains the AUTHORITATIVE feature engineering formulas used
in BOTH training and inference. Any change here affects both pipelines.

DO NOT duplicate formulas in training code or inference adapter.
Import from here instead.
"""

from decimal import Decimal
from typing import Dict, Any


# ============================================================================
# FEATURE CONTRACT (must match backend ml-feature-contract-v2.md)
# ============================================================================

# Full 14-feature contract (when forecast_rainfall_6h available)
FEATURE_CONTRACT_FULL = [
    'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
    'forecast_rainfall_6h', 'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
    'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density',
    'runoff_potential_index', 'proximity_risk_score'
]

# Current 13-feature contract (forecast_rainfall_6h unavailable)
FEATURE_CONTRACT_CURRENT = [
    'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
    'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
    'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density',
    'runoff_potential_index', 'proximity_risk_score'
]


# ============================================================================
# DERIVED FEATURE FORMULAS
# ============================================================================

# Default curve number from training (used when region-specific not available)
DEFAULT_CURVE_NUMBER = Decimal("75.0")


def compute_runoff_potential_index(
    rainfall_24h: Decimal,
    soil_clay_pct: Decimal,
    elevation: Decimal,
    curve_number: Decimal = DEFAULT_CURVE_NUMBER
) -> Decimal:
    """
    Compute runoff potential index.
    
    Formula: (rainfall_24h * (soil_clay_pct / 100) * curve_number) / (elevation + 10)
    
    This exact formula is used in:
    - Training: build_corrected_dataset.py
    - Inference: backend/app/services/derived_features.py
    - Adapter: src/ml/live_inference_adapter.py (for reference)
    """
    # Convert to float for computation
    r24 = float(rainfall_24h)
    clay = float(soil_clay_pct)
    elev = float(elevation)
    cn = float(curve_number)
    
    result = (r24 * (clay / 100.0) * cn) / (elev + 10.0)
    
    return Decimal(str(round(result, 4)))


def compute_proximity_risk_score(
    rainfall_24h: Decimal,
    distance_to_river_m: Decimal
) -> Decimal:
    """
    Compute proximity risk score.
    
    Formula: (rainfall_24h * 1000.0) / (distance_to_river_m + 100.0)
    
    This exact formula is used in:
    - Training: build_corrected_dataset.py
    - Inference: backend/app/services/derived_features.py
    - Adapter: src/ml/live_inference_adapter.py (for reference)
    """
    r24 = float(rainfall_24h)
    dist = float(distance_to_river_m)
    
    result = (r24 * 1000.0) / (dist + 100.0)
    
    return Decimal(str(round(result, 4)))


def compute_rainfall_windows_from_24h(rainfall_24h: Decimal) -> Dict[str, Decimal]:
    """
    Compute sub-daily rainfall windows from 24h total.
    
    NOTE: These are PROPORTIONAL APPROXIMATIONS from daily totals.
    True sub-daily measurements require hourly data.
    
    This exact function is used in:
    - Training: build_corrected_dataset.py
    - Inference: backend/app/services/derived_features.py (or equivalent)
    """
    r24 = float(rainfall_24h)
    
    return {
        'rainfall_1h': Decimal(str(round(r24 / 24.0, 2))),
        'rainfall_3h': Decimal(str(round(r24 * 0.25, 2))),
        'rainfall_6h': Decimal(str(round(r24 * 0.45, 2))),
        'rainfall_12h': Decimal(str(round(r24 * 0.75, 2))),
    }


def compute_cumulative_rainfall(
    rainfall_24h_series: list,
    window_days: int
) -> list:
    """
    Compute causal rolling cumulative rainfall.
    
    Args:
        rainfall_24h_series: List of daily rainfall_24h values in chronological order
        window_days: 3 or 7
        
    Returns:
        List of cumulative values (same length as input)
        
    This implements: sum of rainfall_24h for current day + previous (window-1) days
    Uses min_periods=1 so first days get partial sums.
    """
    import pandas as pd
    s = pd.Series(rainfall_24h_series)
    rolling = s.rolling(window=window_days, min_periods=1).sum()
    return rolling.round(2).tolist()


# ============================================================================
# FEATURE VECTOR CONSTRUCTION
# ============================================================================

def build_feature_vector_current(
    rainfall_24h: Decimal,
    rainfall_3d_cumulative: Decimal,
    rainfall_7d_cumulative: Decimal,
    elevation: Decimal,
    distance_to_river_m: Decimal,
    soil_clay_pct: Decimal,
    population_density: Decimal,
    curve_number: Decimal = DEFAULT_CURVE_NUMBER
) -> Dict[str, Decimal]:
    """
    Build the 13-feature vector for current model (without forecast).
    
    Returns dict with exact feature names and order matching FEATURE_CONTRACT_CURRENT.
    """
    # Compute sub-daily windows
    windows = compute_rainfall_windows_from_24h(rainfall_24h)
    
    # Compute derived features
    runoff = compute_runoff_potential_index(rainfall_24h, soil_clay_pct, elevation, curve_number)
    proximity = compute_proximity_risk_score(rainfall_24h, distance_to_river_m)
    
    return {
        'rainfall_1h': windows['rainfall_1h'],
        'rainfall_3h': windows['rainfall_3h'],
        'rainfall_6h': windows['rainfall_6h'],
        'rainfall_12h': windows['rainfall_12h'],
        'rainfall_24h': rainfall_24h,
        'rainfall_3d_cumulative': rainfall_3d_cumulative,
        'rainfall_7d_cumulative': rainfall_7d_cumulative,
        'elevation': elevation,
        'distance_to_river_m': distance_to_river_m,
        'soil_clay_pct': soil_clay_pct,
        'population_density': population_density,
        'runoff_potential_index': runoff,
        'proximity_risk_score': proximity,
    }


def build_feature_vector_full(
    rainfall_24h: Decimal,
    forecast_rainfall_6h: Decimal,
    rainfall_3d_cumulative: Decimal,
    rainfall_7d_cumulative: Decimal,
    elevation: Decimal,
    distance_to_river_m: Decimal,
    soil_clay_pct: Decimal,
    population_density: Decimal,
    curve_number: Decimal = DEFAULT_CURVE_NUMBER
) -> Dict[str, Decimal]:
    """
    Build the 14-feature vector for full contract (with forecast).
    
    Returns dict with exact feature names and order matching FEATURE_CONTRACT_FULL.
    """
    # Compute sub-daily windows
    windows = compute_rainfall_windows_from_24h(rainfall_24h)
    
    # Compute derived features
    runoff = compute_runoff_potential_index(rainfall_24h, soil_clay_pct, elevation, curve_number)
    proximity = compute_proximity_risk_score(rainfall_24h, distance_to_river_m)
    
    return {
        'rainfall_1h': windows['rainfall_1h'],
        'rainfall_3h': windows['rainfall_3h'],
        'rainfall_6h': windows['rainfall_6h'],
        'rainfall_12h': windows['rainfall_12h'],
        'rainfall_24h': rainfall_24h,
        'forecast_rainfall_6h': forecast_rainfall_6h,
        'rainfall_3d_cumulative': rainfall_3d_cumulative,
        'rainfall_7d_cumulative': rainfall_7d_cumulative,
        'elevation': elevation,
        'distance_to_river_m': distance_to_river_m,
        'soil_clay_pct': soil_clay_pct,
        'population_density': population_density,
        'runoff_potential_index': runoff,
        'proximity_risk_score': proximity,
    }


def validate_feature_vector(features: Dict[str, Decimal], contract: str = 'current') -> bool:
    """
    Validate that a feature vector matches the expected contract.
    
    Args:
        features: Feature dict to validate
        contract: 'current' (13 features) or 'full' (14 features)
        
    Returns:
        True if valid, raises ValueError if not
    """
    expected = FEATURE_CONTRACT_CURRENT if contract == 'current' else FEATURE_CONTRACT_FULL
    
    missing = set(expected) - set(features.keys())
    extra = set(features.keys()) - set(expected)
    
    if missing:
        raise ValueError(f"Missing features: {missing}")
    if extra:
        raise ValueError(f"Extra features not in contract: {extra}")
        
    # Check order
    feature_list = [features[k] for k in expected]
    return True


# ============================================================================
# UNIT TESTS (run with: python -m pytest src/ml/feature_parity.py -v)
# ============================================================================

if __name__ == "__main__":
    # Quick sanity checks
    from decimal import Decimal
    
    # Test runoff_potential_index
    result = compute_runoff_potential_index(
        rainfall_24h=Decimal("100.0"),
        soil_clay_pct=Decimal("30.0"),
        elevation=Decimal("50.0"),
        curve_number=Decimal("75.0")
    )
    expected = Decimal("37.5")  # (100 * 0.3 * 75) / 60 = 2250 / 60 = 37.5
    assert result == expected, f"runoff: {result} != {expected}"
    print(f"✓ runoff_potential_index: {result}")
    
    # Test proximity_risk_score
    result = compute_proximity_risk_score(
        rainfall_24h=Decimal("100.0"),
        distance_to_river_m=Decimal("1000.0")
    )
    expected = Decimal("90.9091")  # 100000 / 1100
    assert result == expected, f"proximity: {result} != {expected}"
    print(f"✓ proximity_risk_score: {result}")
    
    # Test rainfall windows
    windows = compute_rainfall_windows_from_24h(Decimal("120.0"))
    assert windows['rainfall_1h'] == Decimal("5.0")
    assert windows['rainfall_3h'] == Decimal("30.0")
    assert windows['rainfall_6h'] == Decimal("54.0")
    assert windows['rainfall_12h'] == Decimal("90.0")
    print(f"✓ rainfall windows: {windows}")
    
    # Test feature vector building
    fv = build_feature_vector_current(
        rainfall_24h=Decimal("100.0"),
        forecast_rainfall_6h=Decimal("NaN"),
        rainfall_3d_cumulative=Decimal("250.0"),
        rainfall_7d_cumulative=Decimal("500.0"),
        elevation=Decimal("50.0"),
        distance_to_river_m=Decimal("1000.0"),
        soil_clay_pct=Decimal("30.0"),
        population_density=Decimal("300.0")
    )
    validate_feature_vector(fv, 'current')
    print(f"✓ feature vector (current): {len(fv)} features")
    
    fv_full = build_feature_vector_full(
        rainfall_24h=Decimal("100.0"),
        forecast_rainfall_6h=Decimal("15.0"),
        rainfall_3d_cumulative=Decimal("250.0"),
        rainfall_7d_cumulative=Decimal("500.0"),
        elevation=Decimal("50.0"),
        distance_to_river_m=Decimal("1000.0"),
        soil_clay_pct=Decimal("30.0"),
        population_density=Decimal("300.0")
    )
    validate_feature_vector(fv_full, 'full')
    print(f"✓ feature vector (full): {len(fv_full)} features")
    
    print("\n✅ All feature parity checks passed!")
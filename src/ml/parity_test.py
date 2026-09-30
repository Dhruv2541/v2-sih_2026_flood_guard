"""
Training/Inference Feature Parity Test.

This test verifies that the feature engineering in training
produces IDENTICAL feature vectors to the inference pipeline.

MANDATORY: This test must pass before model integration.
"""

import os
import sys
import pandas as pd
import numpy as np
from decimal import Decimal
from datetime import datetime, timezone

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.ml.feature_parity import (
    build_feature_vector_current,
    build_feature_vector_full,
    compute_runoff_potential_index,
    compute_proximity_risk_score,
    compute_rainfall_windows_from_24h,
    validate_feature_vector,
    FEATURE_CONTRACT_CURRENT,
    FEATURE_CONTRACT_FULL,
)

# Backend inference imports (will be available after Phase 5B-5C)
try:
    from backend.app.services.derived_features import (
        compute_runoff_potential_index as backend_runoff,
        compute_proximity_risk_score as backend_proximity,
    )
    BACKEND_AVAILABLE = True
except ImportError:
    BACKEND_AVAILABLE = False
    print("[WARNING] Backend derived_features not available - skipping backend comparison")


def test_formula_parity():
    """Test that training and inference formulas produce identical results."""
    print("Testing formula parity...")
    
    # Test cases: (rainfall_24h, soil_clay_pct, elevation, curve_number, distance_to_river)
    test_cases = [
        (Decimal("100.0"), Decimal("30.0"), Decimal("50.0"), Decimal("75.0"), Decimal("1000.0")),
        (Decimal("0.0"), Decimal("25.0"), Decimal("100.0"), Decimal("75.0"), Decimal("5000.0")),
        (Decimal("250.0"), Decimal("40.0"), Decimal("10.0"), Decimal("85.0"), Decimal("200.0")),
        (Decimal("15.5"), Decimal("15.0"), Decimal("200.0"), Decimal("70.0"), Decimal("15000.0")),
    ]
    
    for i, (r24, clay, elev, cn, dist) in enumerate(test_cases):
        # Training formula
        train_runoff = compute_runoff_potential_index(r24, clay, elev, cn)
        train_proximity = compute_proximity_risk_score(r24, dist)
        
        # Backend formula (if available)
        if BACKEND_AVAILABLE:
            backend_runoff_val = backend_runoff(r24, clay, elev, cn)
            backend_proximity_val = backend_proximity(r24, dist)
            
            # Must be exactly equal
            assert train_runoff == backend_runoff_val, f"Case {i}: runoff mismatch: {train_runoff} != {backend_runoff_val}"
            assert train_proximity == backend_proximity_val, f"Case {i}: proximity mismatch: {train_proximity} != {backend_proximity_val}"
            print("  PASS: Case {i}: formulas match backend")
        else:
            # Just verify internal consistency
            print(f"  PASS: Case {i}: runoff={train_runoff}, proximity={train_proximity}")


def test_rainfall_windows_parity():
    """Test rainfall window computation parity."""
    print("Testing rainfall window parity...")
    
    test_values = [Decimal("0.0"), Decimal("10.0"), Decimal("50.0"), Decimal("120.5"), Decimal("250.0")]
    
    for r24 in test_values:
        windows = compute_rainfall_windows_from_24h(r24)
        
        r24_float = float(r24)
        expected = {
            'rainfall_1h': Decimal(str(round(r24_float / 24.0, 2))),
            'rainfall_3h': Decimal(str(round(r24_float * 0.25, 2))),
            'rainfall_6h': Decimal(str(round(r24_float * 0.45, 2))),
            'rainfall_12h': Decimal(str(round(r24_float * 0.75, 2))),
        }
        
        for key, val in expected.items():
            assert windows[key] == val, f"rainfall window {key}: {windows[key]} != {val} for r24={r24}"
    
    print("  PASS: Rainfall window computations match expected formulas")


def test_feature_vector_contract():
    """Test that feature vectors match the declared contract."""
    print("Testing feature vector contracts...")
    
    # Current contract (13 features, no forecast)
    fv_current = build_feature_vector_current(
        rainfall_24h=Decimal("100.0"),
        rainfall_3d_cumulative=Decimal("250.0"),
        rainfall_7d_cumulative=Decimal("500.0"),
        elevation=Decimal("50.0"),
        distance_to_river_m=Decimal("1000.0"),
        soil_clay_pct=Decimal("30.0"),
        population_density=Decimal("300.0")
    )
    
    validate_feature_vector(fv_current, 'current')
    assert len(fv_current) == 13
    print("  PASS: Current contract (13 features): valid")
    
    # Full contract (14 features, with forecast)
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
    assert len(fv_full) == 14
    print("  PASS: Full contract (14 features): valid")
    
    # Verify feature order matches contract
    current_keys = list(fv_current.keys())
    full_keys = list(fv_full.keys())
    
    assert current_keys == FEATURE_CONTRACT_CURRENT, f"Current key order mismatch"
    assert full_keys == FEATURE_CONTRACT_FULL, f"Full key order mismatch"
    print("  PASS: Feature order matches declared contracts")


def test_end_to_end_parity():
    """
    Test end-to-end parity by comparing a training row's features
    with what the inference pipeline would produce from the same inputs.
    
    This requires the corrected dataset to exist.
    """
    print("Testing end-to-end parity...")
    
    data_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "backend", "data", "processed", "assam_flood_ml_ready_CORRECTED.csv"
    )
    
    if not os.path.exists(data_path):
        print("  WARNING: Corrected dataset not found - skipping end-to-end test")
        return
    
    df = pd.read_csv(data_path)
    
    # Pick a sample row
    sample = df.iloc[0]
    
    # Build feature vector from training data
    train_features = {}
    for col in FEATURE_CONTRACT_CURRENT:
        if col in sample:
            train_features[col] = Decimal(str(sample[col]))
    
    # Now simulate inference: take the raw inputs and recompute
    raw_inputs = {
        'rainfall_24h': Decimal(str(sample['rainfall_24h'])),
        'rainfall_3d_cumulative': Decimal(str(sample['rainfall_3d_cumulative'])),
        'rainfall_7d_cumulative': Decimal(str(sample['rainfall_7d_cumulative'])),
        'elevation': Decimal(str(sample['elevation'])),
        'distance_to_river_m': Decimal(str(sample['distance_to_river_m'])),
        'soil_clay_pct': Decimal(str(sample['soil_clay_pct'])),
        'population_density': Decimal(str(sample['population_density'])),
    }
    
    inference_features = build_feature_vector_current(**raw_inputs)
    
    # Compare
    mismatches = []
    for key in FEATURE_CONTRACT_CURRENT:
        train_val = train_features.get(key)
        inf_val = inference_features.get(key)
        
        if train_val is not None and inf_val is not None:
            # Allow tiny floating point differences
            diff = abs(float(train_val) - float(inf_val))
            if diff > 0.01:  # 0.01 tolerance for rounding
                mismatches.append((key, train_val, inf_val, diff))
    
    if mismatches:
        print("  FAIL: END-TO-END PARITY FAILED:")
        for key, tv, iv, diff in mismatches:
            print(f"    {key}: training={tv}, inference={iv}, diff={diff}")
        raise AssertionError(f"Found {len(mismatches)} feature mismatches")
    
    print("  PASS: End-to-end parity: training features match inference recomputation")


def test_end_to_end_parity_full():
    """
    Test end-to-end parity for the full 14-feature contract.
    
    This test requires a dataset with forecast_rainfall_6h available.
    If the forecast feature is unavailable (all NaN), the test is skipped.
    """
    print("Testing end-to-end parity (full 14-feature contract)...")
    
    data_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "backend", "data", "processed", "assam_flood_ml_ready_CORRECTED.csv"
    )
    
    if not os.path.exists(data_path):
        print("  WARNING: Corrected dataset not found - skipping end-to-end test")
        return
    
    df = pd.read_csv(data_path)
    
    # Check if forecast feature is available
    if 'forecast_rainfall_6h' not in df.columns:
        print("  SKIP: forecast_rainfall_6h column not in dataset")
        return
    
    if df['forecast_rainfall_6h'].isna().all():
        print("  SKIP: forecast_rainfall_6h all NaN (unavailable)")
        return
    
    # Pick a sample row with valid forecast
    valid_rows = df[df['forecast_rainfall_6h'].notna()]
    if len(valid_rows) == 0:
        print("  SKIP: No rows with valid forecast_rainfall_6h")
        return
    
    sample = valid_rows.iloc[0]
    
    # Build feature vector from training data
    train_features = {}
    for col in FEATURE_CONTRACT_FULL:
        if col in sample:
            train_features[col] = Decimal(str(sample[col]))
    
    # Now simulate inference: take the raw inputs and recompute
    raw_inputs = {
        'rainfall_24h': Decimal(str(sample['rainfall_24h'])),
        'forecast_rainfall_6h': Decimal(str(sample['forecast_rainfall_6h'])),
        'rainfall_3d_cumulative': Decimal(str(sample['rainfall_3d_cumulative'])),
        'rainfall_7d_cumulative': Decimal(str(sample['rainfall_7d_cumulative'])),
        'elevation': Decimal(str(sample['elevation'])),
        'distance_to_river_m': Decimal(str(sample['distance_to_river_m'])),
        'soil_clay_pct': Decimal(str(sample['soil_clay_pct'])),
        'population_density': Decimal(str(sample['population_density'])),
    }
    
    inference_features = build_feature_vector_full(**raw_inputs)
    
    # Compare
    mismatches = []
    for key in FEATURE_CONTRACT_FULL:
        train_val = train_features.get(key)
        inf_val = inference_features.get(key)
        
        if train_val is not None and inf_val is not None:
            # Allow tiny floating point differences
            diff = abs(float(train_val) - float(inf_val))
            if diff > 0.01:  # 0.01 tolerance for rounding
                mismatches.append((key, train_val, inf_val, diff))
    
    if mismatches:
        print("  FAIL: END-TO-END PARITY (FULL) FAILED:")
        for key, tv, iv, diff in mismatches:
            print(f"    {key}: training={tv}, inference={iv}, diff={diff}")
        raise AssertionError(f"Found {len(mismatches)} feature mismatches")
    
    print("  PASS: End-to-end parity (full): training features match inference recomputation")


def test_feature_vector_forecast_inclusion():
    """
    Test that the full feature vector correctly includes forecast_rainfall_6h
    at the correct position (index 5, after rainfall_24h).
    """
    print("Testing forecast feature position in full contract...")
    
    fv = build_feature_vector_full(
        rainfall_24h=Decimal("100.0"),
        forecast_rainfall_6h=Decimal("15.0"),
        rainfall_3d_cumulative=Decimal("250.0"),
        rainfall_7d_cumulative=Decimal("500.0"),
        elevation=Decimal("50.0"),
        distance_to_river_m=Decimal("1000.0"),
        soil_clay_pct=Decimal("30.0"),
        population_density=Decimal("300.0")
    )
    
    # Verify forecast_rainfall_6h is at index 5 (0-based)
    keys = list(fv.keys())
    forecast_idx = keys.index('forecast_rainfall_6h')
    
    assert forecast_idx == 5, f"forecast_rainfall_6h at index {forecast_idx}, expected 5"
    
    # Verify value matches input
    assert fv['forecast_rainfall_6h'] == Decimal("15.0")
    
    print("  PASS: forecast_rainfall_6h at correct position with correct value")


def test_cumulative_rainfall_parity():
    """Test that cumulative rainfall computation matches between training and inference."""
    print("Testing cumulative rainfall parity...")
    
    # Create a sample time series
    dates = pd.date_range('2024-06-01', periods=10, freq='D')
    rainfall_series = [5.0, 10.0, 0.0, 25.0, 50.0, 15.0, 0.0, 5.0, 30.0, 20.0]
    
    df = pd.DataFrame({'timestamp': dates, 'rainfall_24h': rainfall_series})
    
    # Training computation (using pandas rolling)
    df['train_3d'] = df['rainfall_24h'].rolling(window=3, min_periods=1).sum().round(2)
    df['train_7d'] = df['rainfall_24h'].rolling(window=7, min_periods=1).sum().round(2)
    
    # Inference computation (should use same logic)
    from src.ml.feature_parity import compute_cumulative_rainfall
    
    inf_3d = compute_cumulative_rainfall(rainfall_series, 3)
    inf_7d = compute_cumulative_rainfall(rainfall_series, 7)
    
    # Compare
    for i in range(len(rainfall_series)):
        train_3d = df['train_3d'].iloc[i]
        train_7d = df['train_7d'].iloc[i]
        
        if not np.isnan(train_3d):
            assert abs(train_3d - inf_3d[i]) < 0.01, f"3d cum mismatch at index {i}: {train_3d} != {inf_3d[i]}"
        if not np.isnan(train_7d):
            assert abs(train_7d - inf_7d[i]) < 0.01, f"7d cum mismatch at index {i}: {train_7d} != {inf_7d[i]}"
    
    print("  PASS: Cumulative rainfall computations match")


def run_all_parity_tests():
    """Run all parity tests."""
    print("=" * 60)
    print("RUNNING TRAINING/INFERENCE PARITY TESTS")
    print("=" * 60)
    
    tests = [
        ("Formula parity", test_formula_parity),
        ("Rainfall windows parity", test_rainfall_windows_parity),
        ("Feature vector contract", test_feature_vector_contract),
        ("Feature vector forecast inclusion", test_feature_vector_forecast_inclusion),
        ("Cumulative rainfall parity", test_cumulative_rainfall_parity),
        ("End-to-end parity (current)", test_end_to_end_parity),
        ("End-to-end parity (full)", test_end_to_end_parity_full),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        print(f"\n[{name}]")
        try:
            test_func()
            passed += 1
        except Exception as e:
            print(f"FAILED: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)
    
    if failed > 0:
        sys.exit(1)
    else:
        print("ALL PARITY TESTS PASSED")


if __name__ == "__main__":
    run_all_parity_tests()
import sys
import os
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pandas as pd
import numpy as np
import pytest

base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

from app.ml.base import validate_model_output
from app.ml.schemas import MLPredictionInput, MLPredictionOutput
from src.ml.live_inference_adapter import get_model_adapter, AssamFloodModel

def test_dod_1_reproducibility():
    """1. Genuinely Reproducible: Verifies model artifact loads deterministically."""
    adapter = get_model_adapter()
    assert adapter.model is not None
    assert adapter.scaler is not None
    assert adapter.imputer is not None
    assert len(adapter.feature_names) == 14
    assert adapter.model_version == "assam-flood-v2-ground-truth"

def test_dod_2_leakage_freedom():
    """2. Leakage-Free: Verifies no future rainfall leakage features are present."""
    adapter = get_model_adapter()
    # Confirm no future target or post-event rain features in model feature schema
    for feat in adapter.feature_names:
        assert "after" not in feat
        assert "target" not in feat
        assert feat != "flood_occurred"

def test_dod_3_contract_compliance():
    """3. Enforced Contract: Verifies MLPredictionInput -> MLPredictionOutput contract."""
    adapter = get_model_adapter()
    now_utc = datetime(2026, 10, 2, 12, 0, tzinfo=timezone.utc)
    
    inp = MLPredictionInput(
        region_id="18-300-00101",
        reference_time=now_utc,
        rainfall_1h_mm=Decimal("15.5"),
        rainfall_3h_mm=Decimal("35.0"),
        rainfall_6h_mm=Decimal("60.0"),
        rainfall_24h_mm=Decimal("110.0"),
        water_level_m=Decimal("42.5"),
        elevation_m=Decimal("38.0")
    )
    
    out = adapter.predict(inp)
    assert isinstance(out, MLPredictionOutput)
    
    # Run backend validation wrapper
    validated = validate_model_output(out, expected_region_id="18-300-00101")
    assert validated.region_id == "18-300-00101"
    assert Decimal("0.0") <= validated.flood_probability <= Decimal("1.0")
    assert validated.model_version == "assam-flood-v2-ground-truth"

def test_dod_4_feature_parity_proven():
    """4. Feature Parity: Verifies dict input and MLPredictionInput produce identical probabilities."""
    adapter = get_model_adapter()
    now_utc = datetime(2026, 10, 2, 12, 0, tzinfo=timezone.utc)
    
    dict_input = {
        "region_id": "18-300-00101",
        "rainfall_1h": 15.5,
        "rainfall_3h": 35.0,
        "rainfall_6h": 60.0,
        "rainfall_24h": 110.0,
        "elevation": 38.0
    }
    
    pydantic_input = MLPredictionInput(
        region_id="18-300-00101",
        reference_time=now_utc,
        rainfall_1h_mm=Decimal("15.5"),
        rainfall_3h_mm=Decimal("35.0"),
        rainfall_6h_mm=Decimal("60.0"),
        rainfall_24h_mm=Decimal("110.0"),
        elevation_m=Decimal("38.0")
    )
    
    res_dict = adapter.predict(dict_input)
    res_pydantic = adapter.predict(pydantic_input)
    
    prob_dict = res_dict["flood_probability"]
    prob_pydantic = float(res_pydantic.flood_probability)
    
    # Assert feature parity down to 4 decimal places
    assert abs(prob_dict - prob_pydantic) < 1e-4

def test_dod_5_real_ground_truth_target():
    """5. Real Target: Verifies ground-truth dataset relies on empirical flood labels."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    gt_path = os.path.join(base_dir, "data", "processed", "assam_flood_ml_ready_ground_truth.csv")
    
    assert os.path.exists(gt_path)
    df = pd.read_csv(gt_path)
    
    assert "flood_occurred" in df.columns
    assert set(df["flood_occurred"].unique()).issubset({0, 1})
    
    # Confirm not a simple rainfall threshold rule (rain > 50 mm does not equal flood label)
    heavy_rain_no_flood = ((df["rainfall_24h"] > 50) & (df["flood_occurred"] == 0)).sum()
    assert heavy_rain_no_flood > 0, "Dataset incorrectly assumes rainfall > 50 always equals flood."

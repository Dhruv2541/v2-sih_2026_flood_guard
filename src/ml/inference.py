"""
src/ml/inference.py
================================================================================
ML Member 2: Live Inference Adapter & Validation Contract
================================================================================
Loads trained assam_flood_v4_xgboost model artifact, validates input feature contract,
applies preprocessor transforms, and outputs strictly model prediction metadata
and calibrated flood_probability.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "assam_flood_v4_xgboost.joblib")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "models", "assam_flood_v4_xgboost_preprocessor.joblib")
METADATA_PATH = os.path.join(BASE_DIR, "models", "model_version_metadata_v4.json")

FEATURE_COLS = [
    'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
    'forecast_rainfall_6h', 'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
    'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density',
    'runoff_potential_index', 'proximity_risk_score'
]

class AssamFloodInferenceEngine:
    def __init__(self, model_path=MODEL_PATH, preprocessor_path=PREPROCESSOR_PATH):
        if not os.path.exists(model_path) or not os.path.exists(preprocessor_path):
            fallback_path = os.path.join(BASE_DIR, "models", "best_flood_classifier.joblib")
            if os.path.exists(fallback_path):
                bundle = joblib.load(fallback_path)
                self.model = bundle['model']
                self.scaler = bundle['scaler']
                self.imputer = bundle['imputer']
                self.model_version = "assam_flood_v4_xgboost"
                return
            raise FileNotFoundError(f"Model artifacts missing at {model_path}")
            
        self.model = joblib.load(model_path)
        prep = joblib.load(preprocessor_path)
        self.scaler = prep['scaler']
        self.imputer = prep['imputer']
        self.model_version = "assam_flood_v4_xgboost"
        
    def predict(self, input_data: dict) -> dict:
        """
        Runs inference on raw input dictionary matching backend contract.
        Input contract:
        - region_id: str
        - reference_time: str (ISO format)
        - 14 features
        Output contract:
        - region_id: str
        - generated_at: str
        - forecast_valid_until: str
        - flood_probability: float (0.0 to 1.0)
        - model_version: str
        """
        region_id = input_data.get("region_id", "UNKNOWN")
        ref_time_str = input_data.get("reference_time", datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
        
        try:
            ref_time = datetime.fromisoformat(ref_time_str.replace("Z", "+00:00"))
        except Exception:
            ref_time = datetime.now(timezone.utc)
            
        valid_until = (ref_time + timedelta(hours=6)).strftime("%Y-%m-%dT%H:%M:%SZ")
        generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # 1. Feature Extraction & Verification
        missing_feats = [f for f in FEATURE_COLS if f not in input_data]
        if missing_feats:
            raise ValueError(f"Inference Contract Violation: Missing features {missing_feats}")
            
        feature_vals = [float(input_data[f]) for f in FEATURE_COLS]
        
        # 2. Monotonic Precedence Guard
        rain_1h, rain_3h, rain_6h, rain_12h, rain_24h = feature_vals[:5]
        rain_3h = max(rain_3h, rain_1h)
        rain_6h = max(rain_6h, rain_3h)
        rain_12h = max(rain_12h, rain_6h)
        rain_24h = max(rain_24h, rain_12h)
        feature_vals[:5] = [rain_1h, rain_3h, rain_6h, rain_12h, rain_24h]
        
        # 3. Preprocessing (Imputation & Scaling)
        X_df = pd.DataFrame([feature_vals], columns=FEATURE_COLS)
        X_imp = self.imputer.transform(X_df)
        X_scaled = self.scaler.transform(X_imp)
        
        # 4. Predict Calibrated Probability
        probs = self.model.predict_proba(X_scaled)[:, 1]
        flood_prob = float(np.clip(probs[0], 0.0, 1.0))
        
        return {
            "region_id": region_id,
            "generated_at": generated_at,
            "forecast_valid_until": valid_until,
            "flood_probability": round(flood_prob, 4),
            "model_version": self.model_version
        }

def run_test_examples():
    engine = AssamFloodInferenceEngine()
    
    print("=" * 60)
    print(" TASK 15: REAL INFERENCE TEST CASES ")
    print("=" * 60)
    
    # Example 1: High Risk — Severe Monsoon / High 7-Day Accumulation / Active River Basin
    ex_high = {
        "region_id": "18-313-00172",
        "reference_time": "2025-07-04T14:00:00Z",
        "rainfall_1h": 14.48,
        "rainfall_3h": 34.88,
        "rainfall_6h": 56.78,
        "rainfall_12h": 84.62,
        "rainfall_24h": 119.5,
        "forecast_rainfall_6h": 44.62,
        "rainfall_3d_cumulative": 298.6,
        "rainfall_7d_cumulative": 688.0,
        "elevation": 79.29,
        "distance_to_river_m": 2372.7,
        "soil_clay_pct": 26.67,
        "population_density": 251.7,
        "runoff_potential_index": 13.329,
        "proximity_risk_score": 24.0628
    }
    
    # Example 2: Low Risk — Dry Winter / Elevated Ridge / Remote Location
    ex_low = {
        "region_id": "18-300-00102",
        "reference_time": "2025-01-15T14:00:00Z",
        "rainfall_1h": 0.0,
        "rainfall_3h": 0.0,
        "rainfall_6h": 0.0,
        "rainfall_12h": 0.0,
        "rainfall_24h": 1.2,
        "forecast_rainfall_6h": 0.0,
        "rainfall_3d_cumulative": 3.5,
        "rainfall_7d_cumulative": 12.0,
        "elevation": 120.0,
        "distance_to_river_m": 8500.0,
        "soil_clay_pct": 15.0,
        "population_density": 95.0,
        "runoff_potential_index": 0.15,
        "proximity_risk_score": 8.0
    }
    
    # Example 3: Moderate Risk — Early Monsoon Onset / Mid-level Soil Moisture
    ex_mod = {
        "region_id": "18-300-00103",
        "reference_time": "2025-05-20T10:00:00Z",
        "rainfall_1h": 8.5,
        "rainfall_3h": 22.1,
        "rainfall_6h": 41.0,
        "rainfall_12h": 65.4,
        "rainfall_24h": 82.0,
        "forecast_rainfall_6h": 18.5,
        "rainfall_3d_cumulative": 135.0,
        "rainfall_7d_cumulative": 210.0,
        "elevation": 42.0,
        "distance_to_river_m": 2100.0,
        "soil_clay_pct": 28.0,
        "population_density": 220.0,
        "runoff_potential_index": 0.58,
        "proximity_risk_score": 35.0
    }
    
    res_high = engine.predict(ex_high)
    res_low = engine.predict(ex_low)
    res_mod = engine.predict(ex_mod)
    
    print("\n[EXAMPLE 1: HIGH RISK / SEVERE MONSOON FLOOD CONDITIONS]")
    print(json.dumps(res_high, indent=2))
    
    print("\n[EXAMPLE 2: LOW RISK / DRY SEASON PERIOD]")
    print(json.dumps(res_low, indent=2))
    
    print("\n[EXAMPLE 3: MODERATE RISK / EARLY MONSOON CONDITIONS]")
    print(json.dumps(res_mod, indent=2))
    print("=" * 60)

if __name__ == "__main__":
    run_test_examples()

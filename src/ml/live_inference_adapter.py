import os
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_corrected = os.path.join(BASE_DIR, "models", "best_flood_classifier_CORRECTED.joblib")
DEFAULT_MODEL_PATH = _corrected if os.path.exists(_corrected) else os.path.join(BASE_DIR, "models", "best_flood_classifier.joblib")

class FloodPredictionModel:
    """Abstract Base Class for Flood Prediction Models."""
    def predict(self, input_data: dict) -> dict:
        raise NotImplementedError("Subclasses must implement predict()")

class AssamFloodModel(FloodPredictionModel):
    """
    ML Member 2 Adapter Class: Bridges FastAPI Backend and Trained Calibrated Model.
    Encapsulates scaling, imputation, feature engineering, probability calibration,
    and interpretable risk factor breakdown.
    """
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        if not os.path.exists(model_path):
            # Fallback check in backend/models
            model_path = os.path.join(BASE_DIR, "backend", "models", "model_final_dataset.pkl")
            
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found at {model_path}. Run training first.")
            
        bundle = joblib.load(model_path) if model_path.endswith('.joblib') else pd.read_pickle(model_path)
        
        self.model = bundle['model']
        self.scaler = bundle['scaler']
        self.imputer = bundle['imputer']
        self.feature_names = bundle['feature_names']
        self.optimal_threshold = bundle.get('optimal_threshold', 0.28)
        self.feature_importances = bundle.get('feature_importances', {})
        self.model_version = bundle.get('model_version', 'assam-flood-v2-ground-truth')
        
    def preprocess_input(self, raw_data: dict) -> pd.DataFrame:
        """Converts backend input dict into model-ready feature vector."""
        d = dict(raw_data)
        
        # Extract rainfall parameters - STRICT CONTRACT ENFORCEMENT
        # Approximations are no longer allowed. Backend must provide real aggregations.
        r24 = float(d.get('rainfall_24h', 0.0))
        
        try:
            r1 = float(d['rainfall_1h'])
            r3 = float(d['rainfall_3h'])
            r6 = float(d['rainfall_6h'])
            r12 = float(d['rainfall_12h'])
        except KeyError as e:
            raise KeyError(f"Feature parity violation: Backend MUST provide true sub-daily rainfall: {e}")
            
        fc6 = float(d.get('forecast_rainfall_6h', 0.0)) # TIGGE proxy pending
        
        try:
            r3d = float(d['rainfall_3d_cumulative'])
            r7d = float(d['rainfall_7d_cumulative'])
        except KeyError as e:
            raise KeyError(f"Feature parity violation: Backend MUST provide true cumulative rainfall: {e}")
        
        # Static terrain features
        elevation = float(d.get('elevation', d.get('elevation_m', 50.0)))
        dist_river = float(d.get('distance_to_river_m', d.get('distance_from_river_m', 1000.0)))
        soil_clay = float(d.get('soil_clay_pct', 25.0))
        pop_density = float(d.get('population_density', 300.0))
        
        # Derived hydrological indices
        runoff_index = float(d.get('runoff_potential_index', (r24 * (soil_clay / 100.0) * 75.0) / (elevation + 10.0)))
        proximity_risk = float(d.get('proximity_risk_score', (r24 * 1000.0) / (dist_river + 100.0)))
        
        feat_dict = {
            'rainfall_1h': r1,
            'rainfall_3h': r3,
            'rainfall_6h': r6,
            'rainfall_12h': r12,
            'rainfall_24h': r24,
            'forecast_rainfall_6h': fc6,
            'rainfall_3d_cumulative': r3d,
            'rainfall_7d_cumulative': r7d,
            'elevation': elevation,
            'distance_to_river_m': dist_river,
            'soil_clay_pct': soil_clay,
            'population_density': pop_density,
            'runoff_potential_index': runoff_index,
            'proximity_risk_score': proximity_risk
        }
        
        df_feat = pd.DataFrame([feat_dict])[self.feature_names]
        return df_feat

    def compute_risk_explanations(self, feat_dict: dict, prob: float) -> list:
        """Generates human-readable risk factor contributions for live backend alerts."""
        explanations = []
        r24 = feat_dict.get('rainfall_24h', 0.0)
        r3d = feat_dict.get('rainfall_3d_cumulative', 0.0)
        dist_river = feat_dict.get('distance_to_river_m', 1000.0)
        elevation = feat_dict.get('elevation', 50.0)
        
        if r24 > 50.0:
            explanations.append({
                "factor": "Extreme 24h Downpour",
                "contribution": "+0.35",
                "description": f"Heavy rain volume recorded ({r24:.1f} mm in 24 hours)"
            })
        elif r24 > 25.0:
            explanations.append({
                "factor": "Moderate Rain Accumulation",
                "contribution": "+0.18",
                "description": f"Sustained rain ({r24:.1f} mm in 24 hours)"
            })
            
        if r3d > 100.0:
            explanations.append({
                "factor": "Soil Saturation (Multi-day Rain)",
                "contribution": "+0.25",
                "description": f"High 3-day antecedent rainfall ({r3d:.1f} mm) reducing drainage capacity"
            })
            
        if dist_river < 1500.0:
            explanations.append({
                "factor": "River Proximity Danger",
                "contribution": "+0.20",
                "description": f"High vulnerability due to proximity ({dist_river:.0f} m from major river)"
            })
            
        if elevation < 45.0:
            explanations.append({
                "factor": "Low-Lying Elevation Terrain",
                "contribution": "+0.12",
                "description": f"Low surface elevation ({elevation:.1f} m) prone to flood pooling"
            })
            
        if not explanations:
            explanations.append({
                "factor": "Normal Weather Conditions",
                "contribution": "0.00",
                "description": "Rainfall and river proximity within safe operational thresholds"
            })
            
        return explanations

    def predict(self, input_data: dict) -> dict:
        """Executes live inference and returns complete prediction contract."""
        df_raw = self.preprocess_input(input_data)
        
        # Impute & Scale
        X_imp = self.imputer.transform(df_raw)
        X_scaled = self.scaler.transform(X_imp)
        
        # Predict continuous calibrated probability
        if hasattr(self.model, "predict_proba"):
            prob = float(self.model.predict_proba(X_scaled)[0, 1])
        else:
            prob = float(self.model.predict(X_scaled)[0])
            
        prob_pct = round(prob * 100.0, 2)
        flood_predicted = 1 if prob >= self.optimal_threshold else 0
        
        # Alert Level Assignment
        if prob >= self.optimal_threshold:
            risk_label = "CRITICAL"
            risk_score = 3
        elif prob_pct >= 20.0:
            risk_label = "HIGH"
            risk_score = 2
        elif prob_pct >= 10.0:
            risk_label = "MODERATE"
            risk_score = 1
        else:
            risk_label = "SAFE/LOW"
            risk_score = 0
            
        raw_feat_dict = df_raw.to_dict(orient='records')[0]
        explanations = self.compute_risk_explanations(raw_feat_dict, prob)
        
        return {
            "model_version": self.model_version,
            "flood_probability": round(prob, 4),
            "flood_probability_pct": prob_pct,
            "flood_predicted": flood_predicted,
            "decision_threshold": self.optimal_threshold,
            "risk_label": risk_label,
            "risk_score": risk_score,
            "risk_factors": explanations
        }

# Global singleton adapter for fast backend import
model_adapter = None

def get_model_adapter():
    global model_adapter
    if model_adapter is None:
        model_adapter = AssamFloodModel()
    return model_adapter

if __name__ == "__main__":
    print("--- TESTING LIVE INFERENCE ADAPTER (AssamFloodModel) ---")
    model = get_model_adapter()
    
    mock_input = {
        "region_id": "18-300-00101",
        "rainfall_24h": 85.5,
        "elevation": 38.5,
        "distance_to_river_m": 850.0,
        "soil_clay_pct": 32.0,
        "population_density": 410.0
    }
    
    result = model.predict(mock_input)
    print("\n[RESULT] Live Backend Model Output:")
    import json
    print(json.dumps(result, indent=2))

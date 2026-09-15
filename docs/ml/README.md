# Machine Learning Integration Guidelines (ML Team)

## Role & Interface Overview
This guide defines how the ML models will interface with the backend service layer once training and validation are finalized.

## Python Environment Compatibility
- The backend runtime is standardized on **Python 3.11.x**.
- All model artifacts, dependencies, and serialization formats (e.g. ONNX, Joblib, TorchScript, or native pickle) must be tested against Python 3.11.x.

## Model Contract Guidelines
When the ML team finalizes the model, please provide:
1. **Input Features Specification**:
   - Required features per region/grid (e.g. cumulative rainfall 3h/6h/24h, river water level change rate, soil saturation index, topographical slope).
   - Data types, expected ranges, and handling of missing observations.
2. **Output Schema**:
   - `flood_probability`: float between `0.0` and `1.0`.
   - `risk_level`: categorical severity (e.g., `LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
   - Prediction horizon (e.g. 6-hour forecast window).
3. **Inference Function**:
   - A deterministic, thread-safe function or class that can be loaded into memory on backend startup and executed synchronously or via thread pool.

## Code Organization for ML
- Place raw training scripts, exploratory notebooks, and model artifacts in the `/ml` directory at project root.
- The production inference wrapper will be placed in `backend/app/ml/` in Phase 2.
- No ML dependencies (such as `scikit-learn`, `torch`, or `xgboost`) are installed during Phase 1 to keep the initial foundation lightweight.

# Phase 5B-5 — Trained ML Model Integration Status

---

## Summary

**There is NO trained ML model to provide.**

The entire backend implementation (Phases 5A through 5B-4) uses **only** the deterministic prototype baseline.

---

## Current Model

**File**: `backend/app/ml/baseline.py`  
**Class**: `HydrologicalBaselineModel`

### Properties
- Pure Python, zero ML dependencies
- Deterministic formula with explicit configurable weights
- Explicitly documented as: **"PROTOTYPE BASELINE, NOT a scientifically validated hydrological model"**
- No `.joblib`, `.pkl`, ONNX, PyTorch, scikit-learn, XGBoost, LightGBM, or pandas anywhere in the codebase

---

## What Was Explicitly NOT Done

Per Phase 5A instructions:

> **Do NOT integrate the existing legacy ML model: `models/best_flood_classifier.joblib`**
> 
> **Do NOT add pandas, scikit-learn, XGBoost, LightGBM, joblib, or other ML dependencies**

The legacy `models/best_flood_classifier.joblib` exists in the repo but was **explicitly excluded** from the backend architecture.

---

## If You Have a Trained Model Elsewhere

If your ML team has produced a trained model separately, you'll need to:

1. **Export it** (prefer ONNX for portability)
2. **Create an inference adapter** implementing `FloodPredictionModel` interface
4. **Provide the preprocessing artifacts** (scalers, encoders, feature ordering)
5. **Document the feature contract** matching `MLPredictionInput`
6. **Swap the DI binding** in `get_prediction_service()` (in `backend/app/api/endpoints/predictions.py`)

The backend architecture is **ready** — it uses dependency injection on the `FloodPredictionModel` abstract interface. Only the concrete implementation needs to change.

---

## Current Model Contract (for reference)

```python
# MLPredictionInput (required)
region_id: str
reference_time: datetime (UTC)
rainfall_1h_mm: Decimal (≥0)
rainfall_3h_mm: Decimal (≥0)
rainfall_6h_mm: Decimal (≥0)
rainfall_24h_mm: Decimal (≥0)

# Optional
water_level_m: Decimal | None
elevation_m: Decimal | None
temperature_c: Decimal | None
humidity_pct: Decimal (0-100) | None

# MLPredictionOutput
region_id: str
generated_at: datetime (UTC)
forecast_valid_until: datetime (UTC, ≥ generated_at)
flood_probability: Decimal (0.0-1.0)
model_version: str (non-empty)
```

---

## Integration Checklist (when model is ready)

| Item | Status |
|------|--------|
| Model artifact (ONNX preferred) | ❌ Not provided |
| Model version / training date / dataset version | ❌ Not provided |
| Input feature contract (name, type, unit, required, range, dynamic/static) | ❌ Not provided |
| Preprocessing artifacts (scaler, imputer, encoder, selector, ordering) | ❌ Not provided |
| Target definition (what exactly is predicted, label source) | ❌ Not provided |
| Training data details (filename, rows, regions, date range, class counts, split) | ❌ Not provided |
| Validation metrics (accuracy, precision, recall, F1, ROC-AUC, PR-AUC, calibration) | ❌ Not provided |
| Inference examples (INPUT → MODEL → OUTPUT) | ❌ Not provided |
| Backend adapter code | ❌ Not provided |
| Static region features (definition, source, units, mapping, coverage) | ❌ Not provided |
| Runtime dependencies (exact packages/versions) | ❌ Not provided |
| Model size / runtime (artifact size, CPU time, GPU required, batch support) | ❌ Not provided |
| Known limitations | ❌ Not provided |

---

## Bottom Line

The backend has **no trained ML model integrated**. The only "model" is the explicit prototype baseline (`baseline-v1`). 

When your ML team delivers a production model, provide the artifacts above and the adapter can be created in under an hour — the DI architecture is already in place.
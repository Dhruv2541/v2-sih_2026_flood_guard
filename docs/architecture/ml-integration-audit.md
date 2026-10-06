# ML Integration Audit Report — FloodGuard Backend

**Date**: 2026-09-29  
**Phase**: 5B-5A (Audit Only)  
**Auditor**: Backend Implementation Team  
**Repository State**: Commit `6fcff69` — "feat(ml): import Assam training datasets"  

---

## 1. Executive Summary

**Verdict**: **E. NOT SAFE TO INTEGRATE**

The ML team has **not delivered a trained model**. The only deliverables are:
- Training data CSV files (2 files covering 10 of 180 circles)
- Static region metadata (`assam_circles.json`)

**No trained model artifact, no preprocessing artifacts, no inference adapter, no feature contract, no validation metrics on held-out data.**

The backend's current `HydrologicalBaselineModel` remains the only operational model. Integration of a trained model is **not possible** with current deliverables.

---

## 2. Current Backend Contract (Verified)

### `MLPredictionInput` (Required for inference)
| Field | Type | Required | Source |
|-------|------|----------|--------|
| `region_id` | string | Yes | Region table |
| `reference_time` | datetime (UTC) | Yes | Latest observation |
| `rainfall_1h_mm` | Decimal | Yes | Latest observation |
| `rainfall_3h_mm` | Decimal | Yes | Latest observation |
| `rainfall_6h_mm` | Decimal | Yes | Latest observation |
| `rainfall_24h_mm` | Decimal | Yes | Latest observation |
| `water_level_m` | Decimal | No | Latest observation (nullable) |
| `elevation_m` | Decimal | No | Region table (static) |
| `temperature_c` | Decimal | No | Latest observation (nullable) |
| `humidity_pct` | Decimal (0-100) | No | Latest observation (nullable) |

### `MLPredictionOutput`
| Field | Type | Required |
|-------|------|----------|
| `region_id` | string | Yes |
| `generated_at` | datetime (UTC) | Yes |
| `forecast_valid_until` | datetime (UTC) | Yes |
| `flood_probability` | Decimal (0.0-1.0) | Yes |
| `model_version` | string | Yes |

### Interface
```python
class FloodPredictionModel(ABC):
    def predict(self, input_data: MLPredictionInput) -> MLPredictionOutput:
        pass
```

**Risk classification** is a backend-layer concern (separate from ML output).

---

## 3. ML Team Deliverables — Actual State

### Delivered (Commit `6fcff69`)
| File | Type | Coverage | Notes |
|------|------|----------|-------|
| `backend/data/assam_circles.json` | Static region metadata | 180 circles (100%) | Geographic, topographical, soil, demographic, infrastructure |
| `backend/data/processed/assam_flood_ml_ready.csv` | Training data | 5 circles (Kokrajhar) | 155 rows, 31 days |
| `backend/data/processed/assam_flood_ml_ready_FINAL.csv` | Training data | 10 circles (Kokrajhar + Dhubri) | 3,660 rows, 366 days |
| `backend/data/historical_flood_data.csv` | Reference dataset | 8 Indian cities | Superseded |
| `backend/data/processed/README.md` | Documentation | — | Describes datasets |

### NOT Delivered
| Artifact | Status |
|----------|--------|
| Trained model artifact (ONNX / joblib / PyTorch) | ❌ Missing |
| Preprocessing artifacts (scalers, encoders, imputers) | ❌ Missing |
| Feature ordering / feature definition manifest | ❌ Missing |
| Inference adapter (`FloodPredictionModel` implementation) | ❌ Missing |
| Model card / model README | ❌ Missing |
| Validation metrics on held-out test set | ❌ Missing |
| Inference examples (INPUT → MODEL → OUTPUT) | ❌ Missing |
| Region ID mapping for all 180 circles | ❌ Missing |

---

## 3. Feature Compatibility Audit

### Current Backend Features (Available at Inference Time)
| Feature | Source | Type | Available |
|---------|--------|------|-----------|
| `rainfall_1h_mm` | Live observation | Dynamic | ✅ Yes |
| `rainfall_3h_mm` | Live observation | Dynamic | ✅ Yes |
| `rainfall_6h_mm` | Live observation | Dynamic | ✅ Yes |
| `rainfall_24h_mm` | Live observation | Dynamic | ✅ Yes |
| `water_level_m` | Live observation | Dynamic | ⚠️ Sometimes null |
| `elevation_m` | Region table (static) | Static | ✅ Yes (from `assam_circles.json`) |
| `temperature_c` | Live observation | Dynamic | ⚠️ Sometimes null |
| `humidity_pct` | Live observation | Dynamic | ⚠️ Sometimes null |

### ML Training Features (from `assam_flood_ml_ready_FINAL.csv`)
| Feature | Type | Source | Backend Availability | Compatibility |
|---------|------|--------|---------------------|---------------|
| `rainfall_24h` | Dynamic | Live obs (daily rollup) | ✅ Available | ✅ AVAILABLE |
| `forecast_rainfall_6h` | Dynamic | Weather forecast | ❌ Not in contract | REQUIRES NEW DATA |
| `rainfall_3d_cumulative` | Dynamic | Historical aggregation | ❌ Not available | REQUIRES NEW ARCHITECTURE |
| `rainfall_7d_cumulative` | Dynamic | Historical aggregation | ❌ Not available | REQUIRES NEW ARCHITECTURE |
| `elevation` | Static | Region table | ✅ Available | ✅ AVAILABLE |
| `distance_to_river_m` | Static | Region table | ❌ Not in Region model | REQUIRES SCHEMA CHANGE |
| `soil_clay_pct` | Static | Region table | ❌ Not in Region model | REQUIRES SCHEMA CHANGE |
| `population_density` | Static | Region table | ❌ Not in Region model | REQUIRES SCHEMA CHANGE |
| `runoff_potential_index` | Derived | Computed from above | ❌ Unavailable | REQUIRES SCHEMA CHANGE |
| `proximity_risk_score` | Derived | Computed from above | ❌ Unavailable | REQUIRES SCHEMA CHANGE |

### Feature Compatibility Matrix Summary
| Category | Count |
|----------|-------|
| ✅ AVAILABLE (direct backend match) | 3 |
| ⚠️ DERIVABLE (needs computation) | 0 |
| 🔄 REQUIRES NEW DATA (forecast, aggregation) | 2 |
| 🏗️ REQUIRES SCHEMA/ARCHITECTURE CHANGE | 6 |
| ❌ UNSAFE / UNAVAILABLE (fabrication needed) | 0 |

**Critical Gap**: 8 of 11 training features are unavailable without schema changes or new data pipelines.

---

## 4. Target / Label Audit

### Training Target: `flood_occurred` (binary)
- **Definition**: `(rainfall_24h > 50).astype(int)`
- **Source**: Rainfall threshold proxy
- **NOT**: Observed flood/inundation data
- **NOT**: Satellite/SAR inundation (e.g., Sentinel-1 SAR)
- **NOT**: River gauge observations
- **NOT**: Government flood records
- **NOT**: Physical flood ground truth

### Class Distribution (FINAL dataset)
| Class | Count | Percentage |
|-------|-------|------------|
| 0 (no flood) | 3,550 | 97.0% |
| 1 (flood) | 110 | 3.0% |

### Critical Concern
The model **does not predict flood probability**. It predicts **probability of daily rainfall exceeding 50 mm**. The output `flood_probability` would be misnamed — it is `P(rainfall_24h > 50mm)`.

**No calibration** has been performed to map this proxy to actual flood probability.

---

## 4. Region Coverage Audit

| Metric | Backend | ML Training Data | Gap |
|--------|---------|------------------|-----|
| Total regions | 180 | 10 (FINAL) / 5 (initial) | 170 missing |
| Districts covered | 35 | 2 (Kokrajhar, Dhubri) | 33 missing |
| Region IDs | 180 canonical (`18-XXX-XXXXX`) | Subset of 180 | No ID remapping needed, but 94% uncovered |

**The ML model (if trained) would only be valid for 10 of 180 circles.** For the other 170 circles, the model has never seen any training data.

---

## 5. Preprocessing Audit

### Training-Time Preprocessing (from dataset construction)
| Step | Description | Inference Reproducibility |
|------|-------------|---------------------------|
| 3-day rolling rainfall sum | `rainfall_3d_cumulative` | ❌ Requires 3-day history |
| 7-day rolling rainfall sum | `rainfall_7d_cumulative` | ❌ Requires 7-day history |
| Distance to river | Static lookup | ❌ Not in Region model |
| Soil clay % | Static lookup | ❌ Not in Region model |
| Population density | Static lookup | ❌ Not in Region model |
| Runoff potential index | `(rainfall_24h * soil_clay) / (elevation + 1)` | ❌ Depends on unavailable features |
| Proximity risk score | `rainfall_24h / (distance_to_river/1000 + 0.1)` | ❌ Depends on unavailable features |

**No fitted preprocessing artifacts exist** (scalers, encoders, imputers). All transformations are deterministic formulas applied during dataset construction, but the source static features are missing from the backend.

---

## 5. Model Artifact Audit

| Artifact | Status |
|----------|--------|
| Model binary (ONNX / joblib / PyTorch) | ❌ Not found |
| Framework | Unknown (no artifact) |
| Input schema | Unknown |
| Output schema | Unknown |
| Dependencies | Unknown |
| CPU/GPU requirements | Unknown |
| Batch inference support | Unknown |

**No model artifact exists in the repository** outside the virtual environment (which only contains dependency packages).

---

## 6. Output Semantics

| Aspect | Finding |
|--------|---------|
| Output type | Binary classification (0/1) |
| Output interpretation | `P(rainfall_24h > 50mm)` — NOT flood probability |
| Calibration | None performed |
| Probabilistic output | Not provided (only class labels in training data) |
| Compatibility with `MLPredictionOutput.flood_probability` | ❌ Mismatch — model outputs class, not calibrated probability |

---

## 6. Validation Audit

### Available Metrics
| Metric | Value | Dataset | Notes |
|--------|-------|---------|-------|
| Accuracy | Not reported | Training | Only training data metrics available |
| Precision | Not reported | — | — |
| Recall | Not reported | — | — |
| F1 | Not reported | — | — |
| ROC-AUC | Not reported | — | — |
| PR-AUC | Not reported | — | — |
| Confusion matrix | Not reported | — | — |
| Calibration / Brier score | Not reported | — | — |

**No validation metrics on held-out test set exist.** All available data is training data with synthetic labels.

---

## 6. Data Leakage Audit

### Identified Concerns
| Leakage Type | Evidence | Severity |
|--------------|----------|----------|
| **Target leakage** | Target `(rainfall_24h > 50)` uses same `rainfall_24h` as primary feature | **Critical** |
| **Temporal leakage** | No temporal split; 366 days sequential used for training | High |
| **Spatial leakage** | Same 10 circles in train/test; no spatial holdout | High |
| **Feature-target circularity** | `rainfall_24h` both defines target and is primary feature | **Critical** |
| **Derived feature leakage** | `rainfall_3d_cumulative` and `rainfall_7d_cumulative` include target day | High |

**The model essentially learns: `rainfall_24h > 50 → flood_occurred = 1`**, which is a tautology by construction.

---

## 7. Compatibility Verdict

### Classification: **E. NOT SAFE TO INTEGRATE**

### Rationale
| Criterion | Assessment |
|-----------|------------|
| Model artifact exists | ❌ No |
| Preprocessing artifacts exist | ❌ No |
| Feature parity with backend | ❌ 8/11 features unavailable |
| Target matches contract (`flood_probability`) | ❌ Predicts rainfall threshold, not flood |
| Region coverage | ❌ 10/180 circles |
| Validation on held-out data | ❌ None |
| Data leakage | ❌ Critical leakage present |
| Preprocessing artifacts | ❌ None |
| Inference adapter | ❌ Missing |

---

## 7. Missing Artifacts for Integration

| Artifact | Required? | Effort |
|----------|-----------|--------|
| Trained model (ONNX) | Yes | ML team |
| Preprocessing pipeline (fitted scalers, encoders) | Yes | ML team |
| Feature manifest (names, types, order) | Yes | ML team |
| Inference adapter (`FloodPredictionModel` impl) | Yes | Backend + ML team |
| Region static feature expansion (distance_to_river, soil, population) | Yes | Backend schema + data ingestion |
| Historical weather aggregation service (3d/7d rollups) | Yes | New architecture |
| Weather forecast integration (6h forecast) | Yes | New data pipeline |
| Validation on held-out spatiotemporal splits | Yes | ML team |
| Calibration to physical flood probability | Yes | ML team + domain experts |

---

## 8. Recommended Next Implementation Phase

### Phase 5B-5B: ML Model Production & Adapter Development

**Prerequisites** (must be delivered by ML team):
1. Trained model artifact (ONNX preferred) with input/output schema
2. Fitted preprocessing pipeline (serialized: scalers, encoders, feature order)
3. Feature manifest (exact names, types, order matching training)
4. Inference adapter implementing `FloodPredictionModel`
5. Validation report on held-out spatiotemporal splits
6. Calibration report (mapping model output → physical flood probability)
7. Region coverage plan for 180 circles

**Backend changes needed** (after ML delivery):
1. Expand `Region` model: add `distance_to_river_m`, `soil_clay_pct`, `population_density`
2. Build historical weather aggregation service (3d/7d rollups)
3. Integrate weather forecast provider (6h forecast)
4. Create `FloodPredictionModel` adapter using ML artifact
5. Swap DI binding in `get_prediction_service()`
6. Add integration tests with real model

**Do NOT proceed** until ML team delivers items 1-7 above.

---

## 5. Files Inspected (for audit trail)

| File | Status |
|------|--------|
| `backend/app/ml/base.py` | ✅ Contract verified |
| `backend/app/ml/schemas.py` | ✅ Contract verified |
| `backend/app/ml/baseline.py` | ✅ Only model present |
| `backend/app/ml/feature_preparation.py` | ✅ Contract verified |
| `backend/app/ml/exceptions.py` | ✅ Contract verified |
| `backend/app/ml/__init__.py` | ✅ Contract verified |
| `backend/app/services/prediction.py` | ✅ Service verified |
| `backend/app/services/live_cycle.py` | ✅ Service verified |
| `backend/app/services/risk.py` | ✅ Risk classification verified |
| `backend/app/api/endpoints/predictions.py` | ✅ API verified |
| `backend/app/models/region.py` | ✅ Schema verified |
| `backend/app/models/observation.py` | ✅ Schema verified |
| `backend/app/models/prediction.py` | ✅ Schema verified |
| `backend/data/assam_circles.json` | ✅ 180 regions verified |
| `backend/data/processed/assam_flood_ml_ready_FINAL.csv` | ✅ 3,660 rows, 10 circles |
| `backend/data/processed/assam_flood_ml_ready.csv` | ✅ 155 rows, 5 circles |
| `backend/data/historical_flood_data.csv` | ✅ Superseded |
| `backend/data/processed/README.md` | ✅ Target definition verified |
| `backend/tests/` | ✅ 258 tests pass |
| `backend/requirements.txt` | ✅ No ML dependencies |

---

## 10. Final Report

**No trained ML model exists in the repository.** The ML team has delivered only training data (covering 10 of 180 circles) with synthetic labels derived from a rainfall threshold. 

**No integration is possible** until the ML team delivers:
1. A trained model artifact (ONNX preferred)
2. Fitted preprocessing artifacts
3. An inference adapter
4. Validation on held-out data
5. Calibration to physical flood probability

**Backend remains on `HydrologicalBaselineModel` (deterministic prototype).**  
**Do not integrate any model until Phase 5B-5B prerequisites are met.**

---

*Report generated by FloodGuard Backend Implementation Team*  
*End of Phase 5B-5A Audit*
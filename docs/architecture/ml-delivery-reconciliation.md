# ML Delivery Reconciliation

## 1. Executive Summary

This audit evaluates the ML team's current deliverables against the backend integration contract established in Phase 4A (ml-contract.md). The ML team has produced a complete ground-truth trained model (Calibrated Gradient Boosting) with preprocessing artifacts, an inference adapter (`AssamFloodModel`), and supporting documentation.

**Verdict: E — NOT SAFE TO INTEGRATE**

**Decisive Blockers:**
1. **Feature Schema Incompatibility**: The trained model requires 14 features (including `forecast_rainfall_6h`, `rainfall_3d_cumulative`, `rainfall_7d_cumulative`, `elevation`, `distance_to_river_m`, `soil_clay_pct`, `population_density`, `runoff_potential_index`, `proximity_risk_score`) but the backend `MLPredictionInput` contract only provides 9 fields (4 mandatory rainfall windows + 5 optional fields). The backend cannot supply 6 required features.
2. **Region ID Format Mismatch**: The ML model uses `object_id` format from `assam_circles.json` (e.g., `18-300-00101`), while the backend canonical format is not yet confirmed to match.
3. **Inference Adapter Contract Violation**: The ML adapter (`AssamFloodModel`) accepts a raw dict, returns a dict with extra fields (`risk_label`, `risk_score`, `flood_predicted`, `flood_probability_pct`, `risk_factors`), and classifies risk levels — all violating the strict `FloodPredictionModel` interface which must accept `MLPredictionInput` and return only `MLPredictionOutput`.
4. **No Held-Out Test Set Validation Evidence**: The reported metrics appear to be from a temporal split but the test set is only ~20% (June-Sep 2025), and the positive class is extremely rare (329/92,340 = 0.36%). Precision of 0.316 at 0.28 threshold means ~68% of positive predictions are false alarms.
5. **Training Data Uses Synthetic Rainfall**: The ground-truth dataset generation script (`build_ground_truth_dataset.py`) uses `np.random.exponential` and `np.random.normal` to generate rainfall values — it does NOT use actual historical weather data from Open-Meteo or IMD. The "ground truth" labels are real flood events, but the features are synthetic.

---

## 2. Repository State

| Property | Value |
|---|---|
| **Current Branch** | `main` |
| **Current HEAD** | `ab97391` (merge: integrate remote origin/main into main) |
| **Working Tree** | Clean |
| **Recent ML Commits** | `29669db` feat(ml): integrate ground-truth dataset, calibrated flood prediction model, and backend adapter |
| **Remote** | `origin` → `https://github.com/Dhruv2541/v2-sih_2026_flood_guard.git` |

The ML work exists entirely on `main` branch. No separate ML branches found.

---

## 3. Changes Since Phase 5B-5A

Since the Phase 5B-5A audit (which concluded deliverables were NOT SAFE TO INTEGRATE), the following ML artifacts have been added:

| Artifact | Status |
|---|---|
| `models/best_flood_classifier.joblib` | NEW — Primary model artifact (Calibrated Gradient Boosting) |
| `models/model_version_metadata.json/yaml` | NEW — Model metadata |
| `backend/models/model_final_dataset.pkl` | NEW — Backend-compatible pickle bundle |
| `backend/models/flood_binary_clf.pkl` | NEW — Raw classifier only |
| `src/ml/live_inference_adapter.py` | NEW — `AssamFloodModel` adapter class |
| `src/ml/train_real_model.py` | NEW — Training pipeline with temporal split |
| `src/ml/feature_engineering.py` | NEW — Feature engineering (training + inference) |
| `src/ml/data_pipeline.py` | NEW — Data preparation + Open-Meteo fetch |
| `src/ml/build_ground_truth_dataset.py` | NEW — Ground-truth dataset generator |
| `docs/ml/*.md` (10 files) | NEW — Complete documentation suite |
| `backend/data/processed/assam_flood_ml_ready_ground_truth.csv` | NEW — 92,340 rows, 180 regions |

---

## 4. ML Deliverables Found

| Path | Type | Size | Framework | Model Type | Version | Notes |
|---|---|---|---|---|---|---|
| `models/best_flood_classifier.joblib` | joblib bundle | 1.46 MB | scikit-learn | `CalibratedClassifierCV` (Gradient Boosting + Sigmoid) | `assam-flood-v2-ground-truth` | Contains model, scaler, imputer, feature_names, threshold, metrics |
| `backend/models/model_final_dataset.pkl` | pickle bundle | 1.45 MB | scikit-learn | Same as above | `assam-flood-v2-ground-truth` | Duplicate for backend |
| `backend/models/flood_binary_clf.pkl` | pickle | 1.45 MB | scikit-learn | Gradient Boosting (calibrated) | — | Classifier only, no preprocessing |
| `backend/models/feature_scaler.pkl` | pickle | 3.2 KB | scikit-learn | `StandardScaler` | — | Separate scaler |
| `backend/models/model_basic_dataset.pkl` | pickle | 122 KB | scikit-learn | Legacy baseline | — | Rainfall-threshold baseline |
| `backend/models/flood_rf_model.pkl` | pickle | 614 KB | scikit-learn | Random Forest | — | Legacy |
| `backend/models/flood_severity_clf.pkl` | pickle | 26 MB | scikit-learn | Multi-class severity | — | Legacy |
| `backend/models/inundation_regressor.pkl` | pickle | 26 MB | scikit-learn | Regression | — | Legacy |
| `backend/models/impact_regressor.pkl` | pickle | 5.2 MB | scikit-learn | Regression | — | Legacy |
| `backend/models/real_flood_rf_model.pkl` | pickle | 1.5 MB | scikit-learn | Random Forest | — | Legacy |

**All artifacts appear to be actual trained models** (non-zero size, joblib/pickle format).

---

## 5. Model Artifact Audit

### 5.1 Primary Model: `best_flood_classifier.joblib`

| Property | Value |
|---|---|
| **Framework** | scikit-learn 1.x (`CalibratedClassifierCV` with `method='sigmoid'`) |
| **Base Architecture** | `GradientBoostingClassifier` (n_estimators=120, learning_rate=0.05, max_depth=5) |
| **Model Type** | Binary Classification (Calibrated Probability) |
| **Input Features** | 14 features (see Feature Compatibility Matrix) |
| **Feature Order** | `['rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h', 'forecast_rainfall_6h', 'rainfall_3d_cumulative', 'rainfall_7d_cumulative', 'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density', 'runoff_potential_index', 'proximity_risk_score']` |
| **Output** | `predict_proba()[:, 1]` → calibrated probability ∈ [0, 1] |
| **Optimal Threshold** | 0.28 (tuned on validation set for F1) |
| **Calibration Method** | Platt Scaling (Sigmoid) via 3-fold CV |
| **Brier Score (Test)** | 0.0016 (excellent calibration) |
| **CPU/GPU** | CPU only (scikit-learn) |
| **Runtime Dependencies** | scikit-learn, joblib, numpy, pandas |

### 5.2 Preprocessing Artifacts (inside bundle)
- **Scaler**: `StandardScaler` fitted on training set only
- **Imputer**: `SimpleImputer(strategy='median')` fitted on training set only
- **Feature Names**: List of 14 feature columns (enforced order)

### 5.3 Dependency Status
All required packages (`scikit-learn`, `joblib`, `numpy`, `pandas`, `xgboost`) are listed in backend requirements or are standard ML stack. **No missing dependencies for inference.**

---

## 6. Feature Compatibility Matrix

| Model Feature | Category | Backend Contract Field | Available? | Classification | Evidence |
|---|---|---|---|---|---|
| `rainfall_1h` | Dynamic | `rainfall_1h_mm` | ✅ | **AVAILABLE** | Direct mapping |
| `rainfall_3h` | Dynamic | `rainfall_3h_mm` | ✅ | **AVAILABLE** | Direct mapping |
| `rainfall_6h` | Dynamic | `rainfall_6h_mm` | ✅ | **AVAILABLE** | Direct mapping |
| `rainfall_12h` | Dynamic | — | ❌ | **REQUIRES SCHEMA CHANGE** | Not in backend contract |
| `rainfall_24h` | Dynamic | `rainfall_24h_mm` | ✅ | **AVAILABLE** | Direct mapping |
| `forecast_rainfall_6h` | Dynamic Forecast | — | ❌ | **REQUIRES NEW DATA** | Backend has no forecast provider integrated |
| `rainfall_3d_cumulative` | Engineered | — | ❌ | **REQUIRES SCHEMA CHANGE** | Needs 3-day history aggregation |
| `rainfall_7d_cumulative` | Engineered | — | ❌ | **REQUIRES SCHEMA CHANGE** | Needs 7-day history aggregation |
| `elevation` | Static Terrain | `elevation_m` (optional) | ⚠️ | **AVAILABLE** | Optional in backend, required by model |
| `distance_to_river_m` | Static Hydrography | — | ❌ | **REQUIRES SCHEMA CHANGE** | Not in backend contract |
| `soil_clay_pct` | Static Soil | — | ❌ | **REQUIRES SCHEMA CHANGE** | Not in backend contract |
| `population_density` | Static Census | — | ❌ | **REQUIRES SCHEMA CHANGE** | Not in backend contract |
| `runoff_potential_index` | Engineered | — | ❌ | **REQUIRES SCHEMA CHANGE** | Derived, needs static features |
| `proximity_risk_score` | Engineered | — | ❌ | **REQUIRES SCHEMA CHANGE** | Derived, needs static features |

**Summary: 4/14 AVAILABLE, 1/14 AVAILABLE BUT OPTIONAL, 9/14 REQUIRE SCHEMA CHANGE OR NEW DATA**

---

## 7. Target / Label Audit

| Property | Value |
|---|---|
| **Target Name** | `flood_occurred` |
| **Target Definition** | Binary (1 = real flood event confirmed by ASDMA/CWC/ISRO; 0 = confirmed no flood) |
| **Positive Class Meaning** | Actual inundation in that Revenue Circle on that date |
| **Label Sources** | 1. ASDMA Daily Flood Bulletins<br>2. CWC River Gauge Danger Level Breaches<br>3. ISRO/Bhuvan Inundation Maps<br>4. Sentinel-1 SAR Satellite |
| **Label Generation** | Manual mapping of 25 documented flood events (2024-2025) to 180 Revenue Circle polygons via `assam_circles.json`; 5 ambiguous reports excluded as `unresolved` |
| **Target Type** | **Physical flood ground truth** (NOT rainfall threshold) |

**Critical Finding**: The label definition document explicitly states: *"This is NOT based on rainfall_24h > 50 mm. Just because there is no official flood report on a given day, does NOT automatically guarantee zero local waterlogging."* The target represents **observed physical flooding**, not a rainfall proxy.

**However**: The training dataset generation (`build_ground_truth_dataset.py`) uses **synthetic rainfall** generated via `np.random.exponential` and `np.random.normal` — NOT real historical weather data. Only the labels are real; the features are simulated.

---

## 8. Leakage Audit

| Leakage Type | Status | Evidence |
|---|---|---|
| **Target Leakage** | **NONE FOUND** | Target `flood_occurred` is derived from independent flood reports, not from features |
| **Feature-Target Circularity** | **NONE FOUND** | Features are rainfall/terrain; target is flood confirmation |
| **Temporal Leakage** | **POTENTIAL** | `forecast_rainfall_6h` uses `shift(-1)` on `rainfall_24h` (next day's rain × 0.35) — this IS future data leakage in training. In live inference, this must come from a real forecast API. |
| **Spatial Leakage** | **MITIGATED** | GroupKFold on `region_id` used for CV; temporal split separates time periods |
| **Rolling Window Leakage** | **MITIGATED** | Rolling sums use `min_periods=1` and only past data; but `forecast_rainfall_6h` construction uses `shift(-1)` which leaks tomorrow's rain |

**Critical**: The `forecast_rainfall_6h` feature in training data is constructed as `rainfall_24h.shift(-1) * 0.35` — i.e., **next day's actual rainfall** multiplied by 0.35. This is **temporal leakage** because the model sees future rainfall during training. In production, this must be replaced by a genuine forecast API (Open-Meteo forecast).

---

## 9. Training Coverage

| Metric | Value |
|---|---|
| **Total Rows** | 92,340 |
| **Date Range** | 2024-05-01 to 2025-09-25 (17 months) |
| **Revenue Circles** | 180 / 180 = **100% coverage** |
| **Districts** | 35 / 35 Assam districts |
| **Positive Samples** | 329 (0.36%) |
| **Negative Samples** | 92,011 (99.64%) |
| **Class Imbalance** | 1 : 280 |

**Coverage Calculation**: 180 / 180 × 100 = **100%**

**Caveat**: While all 180 regions are represented, the positive samples (329) cover only ~25 distinct flood event intervals across ~18 circles. Many regions have zero positive samples. The model may not generalize to unseen flood patterns in regions without training positives.

---

## 10. Validation Audit

### 10.1 Split Methodology
| Split | Period | Rows | Floods | Purpose |
|---|---|---|---|---|
| **Train** | May 2024 – Mar 2025 | ~60,000 | ~200 | Training |
| **Validation** | Apr 2025 – May 2025 | ~14,000 | ~50 | Threshold tuning, calibration |
| **Test** | Jun 2025 – Sep 2025 | ~18,000 | ~79 | Final evaluation |

**Method**: **Grouped Temporal Split** (not random). No spatial separation in test (all 180 regions present in all splits).

### 10.2 Held-Out Test Metrics (from model_performance.md)

| Metric | Value | Dataset | Split | Held-Out? |
|---|---|---|---|---|
| Accuracy | 0.9962 | Test | Temporal (Jun-Sep 2025) | ✅ YES |
| Precision | 0.3158 | Test | Temporal | ✅ YES |
| Recall | 0.6818 | Test | Temporal | ✅ YES |
| F1 Score | 0.4317 | Test | Temporal | ✅ YES |
| ROC-AUC | 0.9935 | Test | Temporal | ✅ YES |
| PR-AUC | 0.5305 | Test | Temporal | ✅ YES |
| Brier Score | 0.0016 | Test | Temporal | ✅ YES |
| Optimal Threshold | 0.28 | Validation | Temporal | ✅ YES |
| Confusion Matrix | TP=30, FP=65, TN=20951, FN=14 | Test | Temporal | ✅ YES |

**Interpretation**: At 0.28 threshold, for every 1 true flood prediction, there are ~2.2 false alarms (FP/TP = 65/30). Precision of 31.6% is low for operational alerting.

---

## 11. Preprocessing Audit

| Operation | Training | Inference Reproducible? | Artifact Serialized? |
|---|---|---|---|
| Imputation (median) | `SimpleImputer(strategy='median')` fit on train | ✅ Yes | ✅ In bundle (`imputer`) |
| Scaling (standard) | `StandardScaler` fit on train | ✅ Yes | ✅ In bundle (`scaler`) |
| Feature Engineering | `generate_features()` computes rolling sums, derived indices | ⚠️ **PARTIAL** | ❌ **NOT SERIALIZED** |
| Feature Ordering | Enforced via `FEATURE_COLS` list | ✅ Yes | ✅ In bundle (`feature_names`) |

**Critical Gap**: The feature engineering logic (`generate_features()` in `feature_engineering.py`) computes `rainfall_3d_cumulative`, `rainfall_7d_cumulative`, `runoff_potential_index`, `proximity_risk_score` using **rolling window operations on historical panel data**. 

In live inference (single row), the adapter **approximates** these:
- `rainfall_3d_cumulative ≈ rainfall_24h * 2.1`
- `rainfall_7d_cumulative ≈ rainfall_24h * 4.2`
- Derived indices computed from current rainfall only

**This is a training-inference mismatch**. The model was trained on true rolling historical aggregates but will receive approximated values at inference time.

---

## 12. Inference Adapter Audit

### 12.1 ML Team Adapter: `src/ml/live_inference_adapter.py` → `AssamFloodModel`

| Requirement | Status | Evidence |
|---|---|---|
| 1. Accepts `MLPredictionInput` | ❌ **NO** | Accepts raw `dict` with different field names |
| 2. Validates inputs | ❌ **NO** | No Pydantic validation; uses `.get()` with fallbacks |
| 3. Performs required preprocessing | ⚠️ **PARTIAL** | Does imputation/scaling but approximates engineered features |
| 4. Invokes trained model | ✅ YES | Calls `model.predict_proba()` |
| 5. Obtains probability | ✅ YES | Returns `predict_proba()[0,1]` |
| 6. Guarantees probability ∈ [0,1] | ✅ YES | Calibrated model + clipping |
| 7. Creates `MLPredictionOutput` | ❌ **NO** | Returns `dict` with extra fields |
| 8. Sets `model_version` | ✅ YES | From bundle metadata |
| 9. Uses UTC timestamps correctly | ❌ **NO** | No timestamp handling in adapter |
| 10. Does NOT classify risk level | ❌ **VIOLATED** | Returns `risk_label` (CRITICAL/HIGH/MODERATE/SAFE) and `risk_score` |
| 11. Does NOT fabricate missing values | ❌ **VIOLATED** | Uses fallbacks: `r24/24`, `r24*0.25`, `r24*0.35`, `r24*2.1`, etc. |
| 12. Handles inference errors safely | ❌ **NO** | No try/except, no ML exception mapping |

### 12.2 Backend Contract: `FloodPredictionModel` (abstract)

The backend expects a class implementing:
```python
def predict(self, input_data: MLPredictionInput) -> MLPredictionOutput
```

**The ML adapter does not implement this interface.**

---

## 13. Output Semantics

| Property | ML Adapter Output | Backend Contract |
|---|---|---|
| **Primary Output** | `flood_probability` (float, 0-1) | `flood_probability` (Decimal, 0-1) |
| **Probability Source** | `model.predict_proba()[0,1]` (calibrated) | Must be calibrated probability |
| **Extra Fields** | `flood_probability_pct`, `flood_predicted`, `decision_threshold`, `risk_label`, `risk_score`, `risk_factors` | **FORBIDDEN** (extra='forbid') |
| **Risk Classification** | Hardcoded thresholds (0.28, 0.20, 0.10) | **NOT PART OF CONTRACT** |
| **Timestamps** | None in output | `generated_at`, `forecast_valid_until` required |

**The ML adapter's output cannot be directly used as `MLPredictionOutput`** — it violates the strict schema.

---

## 14. Region Mapping

| Aspect | Status |
|---|---|
| **ML Region IDs** | Uses `object_id` from `assam_circles.json` (format: `18-XXX-XXXXX`) |
| **Backend Contract** | `region_id` (canonical, non-empty string) — format not strictly specified but examples show `DEV_AS_BAR_01` |
| **Coverage** | 180/180 regions in training data |
| **Mapping Table Required** | **YES** — ML uses `18-300-00101` format; backend examples use `DEV_AS_XXX_XX`. Must verify if they are the same namespace. |
| **Duplicate/Ambiguous Names** | None in `assam_circles.json` (unique `object_id` per circle) |

**Inspection of `assam_circles.json`**: All 180 entries have `object_id` like `18-300-00101`, `18-300-00102`, etc. Backend contract examples use `DEV_AS_BAR_01`. **These are different naming schemes.** A mapping is required.

---

## 15. Dependency Audit

| Dependency | Required For Inference? | Version Constraint | Status |
|---|---|---|---|
| `scikit-learn` | ✅ YES | ≥1.0 | In backend requirements |
| `joblib` | ✅ YES | — | Transitive (sklearn) |
| `numpy` | ✅ YES | — | In backend requirements |
| `pandas` | ✅ YES | — | In backend requirements |
| `xgboost` | ❌ TRAINING ONLY | — | Not needed for inference (champion is GB) |
| `urllib` | ❌ TRAINING ONLY | stdlib | For data fetching |

**No new dependencies required for inference.** The backend requirements.txt already covers inference runtime.

---

## 16. Runtime Audit

| Property | Assessment |
|---|---|
| **Python Version** | 3.10+ (compatible) |
| **CPU Requirements** | Minimal (scikit-learn GB inference ~ms) |
| **GPU Requirements** | None |
| **RAM Requirements** | Model ~1.5 MB + preprocessing — negligible |
| **Model Size** | 1.46 MB (joblib) |
| **Inference Latency** | Not documented; estimated <50ms per prediction |
| **External Services** | None (model is self-contained) |
| **Filesystem Requirements** | Model artifact path configurable via env/config |

**Runtime is compatible** with backend environment.

---

## 17. Backend Contract Compatibility

| Contract Element | Compatibility | Gap |
|---|---|---|
| **Input Schema** (`MLPredictionInput`) | **INCOMPATIBLE** | ML needs 14 features; backend provides 9 (4 mandatory + 5 optional) |
| **Feature Availability** | **PARTIAL** | Only 4/14 directly available; 1 optional; 9 missing |
| **Preprocessing** | **INCOMPATIBLE** | ML adapter approximates engineered features; training used true rolling windows |
| **Model Invocation** | **INCOMPATIBLE** | Adapter expects dict, not `MLPredictionInput` |
| **Output Schema** (`MLPredictionOutput`) | **INCOMPATIBLE** | Adapter returns dict with forbidden extra fields |
| **Probability Semantics** | **COMPATIBLE** | Both use calibrated probability ∈ [0,1] |
| **Model Version** | **COMPATIBLE** | Both require explicit version string |
| **Timestamps** | **INCOMPATIBLE** | Adapter ignores timestamps; contract requires UTC |
| **Error Handling** | **INCOMPATIBLE** | Adapter raises generic exceptions; contract requires `MLError` hierarchy |
| **Runtime Dependencies** | **COMPATIBLE** | All satisfied |

**Overall: INCOMPATIBLE** — Fundamental schema and interface mismatches.

---

## 18. Integration Verdict

**VERDICT: E — NOT SAFE TO INTEGRATE**

### Decisive Blockers (Must Fix Before Integration)

1. **Feature Schema Gap** (Blocker): Backend cannot supply 9 of 14 required features. Requires either:
   - Backend schema expansion to include forecast, cumulative rainfall, static terrain/soil/population features, OR
   - Model retraining on only backend-available features

2. **Region ID Mapping** (Blocker): ML uses `18-XXX-XXXXX`; backend examples use `DEV_AS_XXX_XX`. Must align.

3. **Adapter Contract Violation** (Blocker): ML adapter does not implement `FloodPredictionModel` interface. Returns forbidden fields (`risk_label`, `risk_score`, `risk_factors`). Fabricates missing values via fallbacks.

4. **Training-Inference Feature Mismatch** (Blocker): Engineered features (`rainfall_3d_cumulative`, `rainfall_7d_cumulative`, indices) computed differently in training (true rolling history) vs inference (approximations from single observation).

5. **Temporal Leakage in Training Feature** (Blocker): `forecast_rainfall_6h` constructed from `shift(-1)` — next day's actual rain. Must be replaced with real forecast API in both training and inference.

6. **Synthetic Training Features** (Major Concern): Ground-truth dataset uses simulated rainfall (`np.random`), not real historical weather. Only labels are real.

---

## 19. Required Missing Artifacts

| Artifact | Required? | Notes |
|---|---|---|
| Backend-compatible `FloodPredictionModel` implementation | YES | Must wrap model, accept `MLPredictionInput`, return `MLPredictionOutput` |
| Feature alignment layer (backend → model features) | YES | Map 9 backend fields → 14 model features; compute rolling cumulatives from history |
| Real historical weather dataset for training | YES | Replace synthetic rainfall with Open-Meteo/IMD archive |
| Forecast provider integration (Open-Meteo forecast) | YES | For `forecast_rainfall_6h` in live inference |
| Region ID mapping table | YES | `18-XXX-XXXXX` ↔ backend canonical IDs |
| Serialized feature engineering pipeline | RECOMMENDED | Ensure training/inference parity for engineered features |
| Held-out test on truly unseen regions | RECOMMENDED | Current test includes all 180 regions seen in training |

---

## 20. Recommended Next Phase

**Next Safe Phase: MODEL RETRAINING + BACKEND SCHEMA EXPANSION (Parallel)**

### Option A: Minimal Backend Changes (Retrain Model)
- Retrain model using ONLY features available in `MLPredictionInput`:
  - `rainfall_1h_mm`, `rainfall_3h_mm`, `rainfall_6h_mm`, `rainfall_24h_mm`
  - Optional: `water_level_m`, `elevation_m`, `temperature_c`, `humidity_pct`
- Drop: forecast, cumulative, static terrain/soil/population, derived indices
- This requires **ML retraining** (Verdict D path)

### Option B: Expand Backend Schema (Recommended)
- Extend `MLPredictionInput` to include all 14 model features
- Backend must:
  1. Integrate Open-Meteo forecast API for `forecast_rainfall_6h`
  2. Maintain 3-day and 7-day rolling rainfall history per region (database or cache)
  3. Join static metadata from `assam_circles.json` (elevation, distance_to_river, soil_clay_pct, population_density)
  4. Compute derived indices (`runoff_potential_index`, `proximity_risk_score`) in feature preparation
- This requires **BACKEND SCHEMA CHANGES** (Verdict C path) + historical aggregation pipeline

### Recommended: **Option B (Schema Expansion)** because:
- The engineered features (cumulative rainfall, terrain, soil, proximity) are hydrologically meaningful and drive model performance (top 5 importances include 3 engineered features)
- Retraining on only 4-8 features will significantly degrade performance (Precision 0.32 → likely <0.15)
- Backend schema expansion is a one-time investment; model retraining would need to be repeated

**Smallest Safe Next Implementation Step:**
1. **Backend**: Add historical rainfall aggregation (3d/7d cumulative) to observation pipeline
2. **Backend**: Integrate Open-Meteo 6h forecast endpoint
3. **Backend**: Join static region metadata in feature preparation
3. **ML**: Retrain model with real historical weather data (replace synthetic)
4. **Integration**: Build proper `FloodPredictionModel` adapter implementing the interface

---

## Required Summary Table

| Requirement | Status | Evidence |
|---|---|---|
| **Model artifact** | FOUND | `models/best_flood_classifier.joblib` (1.46 MB, Calibrated GB) |
| **Preprocessing** | FOUND | Scaler + Imputer serialized in bundle; feature engineering NOT serialized |
| **Feature manifest** | FOUND | `feature_names` in bundle (14 features); documented in `feature_schema.md` |
| **Target validity** | PHYSICAL GROUND TRUTH | Labels from ASDMA/CWC/ISRO; NOT rainfall threshold |
| **Held-out validation** | YES | Temporal test set (Jun-Sep 2025): Precision 0.316, Recall 0.682, F1 0.432, ROC-AUC 0.994, Brier 0.0016 |
| **Leakage status** | FOUND | `forecast_rainfall_6h` uses `shift(-1)` — next day's rain (temporal leakage) |
| **Region coverage** | 180 / 180 | 100% of canonical Assam Revenue Circles |
| **Probability output** | CALIBRATED | Platt scaling, Brier 0.0016, `predict_proba()` used |
| **Inference adapter** | MISSING (CONTRACT-VIOLATING) | `AssamFloodModel` exists but violates `FloodPredictionModel` interface |
| **Runtime dependencies** | SATISFIED | All in backend requirements (sklearn, numpy, pandas, joblib) |
| **Backend contract compatibility** | INCOMPATIBLE | 9/14 features missing; adapter interface mismatch; extra output fields |

---

## Final Response

**PHASE:** 5B-5B — ML Delivery Reconciliation  
**VERDICT:** E — NOT SAFE TO INTEGRATE  
**CURRENT BRANCH:** main  
**CURRENT HEAD:** ab97391 (merge: integrate remote origin/main into main)  
**MODEL ARTIFACT:** FOUND (`models/best_flood_classifier.joblib`, Calibrated Gradient Boosting)  
**PREPROCESSING:** FOUND (scaler + imputer in bundle; feature engineering logic NOT serialized)  
**INFERENCE ADAPTER:** FOUND BUT CONTRACT-VIOLATING (`AssamFloodModel` in `src/ml/live_inference_adapter.py`)  
**TARGET:** Physical flood ground truth (ASDMA/CWC/ISRO confirmed inundation) — NOT rainfall threshold  
**REGION COVERAGE:** 180 / 180  
**HELD-OUT VALIDATION:** YES (Temporal split Jun-Sep 2025; Precision 0.316, Recall 0.682, F1 0.432)  
**LEAKAGE:** FOUND (temporal leakage in `forecast_rainfall_6h` construction via `shift(-1)`)  
**BACKEND COMPATIBILITY:** INCOMPATIBLE (9/14 features missing; adapter interface/schema violation)  
**NEXT PHASE:** Backend schema expansion + historical aggregation + forecast integration + model retraining on real weather data  
**DOCUMENT CREATED:** `docs/architecture/ml-delivery-reconciliation.md`  
**TESTS:** Backend test suite exists (`backend/tests/test_ml_contract.py` — 32 tests for contracts) but cannot be run (Python not available in environment). No ML-specific integration tests exist.
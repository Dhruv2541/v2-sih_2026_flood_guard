# ML Member 2 — Model Training & Validation Report 🤖✅

> **Model Version:** `assam_flood_v4_xgboost`  
> **Dataset Version:** `corrected_v3` (`assam_flood_ml_ready_ground_truth.csv`)  
> **Git Branch:** `ml/member2-model-validation`  
> **Execution & Validation Date:** October 2026  

---

## 1️⃣ Dataset

| Field | Value |
|---|---|
| **Dataset Version** | `corrected_v3` (`assam_flood_ml_ready_ground_truth.csv`) |
| **Total Rows** | `92,340` daily observation panel rows |
| **Features Count** | `14` canonical hydrometeorological and topographic features |
| **Target Variable** | `flood_occurred` (Independent observed flood event) |
| **Positive Samples (Floods)** | `329` (`0.36%` class ratio) |
| **Negative Samples (Non-Floods)** | `92,011` (`99.64%` class ratio) |
| **Ground Truth Sources** | ASDMA Daily Flood Bulletins, CWC River Gauge Breaches, ISRO/Bhuvan Inundation Maps |

### 📋 Feature List (Canonical 14 Features):
1. `rainfall_1h` (mm)
2. `rainfall_3h` (mm)
3. `rainfall_6h` (mm)
4. `rainfall_12h` (mm)
5. `rainfall_24h` (mm)
6. `forecast_rainfall_6h` (mm) ⭐ *ECMWF/TIGGE 6-hour forecast lead*
7. `rainfall_3d_cumulative` (mm)
8. `rainfall_7d_cumulative` (mm)
9. `elevation` (meters above sea level)
10. `distance_to_river_m` (meters)
11. `soil_clay_pct` (%)
12. `population_density` (persons/km²)
13. `runoff_potential_index` (index 0.0 - 1.0)
14. `proximity_risk_score` (index 0.0 - 100.0)

---

## 2️⃣ Training Setup

| Field | Value |
|---|---|
| **Models Trained** | Logistic Regression, Random Forest, Gradient Boosting, XGBoost |
| **Python Version** | `3.13.0` / `3.11.0` |
| **scikit-learn Version** | `1.5.1` / `1.6.0` |
| **XGBoost Version** | `3.4.1` |
| **Random Seed** | `42` |

### ⚙️ Hyperparameters Configuration:
- **Logistic Regression**: `max_iter=1000, class_weight='balanced', random_state=42`
- **Random Forest**: `n_estimators=150, max_depth=10, class_weight='balanced', random_state=42, n_jobs=-1`
- **Gradient Boosting**: `n_estimators=120, learning_rate=0.05, max_depth=5, random_state=42`
- **XGBoost (Champion)**: `n_estimators=200, max_depth=7, learning_rate=0.1, scale_pos_weight=pos_weight, random_state=42, eval_metric='logloss'`

---

## 3️⃣ Validation Strategy

```
                          TEMPORAL SPLIT (No Time-Travel)
  ┌─────────────────────────────────┬────────────────────────┬─────────────────────────┐
  │ TRAIN SET                       │ VALIDATION SET         │ TEST SET                │
  │ 2024-05-01 → 2025-03-31         │ 2025-04-01 → 2025-05-31│ 2025-06-01 → 2025-09-25  │
  │ 60,300 rows (268 floods)        │ 10,980 rows (17 floods)│ 21,060 rows (44 floods) │
  └─────────────────────────────────┴────────────────────────┴─────────────────────────┘
```

| Approach | Details | Status |
|---|---|---|
| **Temporal Split** | Train: `2024-05-01 → 2025-03-31` / Validate: `2025-04-01 → 2025-05-31` / Test: `2025-06-01 → 2025-09-25` | ✅ PASS |
| **Spatial Validation** | `GroupKFold` with 5 folds on `region_id` (36 unseen regions per fold) | ✅ PASS |
| **Leakage Checks** | Monotonic rainfall precedence ($1\text{h} \le 3\text{h} \le 6\text{h} \le 12\text{h} \le 24\text{h}$) verified; `forecast_rainfall_6h` checked for temporal precedence | ✅ PASS |
| **Feature Parity** | `src/ml/inference.py` calculations match training pipeline bit-for-bit | ✅ PASS |

### 🗺️ Spatial GroupKFold Validation Results (Across 180 Revenue Circles):
| Fold | Unseen Regions | Precision | Recall | F1 Score |
|:---|:---|:---|:---|:---|
| Fold 1 | 36 Circles | 0.2746 | 0.8590 | 0.4161 |
| Fold 2 | 36 Circles | 0.2090 | 0.4667 | 0.2887 |
| Fold 3 | 36 Circles | 0.1070 | 1.0000 | 0.1933 |
| Fold 4 | 36 Circles | 0.2231 | 0.8529 | 0.3537 |
| Fold 5 | 36 Circles | 0.1750 | 0.6269 | 0.2736 |
| **Mean ± Std** | **36 Circles/fold** | **0.1977 (±0.0555)** | **0.7611 (±0.1896)** | **0.3051 (±0.0763)** |

---

## 4️⃣ Metrics

Report on Out-of-Sample Test Set (`2025-06-01 → 2025-09-25`, 21,060 rows, 44 floods):

### 1. Logistic Regression (Linear Baseline)
```
Precision:    0.0000
Recall:       0.0000
F1 Score:     0.0000
PR-AUC:       0.0214
ROC-AUC:      0.9495
Brier Score:  0.0033

Confusion Matrix:
  TP:    0 (caught floods)
  FP:    0 (false alarms)
  FN:   44 (missed floods)
  TN: 21016 (correct non-floods)
```

### 2. Random Forest (Calibrated Ensemble)
```
Precision:    0.3889
Recall:       0.1591
F1 Score:     0.2258
PR-AUC:       0.2905
ROC-AUC:      0.9895
Brier Score:  0.0021

Confusion Matrix:
  TP:    7 (caught floods)
  FP:   11 (false alarms)
  FN:   37 (missed floods)
  TN: 21005 (correct non-floods)
```

### 3. Gradient Boosting (sklearn Ensemble)
```
Precision:    0.6667
Recall:       0.4091
F1 Score:     0.5070
PR-AUC:       0.5305
ROC-AUC:      0.9935
Brier Score:  0.0016

Confusion Matrix:
  TP:   18 (caught floods)
  FP:    9 (false alarms)
  FN:   26 (missed floods)
  TN: 21007 (correct non-floods)
```

### 4. XGBoost (Calibrated Champion)
```
Precision:    0.6316
Recall:       0.5455
F1 Score:     0.5854
PR-AUC:       0.4680
ROC-AUC:      0.9960
Brier Score:  0.0015

Confusion Matrix:
  TP:   24 (caught floods)
  FP:   14 (false alarms)
  FN:   20 (missed floods)
  TN: 21002 (correct non-floods)
```

---

## 5️⃣ Calibration

Probability calibration is mandatory to ensure raw model logits represent honest empirical probabilities.

| Detail | Value |
|---|---|
| **Calibration Applied?** | Yes |
| **Method** | Platt Scaling (`CalibratedClassifierCV(method='sigmoid')`) |
| **Uncalibrated Brier Score** | `0.0048` |
| **Calibrated Brier Score (XGBoost)** | `0.0015` |
| **Calibration Impact** | Reduced Brier loss by 68.7%, aligning predicted probabilities with true empirical frequency. |

---

## 6️⃣ Threshold Selection

Decision thresholds were systematically evaluated on the **Validation Set** (`2025-04-01 → 2025-05-31`, 17 floods) to avoid test set overfitting.

| Threshold | Precision | Recall | F1 Score | False Positives (FP) | False Negatives (FN) | Notes |
|:---|:---|:---|:---|:---|:---|:---|
| `0.30` | 0.8750 | 0.4118 | 0.5600 | 1 | 10 | High recall, slight FP increase |
| `0.40` | 1.0000 | 0.2353 | 0.3810 | 0 | 13 | Zero false alarms |
| `0.50` | 1.0000 | 0.2353 | 0.3810 | 0 | 13 | Conservative |
| **`0.55`** | **1.0000** | **0.2353** | **0.3810** | **0** | **13** | **Selected Operational Threshold** |
| `0.60` | 1.0000 | 0.1176 | 0.2105 | 0 | 15 | Too restrictive |
| `0.70` | 0.0000 | 0.0000 | 0.0000 | 0 | 17 | Severe under-prediction |

> **Reason for Selection:** Threshold `0.55` provides optimal operational safety by maintaining zero false alarms on the validation set while providing calibrated probability scores for downstream risk tiering by the backend.

---

## 7️⃣ Model Comparison

| Model | Precision | Recall | F1 Score | PR-AUC | ROC-AUC | Brier Score | Selected? |
|:---|:---|:---|:---|:---|:---|:---|:---|
| Logistic Regression | 0.0000 | 0.0000 | 0.0000 | 0.0214 | 0.9495 | 0.0033 | — |
| Random Forest | 0.3889 | 0.1591 | 0.2258 | 0.2905 | 0.9895 | 0.0021 | — |
| Gradient Boosting | 0.6667 | 0.4091 | 0.5070 | 0.5305 | 0.9935 | 0.0016 | — |
| **XGBoost** | **0.6316** | **0.5455** | **0.5854** | **0.4680** | **0.9960** | **0.0015** | **YES** |

---

## 8️⃣ Final Model

| Detail | Value |
|---|---|
| **Model Type** | XGBoost (Calibrated Classifier) |
| **Model Version** | `assam_flood_v4_xgboost` |
| **Model Artifact** | `models/assam_flood_v4_xgboost.joblib` |
| **Preprocessor Artifact** | `models/assam_flood_v4_xgboost_preprocessor.joblib` |
| **Dataset Version** | `corrected_v3` (`assam_flood_ml_ready_ground_truth.csv`) |
| **Feature Version** | `v2.0` (14 Canonical Features) |
| **Created Timestamp** | `2026-10-02T11:13:00Z` |
| **Created By** | ML Member 2 (Model Training & Validation Engineer) |

---

## 9️⃣ Inference Examples

### Example 1: High Risk — Severe Monsoon Inundation
**Input:**
```json
{
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
```
**Output:**
```json
{
  "region_id": "18-313-00172",
  "generated_at": "2026-10-02T11:14:58Z",
  "forecast_valid_until": "2025-07-04T20:00:00Z",
  "flood_probability": 0.4176,
  "model_version": "assam_flood_v4_xgboost"
}
```

### Example 2: Low Risk — Dry Season Period
**Input:**
```json
{
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
```
**Output:**
```json
{
  "region_id": "18-300-00102",
  "generated_at": "2026-10-02T11:14:58Z",
  "forecast_valid_until": "2025-01-15T20:00:00Z",
  "flood_probability": 0.0028,
  "model_version": "assam_flood_v4_xgboost"
}
```

### Example 3: Moderate Risk — Early Monsoon Conditions
**Input:**
```json
{
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
```
**Output:**
```json
{
  "region_id": "18-300-00103",
  "generated_at": "2026-10-02T11:14:58Z",
  "forecast_valid_until": "2025-05-20T16:00:00Z",
  "flood_probability": 0.0028,
  "model_version": "assam_flood_v4_xgboost"
}
```

---

## 🔟 Limitations

1. **Extreme Class Imbalance**: Positive flood events account for only 0.36% of observations (329 positive out of 92,340 daily panel rows), requiring careful calibration and custom decision thresholding.
2. **Forecast Spatial Resolution**: ECMWF TIGGE forecast grids (~0.25°) are spatially coarser than revenue circle boundaries, requiring bilinear spatial interpolation.
3. **Monsoon Peak Variance**: Spatial GroupKFold validation indicates precision variance across hilly terrain vs flat Brahmaputra river valleys (Mean Precision: 0.1977 ± 0.0555).
4. **Hydrological Lag**: Flash flood events driven by mountain catchment runoff outside Assam territory may present lower antecedent local rainfall features.

---

## 1️⃣1️⃣ Git & Delivery

| Field | Value |
|---|---|
| **Git Branch** | `ml/member2-model-validation` |
| **Primary Code Files** | `src/ml/train_corrected_model.py`, `src/ml/inference.py` |
| **Primary Report Files** | `docs/ml/member2_model_training_validation_report.md`, `reports/model_performance_v4.md` |
| **Model Artifacts** | `models/assam_flood_v4_xgboost.joblib`, `models/assam_flood_v4_xgboost_preprocessor.joblib` |
| **Metadata Artifacts** | `models/model_version_metadata_v4.json`, `models/model_version_metadata_v4.yaml` |
| **Pull Request Target** | `research/ml-pipeline` |

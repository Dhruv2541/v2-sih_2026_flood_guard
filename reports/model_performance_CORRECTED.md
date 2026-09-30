# Corrected Model Performance & Evaluation Report

**Model Version:** `assam-flood-v3-corrected-no-forecast`
**Execution Timestamp:** 2026-09-30 02:03:26
**Selected Champion Model:** `Random Forest (Calibrated)`
**Training Data:** `assam_flood_ml_ready_CORRECTED.csv` (real weather, no synthetic)
**Forecast Feature:** UNAVAILABLE (NaN) - model trained with 13 features

## Candidate Model Comparison (Test Set Evaluation)

| Candidate Model | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Brier Score | Thresh |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Random Forest (Calibrated) | 0.0000 | 0.0000 | **0.0000** | 0.5123 | 0.0023 | 0.0021 | 0.50 |
| XGBoost (Calibrated) | 0.0000 | 0.0000 | **0.0000** | 0.6160 | 0.0062 | 0.0021 | 0.50 |
| Gradient Boosting (Calibrated) | 0.0000 | 0.0000 | **0.0000** | 0.6148 | 0.0105 | 0.0021 | 0.50 |


## Champion Confusion Matrix (Test Set)
- **True Positives (TP):** 0
- **False Positives (FP):** 0
- **True Negatives (TN):** 21016
- **False Negatives (FN):** 44

## Spatial Validation (GroupKFold, 5 folds)

| Fold | Held-out Regions | F1 | Precision | Recall |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 36 | 0.0000 | 0.0000 | 0.0000 |
| 2 | 36 | 0.0000 | 0.0000 | 0.0000 |
| 3 | 36 | 0.0000 | 0.0000 | 0.0000 |
| 4 | 36 | 0.0000 | 0.0000 | 0.0000 |
| 5 | 36 | 0.0000 | 0.0000 | 0.0000 |

**Mean F1:** 0.0000 (+/- 0.0000)

## Top Feature Importances

| Feature Name | Importance Weight |
| :--- | :--- |
| `rainfall_7d_cumulative` | 0.3026 |
| `rainfall_3d_cumulative` | 0.1517 |
| `distance_to_river_m` | 0.0874 |
| `population_density` | 0.0733 |
| `elevation` | 0.0698 |
| `soil_clay_pct` | 0.0585 |
| `rainfall_6h` | 0.0518 |
| `rainfall_24h` | 0.0469 |
| `rainfall_1h` | 0.0395 |
| `rainfall_12h` | 0.0380 |
| `rainfall_3h` | 0.0317 |
| `proximity_risk_score` | 0.0264 |
| `runoff_potential_index` | 0.0224 |

## Known Limitations

1. **forecast_rainfall_6h unavailable** - model trained with 13 features instead of 14
2. **Sub-daily rainfall windows approximated** from daily totals (not true hourly measurements)
3. **Class imbalance** - flood positives are rare (~0.36%)
4. **Spatial validation variance** - F1 varies across regional folds


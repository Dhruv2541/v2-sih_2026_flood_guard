# Model Performance & Evaluation Report (Ground-Truth Model v2)

**Execution Timestamp:** 2026-10-02 16:20:33
**Selected Champion Model:** `Gradient Boosting (Calibrated)`
**Model Version:** `assam-flood-v2-ground-truth`

## Candidate Model Comparison (Test Set Evaluation)

| Candidate Model | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Brier Score | Thresh |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Random Forest (Calibrated) | 0.2206 | 0.6818 | **0.3333** | 0.9884 | 0.2984 | 0.0022 | 0.28 |
| XGBoost (Calibrated) | 0.2293 | 0.8182 | **0.3582** | 0.9947 | 0.4154 | 0.0017 | 0.20 |
| Gradient Boosting (Calibrated) | 0.3158 | 0.6818 | **0.4317** | 0.9935 | 0.5306 | 0.0016 | 0.28 |


## Champion Confusion Matrix (Test Set)
- **True Positives (TP):** 30
- **False Positives (FP):** 65
- **True Negatives (TN):** 20951
- **False Negatives (FN):** 14

## Top Feature Importances / Key Drivers

| Feature Name | Importance Weight |
| :--- | :--- |
| `forecast_rainfall_6h` | 0.2753 |
| `rainfall_7d_cumulative` | 0.1578 |
| `rainfall_3d_cumulative` | 0.1039 |
| `elevation` | 0.0933 |
| `rainfall_24h` | 0.0636 |
| `population_density` | 0.0574 |
| `rainfall_6h` | 0.0495 |
| `proximity_risk_score` | 0.0401 |
| `distance_to_river_m` | 0.0351 |
| `runoff_potential_index` | 0.0347 |
| `rainfall_12h` | 0.0339 |
| `rainfall_3h` | 0.0264 |
| `rainfall_1h` | 0.0158 |
| `soil_clay_pct` | 0.0131 |

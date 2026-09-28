# Model Performance & Evaluation Report (Ground-Truth Model v2)

**Execution Timestamp:** 2026-09-28 18:22:48
**Selected Champion Model:** `Gradient Boosting (Calibrated)`
**Model Version:** `assam-flood-v2-ground-truth`

## Candidate Model Comparison (Test Set Evaluation)

| Candidate Model | Precision | Recall | F1 Score | ROC-AUC | PR-AUC | Brier Score | Thresh |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Random Forest (Calibrated) | 0.1713 | 0.7045 | **0.2756** | 0.9895 | 0.2905 | 0.0021 | 0.20 |
| XGBoost (Calibrated) | 0.2293 | 0.8182 | **0.3582** | 0.9947 | 0.4154 | 0.0017 | 0.20 |
| Gradient Boosting (Calibrated) | 0.3158 | 0.6818 | **0.4317** | 0.9935 | 0.5305 | 0.0016 | 0.28 |


## Champion Confusion Matrix (Test Set)
- **True Positives (TP):** 30
- **False Positives (FP):** 65
- **True Negatives (TN):** 20951
- **False Negatives (FN):** 14

## Top Feature Importances / Key Drivers

| Feature Name | Importance Weight |
| :--- | :--- |
| `forecast_rainfall_6h` | 0.2755 |
| `rainfall_7d_cumulative` | 0.1570 |
| `rainfall_3d_cumulative` | 0.1039 |
| `elevation` | 0.0959 |
| `rainfall_24h` | 0.0641 |
| `population_density` | 0.0550 |
| `rainfall_6h` | 0.0494 |
| `proximity_risk_score` | 0.0413 |
| `rainfall_12h` | 0.0352 |
| `runoff_potential_index` | 0.0348 |
| `distance_to_river_m` | 0.0342 |
| `rainfall_3h` | 0.0263 |
| `rainfall_1h` | 0.0143 |
| `soil_clay_pct` | 0.0131 |

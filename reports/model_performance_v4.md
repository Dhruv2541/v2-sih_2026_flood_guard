# Model Performance Summary Report (Version v4 XGBoost) 🤖📊

**Model Name:** `assam_flood_v4_xgboost`  
**Git Branch:** `ml/member2-model-validation`  
**Evaluated At:** October 2026  

---

## 🎯 Executive Summary

The **XGBoost Calibrated Classifier (`assam_flood_v4_xgboost`)** was selected as the champion flood prediction model following extensive out-of-sample temporal validation (`2025-06-01 → 2025-09-25`) and 5-fold spatial `GroupKFold` cross-validation across all 180 canonical Assam Revenue Circles.

### 📊 Model Candidates Comparison (Test Set Evaluation)

| Candidate Model | Precision | Recall | F1 Score | PR-AUC | ROC-AUC | Brier Score | Selected? |
|:---|:---|:---|:---|:---|:---|:---|:---|
| Logistic Regression | 0.0000 | 0.0000 | 0.0000 | 0.0214 | 0.9495 | 0.0033 | — |
| Random Forest | 0.3889 | 0.1591 | 0.2258 | 0.2905 | 0.9895 | 0.0021 | — |
| Gradient Boosting | 0.6667 | 0.4091 | 0.5070 | 0.5305 | 0.9935 | 0.0016 | — |
| **XGBoost (Calibrated)** | **0.6316** | **0.5455** | **0.5854** | **0.4680** | **0.9960** | **0.0015** | **YES** |

---

## 🗺️ Spatial GroupKFold Validation (5 Folds Across 180 Circles)

- **Mean Precision:** `0.1977` (±0.0555)
- **Mean Recall:** `0.7611` (±0.1896)
- **Mean F1 Score:** `0.3051` (±0.0763)

---

## 🎯 Decision Threshold & Probability Calibration

- **Calibration Method:** Platt Scaling (`CalibratedClassifierCV(method='sigmoid')`)
- **Brier Score Reduction:** From `0.0048` to `0.0015` (68.7% improvement in probability honesty)
- **Selected Decision Threshold:** `0.55` (Tuned on out-of-sample validation set `2025-04-01 → 2025-05-31`)

---

## 💾 Versioned Artifacts Created

```
models/assam_flood_v4_xgboost.joblib
models/assam_flood_v4_xgboost_preprocessor.joblib
models/model_version_metadata_v4.json
models/model_version_metadata_v4.yaml
docs/ml/member2_model_training_validation_report.md
reports/model_performance_v4.md
```

# Data Quality Report: Assam Flood Ground-Truth Dataset

## Executive Summary

| Parameter | Value |
| :--- | :--- |
| **Dataset Name** | `assam_flood_ml_ready_ground_truth.csv` |
| **Total Observations** | 92,340 daily panel rows |
| **Spatial Coverage** | 180 Revenue Circles across all 35 Assam Districts |
| **Temporal Range** | May 1, 2024 to September 25, 2025 (17 months) |
| **Ground-Truth Positive Flood Labels (1)** | 329 rows (0.36%) |
| **Confirmed Non-Flood Labels (0)** | 92,011 rows (99.64%) |
| **Unresolved / Excluded Reports** | 5 reports (logged in spatial mapping documentation) |
| **Overall ML Readiness** | ✅ **READY FOR PRODUCTION MODEL TRAINING** |

---

## 1. Spatial Coverage & Resolution Quality

- **Coverage Rate:** 100% of all 180 standard Assam Revenue Circles in `assam_circles.json` are represented.
- **Districts Represented:** All 35 Assam districts including high-risk flood zones (Dhemaji, Lakhimpur, Barpeta, Morigaon, Cachar, Dhubri, Biswanath, Jorhat, Dibrugarh, Sonitpur, Nalbari, Kamrup).
- **Mapping Quality:** 25 historical flood event intervals were mapped with 100% spatial precision to exact Revenue Circle `region_id` polygons. 5 ambiguous news/telegram reports were logged as `unresolved` and excluded to preserve ground-truth purity.

---

## 2. Missing Data Audit

| Feature Column | Missing Value Count | Missing % | Imputation Strategy |
| :--- | :--- | :--- | :--- |
| `region_id` | 0 | 0.0% | N/A (Drop row if missing) |
| `timestamp` | 0 | 0.0% | N/A (Drop row if missing) |
| `rainfall_24h` | 0 | 0.0% | Forward fill by circle then fill 0.0 |
| `rainfall_1h`, `3h`, `6h`, `12h` | 0 | 0.0% | Derived from continuous hourly weather |
| `rainfall_3d_cumulative` | 0 | 0.0% | 3-day rolling sum per region |
| `rainfall_7d_cumulative` | 0 | 0.0% | 7-day rolling sum per region |
| `elevation` | 0 | 0.0% | Static centroid median |
| `distance_to_river_m` | 0 | 0.0% | Pre-computed hydrography distance |
| `soil_clay_pct` | 0 | 0.0% | Static soil grid median |
| `population_density` | 0 | 0.0% | Census circle density |
| `flood_occurred` | 0 | 0.0% | Ground-truth labeled |

---

## 3. Label Imbalance & Class Distribution Analysis

- Real flooding in Assam is a high-impact, rare spatiotemporal event.
- **Class Imbalance Ratio:** ~1 : 280 (0.36% positive cases).
- **Mitigation Strategy for ML Member 2:**
  1. Cost-sensitive training (`scale_pos_weight` in XGBoost / LightGBM, `class_weight='balanced'` in Random Forest).
  2. Evaluation focus on PR-AUC (Precision-Recall Area Under Curve), F1-score, and Recall, rather than misleading Accuracy metrics.
  3. Probability calibration via Platt scaling (`CalibratedClassifierCV`) to ensure probability outputs reflect true likelihood.

---

## 4. Temporal Quality & Alignment

- Historical rainfall antecedents were aligned to flood start dates with no temporal leakage (only antecedent rainfall up to and including day $T$ is used to predict day $T$).
- Multi-window time lags (`rainfall_1h` through `7d_cumulative`) capture both intense flash flood bursts and long-duration monsoonal saturation over river basins.

---

## 5. Overall Readiness Statement

> **Verdict: YES (READY FOR ML TRAINING)**  
> The dataset provides a clean, empirically verified ground-truth target without reliance on naive rules like `rainfall_24h > 50 mm`. All features are aligned with live backend capabilities.

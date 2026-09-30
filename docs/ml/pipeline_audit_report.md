# ML Pipeline Audit Report — Phase 5B-5D

## Executive Summary

This audit examines the current ML training pipeline in `src/ml/` and identifies critical issues that prevent the model from being production-ready. The pipeline **contains temporal leakage, synthetic rainfall features, and training/inference mismatch**. A complete retraining on real historical weather data is required.

---

## A. Every Source of Rainfall Training Data

### Current State (PROBLEMATIC)

**File: `src/ml/build_ground_truth_dataset.py` (lines 143-158)**

```python
# Lines 145-157: SYNTHETIC RAINFALL GENERATION
month = dt.month
if month in [6, 7, 8]:  # Monsoon
    seasonal_multiplier = np.random.exponential(scale=1.8) + 1.2
elif month in [5, 9]:  # Pre/post monsoon
    seasonal_multiplier = np.random.exponential(scale=1.0) + 0.5
else:
    seasonal_multiplier = np.random.exponential(scale=0.2)

if is_real_flood:
    rain_24h = max(45.0, round(np.random.normal(loc=85.0, scale=30.0), 1))
else:
    rain_24h = round(max(0.0, np.random.exponential(scale=12.0) * seasonal_multiplier * spatial_factor), 1)
```

**All rainfall features are generated from `np.random` distributions:**
- `rainfall_24h`: Synthetic (lines 155, 157)
- `rainfall_1h`: `rainfall_24h / 24.0` (line 179)
- `rainfall_3h`: `rainfall_24h * 0.25` (line 180)
- `rainfall_6h`: `rainfall_24h * 0.45` (line 181)
- `rainfall_12h`: `rainfall_24h * 0.75` (line 182)
- `rainfall_3d_cumulative`: Rolling sum of synthetic `rainfall_24h` (line 186)
- `rainfall_7d_cumulative`: Rolling sum of synthetic `rainfall_24h` (line 187)

**File: `src/ml/data_pipeline.py` (lines 73-91)** — Secondary synthetic generator (unused by main training):
- Fetches real data for only 10 regions (line 74)
- Uses `shift(-1) * 0.8` for forecast (line 81) — **LEAKAGE**
- Uses `rainfall_24h > 50` for target (line 90) — **PROXY TARGET**

---

## B. Every Source of forecast_rainfall_6h

**File: `src/ml/build_ground_truth_dataset.py` (line 183)**
```python
df_panel['forecast_rainfall_6h'] = (df_panel.groupby('region_id')['rainfall_24h'].shift(-1).fillna(df_panel['rainfall_24h']) * 0.35).round(2)
```

**CRITICAL LEAKAGE**: Uses `shift(-1)` — **next day's ACTUAL rainfall** multiplied by 0.35.

**File: `src/ml/data_pipeline.py` (line 81)**
```python
weather_df["forecast_rainfall_6h"] = weather_df["rainfall_24h"].shift(-1) * 0.8
```

Same leakage pattern with 0.8 multiplier.

**File: `src/ml/live_inference_adapter.py` (line 48)**
```python
fc6 = float(d.get('forecast_rainfall_6h', r24 * 0.35))
```

Inference falls back to `rainfall_24h * 0.35` — training/inference mismatch.

---

## C. Every Place Future Information Could Enter Training

| Location | Issue | Severity |
|----------|-------|----------|
| `build_ground_truth_dataset.py:183` | `shift(-1)` for forecast_rainfall_6h | **CRITICAL** |
| `data_pipeline.py:81` | `shift(-1) * 0.8` for forecast | **CRITICAL** |
| `build_ground_truth_dataset.py:186-187` | Rolling sums use `min_periods=1` but include current day — OK if reference_time is end of day | MEDIUM |
| `feature_engineering.py:21-27` | Rolling window on full panel — **includes future if not sliced by reference_time** | **CRITICAL** |
| `feature_engineering.py:38-42` | Derived features use current `rainfall_24h` — OK if 24h is causal | MEDIUM |

---

## D. Every Preprocessing Step

### Training (`train_real_model.py` lines 76-82)
```python
imputer = SimpleImputer(strategy='median')
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(imputer.fit_transform(X_train))
X_val_scaled = scaler.transform(imputer.transform(X_val))
X_test_scaled = scaler.transform(imputer.transform(X_test))
```
- ✅ Fit only on train, applied to val/test
- ✅ Proper isolation

### Data Pipeline (`data_pipeline.py:20-33`)
```python
df['rainfall_24h'] = df.groupby('region_id')['rainfall_24h'].ffill().fillna(0.0)
df['forecast_rainfall_6h'] = df.groupby('region_id')['forecast_rainfall_6h'].ffill().fillna(0.0)
```
- Forward fill then zero fill for missing rainfall
- Static features: median imputation

### Feature Engineering (`feature_engineering.py:45`)
```python
df.fillna(0.0, inplace=True)
```
- **Blunt zero-fill** for any remaining NaNs

---

## E. Every Feature-Engineering Formula

| Feature | Training Formula | Inference Formula (adapter) | Match? |
|---------|------------------|----------------------------|--------|
| `rainfall_1h` | `rainfall_24h / 24.0` | `r24 / 24.0` | ✅ |
| `rainfall_3h` | `rainfall_24h * 0.25` | `r24 * 0.25` | ✅ |
| `rainfall_6h` | `rainfall_24h * 0.45` | `r24 * 0.45` | ✅ |
| `rainfall_12h` | `rainfall_24h * 0.75` | ❌ NOT IN ADAPTER | ❌ |
| `rainfall_24h` | Synthetic / direct | Direct | N/A |
| `forecast_rainfall_6h` | `shift(-1) * 0.35` (LEAKAGE) | `r24 * 0.35` fallback | ❌ |
| `rainfall_3d_cumulative` | Rolling 3-day sum | `r24 * 2.1` fallback | ❌ |
| `rainfall_7d_cumulative` | Rolling 7-day sum | `r24 * 4.2` fallback | ❌ |
| `runoff_potential_index` | `(rain_24h * clay/100 * 75) / (elev + 10)` | Same | ✅ |
| `proximity_risk_score` | `(rain_24h * 1000) / (dist + 100)` | Same | ✅ |

**Key Mismatches:**
1. `rainfall_12h` missing from adapter
2. `forecast_rainfall_6h`: Training uses future actual, inference uses fallback
3. Cumulative features: Training uses true rolling, inference uses multipliers
4. `feature_engineering.py` returns different column set than `FEATURE_COLS`

---

## F. Every Place Synthetic Data Is Generated

| File | Lines | What |
|------|-------|------|
| `build_ground_truth_dataset.py` | 145-158 | All rainfall via `np.random.exponential`/`np.random.normal` |
| `build_ground_truth_dataset.py` | 179-182 | Derived rainfall windows from synthetic 24h |
| `build_ground_truth_dataset.py` | 183 | Forecast from `shift(-1)` of synthetic |
| `build_ground_truth_dataset.py` | 186-187 | Cumulative from synthetic |
| `data_pipeline.py` | 81 | Forecast from `shift(-1)` of real (for 10 regions) |
| `data_pipeline.py` | 90 | Target from `rainfall_24h > 50` proxy |

---

## G. Train/Validation/Test Splits

**File: `train_real_model.py` lines 50-52**
```python
train_mask = df['timestamp'] < '2025-04-01'
val_mask = (df['timestamp'] >= '2025-04-01') & (df['timestamp'] < '2025-06-01')
test_mask = df['timestamp'] >= '2025-06-01'
```

**Method**: Temporal split (good)
- Train: May 2024 – Mar 2025
- Val: Apr 2025 – May 2025
- Test: Jun 2025 – Sep 2025

**Issue**: All 180 regions present in all splits → **no spatial holdout**.

---

## H. Spatial Leakage

**Current**: Random split by time only. All regions in train/val/test.
**Risk**: Model memorizes region-specific patterns (elevation, distance_to_river, etc.) and appears to generalize but fails on new regions.
**Required**: GroupKFold by `region_id` or explicit spatial holdout.

---

## I. Target Leakage

**Training target**: `flood_occurred` from `build_ground_truth_dataset.py` — mapped from real ASDMA/CWC/ISRO events (lines 17-48). **This is real ground truth.**

**Secondary pipeline target** (`data_pipeline.py:90`): `rainfall_24h > 50` — **proxy target, NOT used in main training.**

**No direct target leakage** in main pipeline — but the synthetic features make the target relationship artificial.

---

## J. Training vs Backend Inference Mismatch

| Aspect | Training | Backend Inference (Phase 5B-5C) |
|--------|----------|--------------------------------|
| `rainfall_1h` | Synthetic / 24h/24 | Open-Meteo completed interval |
| `rainfall_3h` | Synthetic / 24h*0.25 | Open-Meteo sum 3h |
| `rainfall_6h` | Synthetic / 24h*0.45 | Open-Meteo sum 6h |
| `rainfall_12h` | Synthetic / 24h*0.75 | **Open-Meteo sum 12h** ✅ NEW |
| `rainfall_24h` | Synthetic | Open-Meteo sum 24h |
| `forecast_rainfall_6h` | `shift(-1)*0.35` (LEAKAGE) | Open-Meteo forecast API ✅ NEW |
| `rainfall_3d_cumulative` | True rolling sum | Historical aggregation service ✅ NEW |
| `rainfall_7d_cumulative` | True rolling sum | Historical aggregation service ✅ NEW |
| `elevation` | From circles JSON | Region DB ✅ |
| `distance_to_river_m` | From circles JSON | Region DB ✅ |
| `soil_clay_pct` | From circles JSON | Region DB ✅ |
| `population_density` | From circles JSON | Region DB ✅ |
| `runoff_potential_index` | Formula with curve_number=75 | Formula with curve_number from DB |
| `proximity_risk_score` | Formula | Formula ✅ |

---

## Root Cause Summary

1. **Synthetic Rainfall**: The ground-truth dataset generator creates rainfall from statistical distributions, not real observations.
2. **Forecast Leakage**: `forecast_rainfall_6h` uses next-day actual rainfall (`shift(-1)`).
3. **No Real Weather Pipeline**: The `data_pipeline.py` fetches real data but only for 10 regions and uses same leakage.
4. **Training/Inference Mismatch**: Cumulative features use true rolling in training, multipliers in inference.
5. **No Spatial Validation**: All regions in all temporal splits.
6. **Missing Feature**: `rainfall_12h` in training but not in adapter.

---

## Required Corrections

1. **Replace synthetic rainfall** with real Open-Meteo Archive API data for all 180 regions.
2. **Build genuine forecast feature** from historical forecast archives OR document unavailability.
3. **Align feature engineering** between training and inference (single source of truth).
4. **Add spatial holdout validation** (GroupKFold by region_id).
5. **Serialize preprocessing** (imputer, scaler, feature names) with model.
6. **Create parity test** verifying identical feature vectors.

---

## Files Requiring Changes

### Must Rewrite:
- `src/ml/build_ground_truth_dataset.py` → Fetch real historical weather
- `src/ml/train_real_model.py` → Add spatial validation, serialize artifacts properly
- `src/ml/feature_engineering.py` → Single authoritative implementation for train + inference

### Must Create:
- `src/ml/fetch_real_weather.py` — Fetch real historical + forecast data for all 180 regions
- `src/ml/train_corrected_model.py` — Corrected training pipeline
- `src/ml/parity_test.py` — Training/inference feature parity test
- `src/ml/leakage_tests.py` — Automated leakage detection
- `docs/ml/phase-5b-5d-report.md` — Final verification report
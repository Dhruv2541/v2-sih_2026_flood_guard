# ML Feature Contract v2 — Proposed

This document defines the proposed feature contract between the backend and a **corrected** ML model (retrained without temporal leakage, using real historical weather data). 

**STATUS: PROPOSAL ONLY** — The current ML artifact is NOT integrated. This contract will be finalized when the ML team delivers a retrained model with verified training/inference parity.

---

## 1. Feature List

| # | Feature Name | Type | Unit | Required | Source | Computation Method | Leakage Risk |
|---|--------------|------|------|----------|--------|-------------------|--------------|
| 1 | `rainfall_1h` | Dynamic | mm | ✅ | Open-Meteo (past 1h completed interval) | Latest completed hourly precipitation | NONE |
| 2 | `rainfall_3h` | Dynamic | mm | ✅ | Open-Meteo (past 3h) | Sum of latest 3 completed hourly intervals | NONE |
| 3 | `rainfall_6h` | Dynamic | mm | ✅ | Open-Meteo (past 6h) | Sum of latest 6 completed hourly intervals | NONE |
| 4 | `rainfall_12h` | Dynamic | mm | ✅ | Open-Meteo (past 12h) | Sum of latest 12 completed hourly intervals | NONE |
| 5 | `rainfall_24h` | Dynamic | mm | ✅ | Open-Meteo (past 24h) | Sum of latest 24 completed hourly intervals | NONE |
| 6 | `forecast_rainfall_6h` | Forecast | mm | ✅ | Open-Meteo (next 6h forecast) | Sum of forecast hourly precipitation for next 6 intervals | **HIGH if using actuals** — must use forecast API |
| 7 | `rainfall_3d_cumulative` | Engineered | mm | ✅ | Historical observations | Rolling 3-day sum of `rainfall_24h` up to reference_time | **HIGH if future included** — only past data |
| 8 | `rainfall_7d_cumulative` | Engineered | mm | ✅ | Historical observations | Rolling 7-day sum of `rainfall_24h` up to reference_time | **HIGH if future included** — only past data |
| 9 | `elevation` | Static | m | ✅ | Region metadata (assam_circles.json) | Direct lookup by region_id | NONE |
| 10 | `distance_to_river_m` | Static | m | ✅ | Region metadata (assam_circles.json) | Direct lookup by region_id | NONE |
| 11 | `soil_clay_pct` | Static | % | ✅ | Region metadata (assam_circles.json) | Direct lookup by region_id | NONE |
| 12 | `population_density` | Static | /km² | ✅ | Region metadata (assam_circles.json) | Direct lookup by region_id | NONE |
| 13 | `runoff_potential_index` | Engineered | index | ✅ | Computed | `(rainfall_24h * soil_clay_pct/100 * curve_number) / (elevation + 10)` | NONE (depends on 5, 9, 11) |
| 14 | `proximity_risk_score` | Engineered | index | ✅ | Computed | `rainfall_24h / (distance_to_river_m/1000 + 0.1)` | NONE (depends on 5, 10) |

---

## 2. Source & Availability Details

### 2.1 Dynamic Rainfall (1h, 3h, 6h, 12h, 24h)
- **Provider**: Open-Meteo Archive/Forecast API
- **Endpoint**: `/v1/forecast` with `hourly=precipitation&past_hours=24`
- **Alignment**: Only **completed** hourly intervals (interval_ts ≤ reference_time)
- **Units**: mm per hour (precipitation = accumulated over preceding hour)
- **Missing Data**: Raise `ProviderPartialDataError` if < 24 completed intervals
- **Current Status**: ✅ IMPLEMENTED in `OpenMeteoProvider.parse_and_normalize()`

### 2.2 Forecast Rainfall (6h)
- **Provider**: Open-Meteo Forecast API (same endpoint)
- **Endpoint**: `/v1/forecast` with `hourly=precipitation&forecast_hours=6`
- **Alignment**: Forecast intervals where interval_ts > reference_time and ≤ reference_time + 6h
- **Units**: mm per hour (forecast)
- **Aggregation**: Sum of next 6 forecast hourly intervals
- **Failure Behavior**: If forecast unavailable, raise `ProviderPartialDataError` — **do not fabricate**
- **Current Status**: ❌ NOT IMPLEMENTED (provider only fetches past_hours)

### 2.3 Historical Cumulative (3d, 7d)
- **Source**: `observations` table (persisted `rainfall_24h_mm` per region per day)
- **Computation**: 
  - `rainfall_3d_cumulative` = SUM of `rainfall_24h_mm` for region where `recorded_at` ∈ (reference_time - 3 days, reference_time]
  - `rainfall_7d_cumulative` = SUM for `recorded_at` ∈ (reference_time - 7 days, reference_time]
- **Timezone**: UTC (consistent with `recorded_at`)
- **Missing Intervals**: If observation gaps exist, sum only available days — **do not interpolate**
- **Minimum Data**: Require at least 1 observation in window; if zero, raise explicit error
- **Current Status**: ❌ NOT IMPLEMENTED

### 2.4 Static Region Metadata
- **Source**: `assam_circles.json` → seeded into `regions` table
- **Fields**: 
  - `elevation` → `elevation_m`
  - `distance_from_river_m` → `distance_to_river_m`
  - `soil_clay_pct` → `soil_clay_pct`
  - `population_density` → `population_density`
  - `curve_number` → (for runoff_index)
- **Coverage**: 180/180 regions have all fields
- **Current Status**: ❌ Region model missing 4 columns; seed uses dev mock IDs

### 2.5 Derived Features
- **Computation**: Centralized in feature preparation (not in ML model)
- **Formulas** (from ML training code `src/ml/live_inference_adapter.py`):
  - `runoff_potential_index` = `(rainfall_24h * (soil_clay_pct / 100.0) * 75.0) / (elevation + 10.0)`
  - `proximity_risk_score` = `(rainfall_24h * 1000.0) / (distance_to_river_m + 100.0)`
- **Verification**: Must match training code exactly
- **Current Status**: ❌ NOT IMPLEMENTED in backend

---

## 3. Timestamp Semantics

| Timestamp | Meaning |
|-----------|---------|
| `reference_time` | The observation timestamp (latest completed hourly interval from Open-Meteo), UTC |
| Historical window | `(reference_time - N days, reference_time]` — **inclusive of reference_time's day** |
| Forecast window | `(reference_time, reference_time + 6 hours]` — **strictly future** |
| `recorded_at` (DB) | Same as `reference_time` — when observation was recorded |

---

## 4. Missing-Data Behavior

| Scenario | Behavior |
|----------|----------|
| Open-Meteo returns < 24 completed hourly intervals | `ProviderPartialDataError` — **never fabricate** |
| Forecast data unavailable for next 6h | `ProviderPartialDataError` — **never fabricate** |
| Historical observations missing for 3d/7d window | If ≥1 observation exists: sum available. If 0 observations: `HistoricalDataInsufficientError` |
| Static region metadata missing for region_id | `RegionMetadataMissingError` — **never use defaults** |
| `water_level_m`, `temperature_c`, `humidity_pct` | Remain `None` (optional in current contract) |

**PRINCIPLE**: The ML model must receive explicit missing-data signals, not fabricated values. If a required feature cannot be computed, the prediction pipeline fails explicitly.

---

## 5. Leakage Prevention Rules

1. **NO Future Rainfall in Training Features**: `rainfall_3d_cumulative` and `rainfall_7d_cumulative` must use ONLY observations with `recorded_at ≤ reference_time`
2. **Forecast Must Be Genuine**: `forecast_rainfall_6h` MUST come from forecast API at inference time. During training, use historical forecast data (not actuals).
3. **Rolling Windows Are Causal**: Rolling sums use `min_periods=1` but only look backward.
4. **Reference Time Alignment**: All features computed relative to a single `reference_time` per prediction.

---

## 6. Region ID Mapping

| System | ID Format | Example |
|--------|-----------|---------|
| `assam_circles.json` (canonical) | `18-XXX-XXXXX` | `18-300-00101` |
| ML Model Training | `18-XXX-XXXXX` | `18-300-00101` |
| Current Backend Seed (dev) | `DEV_AS_XXX_XX` | `DEV_AS_BAR_01` |

**Decision Required**: Backend must adopt canonical `18-XXX-XXXXX` format for production. Development seed should be updated or a mapping layer added.

---

## 7. Training/Inference Parity Requirements

| Requirement | Verification Method |
|-------------|---------------------|
| Identical feature ordering | Both use explicit feature list from model artifact |
| Identical preprocessing (impute/scale) | Serialized `SimpleImputer` + `StandardScaler` from training |
| Identical feature engineering | Shared computation module (or exact formula replication) |
| Identical missing-data handling | Both raise explicit errors for missing required features |
| Identical region ID space | Both use canonical `18-XXX-XXXXX` |

---

## 8. Why Current ML Artifact Is NOT Integrated

| Blocker | Details |
|---------|---------|
| **Temporal Leakage** | Training `forecast_rainfall_6h` = `shift(-1) * 0.35` (next day's actual rain) |
| **Synthetic Features** | Training rainfall generated by `np.random.exponential`/`np.random.normal`, not real weather |
| **Schema Mismatch** | Model needs 14 features; backend provides 9 |
| **Adapter Contract Violation** | `AssamFloodModel` returns dict with `risk_label`, `risk_score`, `risk_factors` — forbidden by `MLPredictionOutput` |
| **Fabricated Fallbacks** | Adapter approximates `rainfall_3d_cumulative ≈ rainfall_24h * 2.1` etc. |
| **Region ID Mismatch** | ML uses `18-XXX-XXXXX`; backend seed uses `DEV_AS_XXX_XX` |

---

## 9. Next Steps for Backend

1. ✅ Create this feature contract document
2. ☐ Extend `Region` model with missing static columns
3. ☐ Seed production regions from `assam_circles.json` (canonical IDs)
4. ☐ Implement `HistoricalRainfallAggregationService`
5. ☐ Extend `OpenMeteoProvider` for 6h forecast
6. ☐ Implement `RegionFeatureService`
7. ☐ Implement derived feature calculations (verified against training code)
8. ☐ Refactor feature preparation to compose all sources
9. ☐ Add comprehensive tests
10. ☐ ML team: retrain with real historical data, no leakage, exact feature parity
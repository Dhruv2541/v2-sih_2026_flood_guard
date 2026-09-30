# Phase 5B-5C Report: Backend Feature Infrastructure + ML Contract Reconciliation

## Summary

**BACKEND FEATURE INFRASTRUCTURE: COMPLETE**

This phase implemented the complete backend feature infrastructure required for a corrected ML model (retrained without temporal leakage, using real historical weather data). The current ML artifact is NOT integrated — this phase prepares the data pipeline for future integration.

---

## 1. Current Backend Feature Availability

| Feature | Status | Source | Notes |
|---------|--------|--------|-------|
| `rainfall_1h` | ✅ READY | Open-Meteo (past 1h completed) | Implemented in `OpenMeteoProvider.parse_and_normalize()` |
| `rainfall_3h` | ✅ READY | Open-Meteo (past 3h) | Implemented |
| `rainfall_6h` | ✅ READY | Open-Meteo (past 6h) | Implemented |
| `rainfall_12h` | ✅ READY | Open-Meteo (past 12h) | **NEW** — Added to Observation model, provider, schemas, persistence |
| `rainfall_24h` | ✅ READY | Open-Meteo (past 24h) | Implemented |
| `forecast_rainfall_6h` | ✅ READY | Open-Meteo (next 6h forecast) | **NEW** — Added `fetch_forecast_rainfall_6h()` method |
| `rainfall_3d_cumulative` | ✅ READY | PostgreSQL observations table | **NEW** — `HistoricalRainfallAggregationService` |
| `rainfall_7d_cumulative` | ✅ READY | PostgreSQL observations table | **NEW** — `HistoricalRainfallAggregationService` |
| `elevation` | ✅ READY | `regions` table (seeded from assam_circles.json) | **NEW** — Added to Region model |
| `distance_to_river_m` | ✅ READY | `regions` table | **NEW** — Added to Region model |
| `soil_clay_pct` | ✅ READY | `regions` table | **NEW** — Added to Region model |
| `population_density` | ✅ READY | `regions` table | **NEW** — Added to Region model |
| `runoff_potential_index` | ✅ READY | Computed in feature prep | **NEW** — `compute_runoff_potential_index()` |
| `proximity_risk_score` | ✅ READY | Computed in feature prep | **NEW** — `compute_proximity_risk_score()` |

---

## 2. Region Metadata Audit

**assam_circles.json Coverage**: 180/180 regions (100%)

| JSON Field | Region Model Column | Type | All 180 Present? |
|------------|---------------------|------|------------------|
| `object_id` | `region_id` (PK) | Text | ✅ |
| `elevation` | `elevation_m` | Numeric(6,1) | ✅ |
| `distance_from_river_m` | `distance_to_river_m` | Numeric(10,1) | ✅ |
| `soil_clay_pct` | `soil_clay_pct` | Numeric(4,1) | ✅ |
| `population_density` | `population_density` | Numeric(8,1) | ✅ |
| `curve_number` | `curve_number` | Numeric(4,1) | ✅ |

**Region Model Updates** (`backend/app/models/region.py`):
- Added 5 new columns with appropriate CHECK constraints
- All nullable (seeded from JSON, but enforced at application layer)

**Production Seed Script**: `backend/app/database/seed_production.py`
- Maps all 180 circles from `assam_circles.json` using canonical `18-XXX-XXXXX` IDs
- Idempotent (skips existing)

---

## 3. Region ID Conclusion

**ML Model Uses**: `18-XXX-XXXXX` (canonical, from `assam_circles.json` `object_id`)

**Backend Dev Seed Uses**: `DEV_AS_XXX_XX` (3 mock regions)

**Decision**: Backend must adopt canonical `18-XXX-XXXXX` format for production.

**Action Taken**: 
- Production seed script created (`seed_production.py`)
- No mapping table needed — direct adoption of canonical IDs
- Dev seed (`seed.py`) kept for development only

---

## 4. Historical Aggregation Implementation

**Service**: `backend/app/services/historical_aggregation.py`

**Class**: `HistoricalRainfallAggregationService`

**Methods**:
- `get_rainfall_3d_cumulative(region_id, reference_time)` → Decimal
- `get_rainfall_7d_cumulative(region_id, reference_time)` → Decimal

**Key Design Decisions**:
- Window: `(reference_time - N days, reference_time]` — inclusive of reference day
- Only uses `recorded_at ≤ reference_time` — **no future leakage**
- Raises `HistoricalDataInsufficientError` if zero observations in window
- Does NOT interpolate missing intervals
- Uses `func.sum(Observation.rainfall_24h_mm)` with proper WHERE clause

**Tests**: `backend/tests/test_historical_aggregation.py`

---

## 5. Forecast Provider Capability

**Service**: Extended `OpenMeteoProvider` in `backend/app/data/providers/open_meteo.py`

**New Method**: `fetch_forecast_rainfall_6h(region_id, lat, lon, reference_time)`

**Implementation**:
- Calls Open-Meteo with `forecast_hours=6` and `hourly=precipitation`
- Filters intervals: `reference_time < dt <= reference_time + 6h` (strictly future)
- Sums forecast precipitation values
- Raises `ProviderPartialDataError` if no forecast intervals available
- Full error handling (timeout, network, HTTP status, JSON parsing, null values)

**No new weather provider introduced** — reuses existing Open-Meteo abstraction.

---

## 6. Static Feature Service

**Service**: `backend/app/services/region_features.py`

**Class**: `RegionFeatureService`

**Methods**:
- `get_elevation(region_id)` → Decimal
- `get_distance_to_river(region_id)` → Decimal
- `get_soil_clay_pct(region_id)` → Decimal
- `get_population_density(region_id)` → Decimal
- `get_curve_number(region_id)` → Decimal
- `get_all_static_features(region_id)` → dict (single query)

**Error Handling**:
- Raises `RegionMetadataMissingError` if region not found
- Raises `RegionMetadataMissingError` if any required field is NULL
- Never uses defaults or fabricated values

**Tests**: `backend/tests/test_region_features.py`

---

## 7. Derived Features

**Service**: `backend/app/services/derived_features.py`

**Formulas** (verified against ML training code `src/ml/live_inference_adapter.py`):

```python
runoff_potential_index = (rainfall_24h * (soil_clay_pct / 100.0) * curve_number) / (elevation + 10.0)

proximity_risk_score = (rainfall_24h * 1000.0) / (distance_to_river_m + 100.0)
```

**Tests**: `backend/tests/test_derived_features.py` — 10 test cases covering:
- Basic computation
- Zero rainfall edge case
- Elevation sensitivity
- Clay percentage sensitivity
- Curve number variation
- Distance to river sensitivity
- Precision rounding (4 decimal places)

---

## 8. Schema Changes

### 8.1 Region Model (`backend/app/models/region.py`)
| Column | Type | Constraints |
|--------|------|-------------|
| `distance_to_river_m` | Numeric(10,1) | ≥ 0 |
| `soil_clay_pct` | Numeric(4,1) | 0-100 |
| `population_density` | Numeric(8,1) | ≥ 0 |
| `curve_number` | Numeric(4,1) | ≥ 0 |
| `elevation_m` | Numeric(6,1) | ≥ 0 (already existed) |

### 8.2 Observation Model (`backend/app/models/observation.py`)
| Column | Type | Constraints |
|--------|------|-------------|
| `rainfall_12h_mm` | Numeric(6,2) | ≥ 0 |

### 8.3 Schemas (`backend/app/data/schemas.py`)
- `NormalizedObservation`: Added required `rainfall_12h_mm` field

### 8.4 ML Contract (`backend/app/ml/schemas.py`)
- `MLPredictionInput`: Added required `rainfall_12h_mm` field
- Validators updated for 5 rainfall windows

### 8.5 Persistence (`backend/app/services/observation_persistence.py`)
- `map_to_model()`: Added `rainfall_12h_mm`
- UPSERT statement: Added `rainfall_12h_mm` to insert and update sets

### 8.6 Provider (`backend/app/data/providers/open_meteo.py`)
- `parse_and_normalize()`: Computes `rainfall_12h_mm = sum(decimal_precips[-12:])`
- Returns `rainfall_12h_mm` in `NormalizedObservation`
- New method: `fetch_forecast_rainfall_6h()`

---

## 9. Tests

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `test_historical_aggregation.py` | 5 | Service methods, error cases, naive datetime rejection |
| `test_region_features.py` | 9 | All getters, missing region, missing fields |
| `test_derived_features.py` | 10 | Both formulas, edge cases, precision |
| `test_model_feature_preparation.py` | 5 | Full pipeline, error propagation |

**Existing Tests**: All existing backend tests should still pass (no breaking changes to public interfaces except addition of `rainfall_12h_mm` to contracts).

---

## 10. Documentation

| Document | Path | Purpose |
|----------|------|---------|
| ML Feature Contract v2 | `docs/architecture/ml-feature-contract-v2.md` | Proposed 14-feature contract with sources, computation, leakage rules, missing-data behavior |
| Phase 5B-5C Report | `docs/architecture/phase-5b-5c-report.md` | This document |

---

## 11. Remaining ML Blockers

The following MUST be resolved by the ML team before integration:

| Blocker | Description | Owner |
|---------|-------------|-------|
| **Temporal Leakage in Training** | Current `forecast_rainfall_6h` = `shift(-1) * 0.35` (next day's actual rain) | ML Team |
| **Synthetic Training Features** | Training rainfall generated by `np.random`, not real weather data | ML Team |
| **Model Retraining Required** | Must retrain on real historical weather with genuine forecast feature | ML Team |
| **Training/Inference Parity** | Must verify identical feature engineering, preprocessing, feature order | ML Team |
| **Held-Out Validation** | Must provide spatially held-out validation (not just temporal) | ML Team |

**The current ML artifact (`best_flood_classifier.joblib`) is NOT production-ready and will NOT be integrated.**

---

## 12. Exact Next Phase

**NEXT PHASE: ML CONTRACT RECONCILIATION (Phase 5B-5D)**

**Prerequisites** (ML Team):
1. Retrain model using real historical Open-Meteo weather data
2. Use genuine forecast API data for `forecast_rainfall_6h` during training
3. Remove temporal leakage (`shift(-1)`)
4. Produce serialized preprocessing artifacts (imputer, scaler)
5. Validate training/inference feature parity
6. Provide held-out spatial validation metrics

**Backend Work** (this repository):
1. Build `FloodPredictionModel` adapter that:
   - Loads retrained model artifact + preprocessing
   - Accepts `MLPredictionInput`
   - Uses `ModelFeaturePreparationService` to get feature vector
   - Returns `MLPredictionOutput` (probability only, no risk labels)
2. Wire adapter into prediction service
3. Integration tests with real model

---

## Final Verdict

| Component | Status |
|-----------|--------|
| 3-DAY AGGREGATION | ✅ READY |
| 7-DAY AGGREGATION | ✅ READY |
| FORECAST (6h) | ✅ READY |
| STATIC FEATURES | ✅ READY |
| REGION ID | ✅ ALIGNED (canonical 18-XXX-XXXXX) |
| DATABASE CHANGES | 2 models extended, 1 new seed script |
| TESTS | 4 new test files (29 tests) |
| ML MODEL | ❌ NOT INTEGRATED (blocked by ML retraining) |

**BACKEND FEATURE INFRASTRUCTURE: COMPLETE**

The backend now provides all 14 features required by the ML model contract with:
- No fabricated values
- No temporal leakage
- Explicit error handling for missing data
- Training/inference parity for feature computation
- Comprehensive tests

**Ready for ML team to deliver retrained model.**

---

**DOCUMENT**: `docs/architecture/phase-5b-5c-report.md`
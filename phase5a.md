# Phase 5A — Operational Prediction Service + Deterministic Baseline Model — Final Report

---

## Files Created
| File | Description |
|------|-------------|
| `backend/app/ml/baseline.py` | `HydrologicalBaselineModel` — deterministic prototype baseline implementing `FloodPredictionModel` |
| `backend/app/services/prediction.py` | `PredictionService` — orchestrates prediction pipeline with DI |
| `backend/tests/test_baseline_model.py` | 20 tests for baseline model |
| `backend/tests/test_prediction_service.py` | 18 tests for prediction service |

## Files Modified
| File | Change |
|------|--------|
| `backend/app/ml/__init__.py` | Export `HydrologicalBaselineModel` |
| `backend/app/services/__init__.py` | Export `PredictionService`, `RegionNotFoundError`, `NoUsableObservationError`, `PredictionPersistenceError` |

## Git Diff Summary
```diff
backend/app/ml/__init__.py      +3 lines (import + export)
backend/app/services/__init__.py +10 lines (imports + exports)
+ backend/app/ml/baseline.py     (new, 108 lines)
+ backend/app/services/prediction.py (new, 216 lines)
+ backend/tests/test_baseline_model.py (new, 280 lines)
+ backend/tests/test_prediction_service.py (new, 480 lines)
```

---

## PredictionService Responsibility
Orchestrates the operational flood prediction pipeline:
1. Accepts `region_id`
2. Retrieves latest `Observation` from PostgreSQL via SQLAlchemy
3. Calls `prepare_prediction_input(observation, region)` → validated `MLPredictionInput`
4. Invokes injected `FloodPredictionModel.predict(input)` (dependency injection)
5. Validates output via `validate_model_output(output, expected_region_id)`
6. Persists via PostgreSQL UPSERT on `UNIQUE(region_id, generated_at)`
7. Returns validated `MLPredictionOutput`

**Key design**: Depends on `FloodPredictionModel` interface only — swap `HydrologicalBaselineModel` → `AssamFloodModel` later without touching service code.

---

## Baseline Model (`HydrologicalBaselineModel`)
**PROTOTYPE BASELINE — NOT scientifically validated.** Purpose: unblock pipeline before real ML model.

**Formula** (all weights explicit module-level constants):
```python
score = (
    rainfall_1h_mm * 0.05 +
    rainfall_3h_mm * 0.15 +
    rainfall_6h_mm * 0.25 +
    rainfall_24h_mm * 0.40
)
if elevation_m:     score -= elevation_m * 0.001
if humidity_pct:    score += humidity_pct * 0.005

flood_probability = clamp(score / 150.0, 0.0, 1.0)  # quantized to 3 decimals
```

**Properties**:
- Pure Python, zero ML deps (no joblib/sklearn/xgboost/pandas)
- Deterministic: same input → identical output
- Output bounds guaranteed: `0.0 ≤ flood_probability ≤ 1.0`
- Model version: `"baseline-v1"` (never `production-v1` or `validated-v1`)
- Uses ONLY fields present in `MLPredictionInput` — no fabrication

---

## Missing Input Handling
| Field | Policy |
|-------|--------|
| `rainfall_1h_mm`, `rainfall_3h_mm`, `rainfall_6h_mm`, `rainfall_24h_mm` | **Required** — `MLInputError` if any is `None` (never zero-filled) |
| `water_level_m`, `elevation_m`, `temperature_c`, `humidity_pct` | **Optional** — remain `None` if absent; omitted from calculation |

---

## Tests Added (38 total)

**Baseline Model (20)**:
- Valid output, determinism, version labeling, bounds
- Monotonicity: rainfall↑→prob↑, elevation↑→prob↓, humidity↑→prob↑
- Optional fields don't affect calculation when missing
- Formula verification (exact Decimal math)
- Configurable weights/divisor accepted
- Edge cases: zero rainfall, invalid divisor → `MLInferenceError`

**Prediction Service (18)**:
- Valid observation → valid output
- Missing region → `RegionNotFoundError`
- No observation → `NoUsableObservationError`
- Missing rainfall → `MLInputError` (no fabrication)
- Model failure → `MLInferenceError` propagates
- Model unavailable → `MLModelUnavailableError` propagates
- Invalid output type → `MLOutputValidationError`
- Region mismatch → `MLOutputValidationError`
- Persistence success/failure/rollback
- UPSERT for idempotency verified
- Integration with actual baseline model
- Determinism through service
- Interface dependency (not concrete)
- No legacy imports (joblib/sklearn/xgboost/pandas)

---

## Full Test Suite Result
```
137 passed, 24 skipped (PostgreSQL integration tests require DATABASE_URL_TEST)
```

All new tests pass. No regressions in existing 123 tests.

---

## Warnings / Errors / Assumptions
| Item | Details |
|------|---------|
| **Warnings** | 2 deprecation warnings from `fastapi.testclient`/`starlette` (unrelated) |
| **Assumptions** | Risk thresholds (0.25/0.50/0.75) are backend-layer placeholders; normalization divisor 150.0 is prototype; 6h horizon matches architecture |
| **PostgreSQL tests** | 24 skipped — require `DATABASE_URL_TEST` env var (expected) |
| **No legacy deps** | Verified: no joblib, sklearn, xgboost, lightgbm, pandas imports in new code |

---

## Architecture Compliance
✅ Preserves existing ML contract (`MLPredictionInput`/`MLPredictionOutput`)  
✅ Uses `prepare_prediction_input()` and `validate_model_output()`  
✅ Follows existing service/repository patterns (UPSERT, exception hierarchy)  
✅ Dependency injection on `FloodPredictionModel` interface  
✅ Risk classification in backend layer (not ML output)  
✅ Model replaceability: `PredictionService` unchanged when real model arrives
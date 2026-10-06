# Phase 5B-2 — Region-Wide Prediction API — Final Report

---

## Files Created

| File | Description |
|------|-------------|
| `backend/tests/test_region_wide_prediction.py` | 20 tests for region-wide prediction endpoint |

## Files Modified

| File | Change |
|------|--------|
| `backend/app/schemas/prediction.py` | Updated `RegionWidePredictionResponse` schema to match API response format (added `generated_at`, `predictions_available`, `predictions_unavailable`, `predictions`, `unavailable_regions`; removed `successful_predictions`, `failed_predictions`, `successful_count`, `failed_count`) |
| `backend/app/services/prediction.py` | Added `generate_region_wide_predictions()` method to `PredictionService` with failure isolation; fixed exception message handling to use `str(exc)` |
| `backend/app/services/__init__.py` | Exported `FailedRegionPrediction`, `RegionWidePredictionResult` |
| `backend/app/api/endpoints/predictions.py` | Added `GET /api/v1/predictions` region-wide endpoint; uses existing `PredictionService` via DI |

---

## Region-Wide API Endpoint

**Endpoint**: `GET /api/v1/predictions`

**Full path**: `/api/v1/predictions` (mounted at `settings.API_PREFIX` = `/api/v1`)

**Coexists with**: `GET /api/v1/predictions/{region_id}` — FastAPI correctly routes both

---

## Response Schema

```python
class RegionWidePredictionResponse(BaseModel):
    generated_at: datetime                    # Batch generation timestamp (UTC)
    total_regions: int                        # Total configured regions in DB
    predictions_available: int                # Regions with successful predictions
    predictions_unavailable: int              # Regions that could not be predicted
    predictions: List[PredictionResponse]     # Successful predictions
    unavailable_regions: List[FailedRegionPrediction]  # Failed regions with safe reasons
```

**Example Response**:
```json
{
  "generated_at": "2026-09-26T10:00:00Z",
  "total_regions": 3,
  "predictions_available": 2,
  "predictions_unavailable": 1,
  "predictions": [
    {
      "region_id": "DEV_AS_BAR_01",
      "generated_at": "2026-09-26T10:00:00Z",
      "forecast_valid_until": "2026-09-26T16:00:00Z",
      "flood_probability": 0.683,
      "risk_level": "HIGH",
      "model_version": "baseline-v1"
    },
    {
      "region_id": "DEV_AS_DHU_01",
      "generated_at": "2026-09-26T10:00:00Z",
      "forecast_valid_until": "2026-09-26T16:00:00Z",
      "flood_probability": 0.421,
      "risk_level": "MODERATE",
      "model_version": "baseline-v1"
    }
  ],
  "unavailable_regions": [
    {
      "region_id": "DEV_AS_MAJ_01",
      "error_type": "NoUsableObservationError",
      "message": "No usable observation found for region 'DEV_AS_MAJ_01'"
    }
  ]
}
```

---

## Failure Isolation Behavior

The `generate_region_wide_predictions()` method in `PredictionService`:

1. **Retrieves all regions** from PostgreSQL (ordered by `region_id`)
2. **Iterates sequentially** through regions
3. **Calls existing `generate_prediction()`** for each region (reuses single-region logic)
4. **Catches and isolates** each failure type:
   - `RegionNotFoundError` → reported as unavailable
   - `NoUsableObservationError` → reported as unavailable (safe reason)
   - `MLInputError` → reported as unavailable (missing rainfall, etc.)
   - `MLInferenceError` → reported as unavailable (model crashed)
   - `MLOutputValidationError` → reported as unavailable
   - `PredictionPersistenceError` → reported as unavailable
   - `MLModelUnavailableError` → **re-raised** (systemic failure, stops batch)
   - `Exception` (unexpected) → reported as "UnexpectedError" with safe message
5. **Continues processing** remaining regions after each isolated failure
6. **Returns structured result** with counts and safe error messages

**No fabricated predictions**: Regions without observations get explicit unavailable status, never assigned probability 0 or LOW risk.

---

## Persistence Behavior

- **Reuses existing `PredictionService._persist_prediction()`** — UPSERT on `UNIQUE(region_id, generated_at)`
- **No duplicate prediction rows** — idempotent per region + timestamp
- **Repeated batch calls** safely update existing predictions (same behavior as single-region)

---

## Tests Added (20)

| Test | Description |
|------|-------------|
| `test_zero_configured_regions_returns_empty_result` | Empty DB returns empty response |
| `test_one_configured_region_successful` | Single region works |
| `test_multiple_successful_regions` | Multiple regions all succeed |
| `test_mixed_successful_and_unavailable_regions` | Mixed success/unavailable |
| `test_one_region_failure_does_not_abort_batch` | Failure isolation verified |
| `test_no_usable_observation_reported_explicitly` | Safe reason for missing obs |
| `test_model_failure_isolated` | Model crash for one region doesn't stop batch |
| `test_region_wide_response_structure` | All required fields present |
| `test_correct_total_regions_count` | `total_regions` matches DB count |
| `test_correct_predictions_available_count` | Available count accurate |
| `test_correct_predictions_unavailable_count` | Unavailable count accurate |
| `test_risk_classification_correct_in_batch` | Risk levels match thresholds |
| `test_ml_output_contract_unchanged_in_batch` | ML fields preserved |
| `test_existing_single_region_endpoint_still_works` | Backward compatibility |
| `test_route_collision_no_conflict` | Both endpoints work |
| `test_repeated_batch_execution_idempotent` | UPSERT works correctly |
| `test_no_fabricated_predictions` | Missing obs → unavailable, not 0/LOW |
| `test_no_internal_exception_details_exposed` | Safe error messages |
| `test_dependency_injection_preserved` | Uses injected model |
| `test_model_unavailable_returns_503` | Systemic failure returns 503 |

---

## Full pytest Result

```
192 passed, 24 skipped, 2 warnings in 5.33s
```

- **Passed**: 192 (including 20 new region-wide tests + 18 existing API tests + 17 risk tests + 137 prior tests)
- **Skipped**: 24 (PostgreSQL integration tests — require `DATABASE_URL_TEST` env var)
- **Warnings**: 2 (unrelated deprecation warnings from `fastapi.testclient` and `anyio`)

---

## Assumptions

1. **3 development regions** seeded via `seed.py` (not 180 Assam Revenue Circles — production grid not yet implemented)
2. **Sequential processing** — 3 regions is small; no concurrency needed
3. **Model unavailable is systemic** — stops entire batch (correct behavior)
4. **Baseline model** used via DI — no joblib/sklearn/xgboost/pandas
5. **ML contract unchanged** — `MLPredictionOutput` has no `risk_level`

---

## Deviations from Prompt

None — all requirements implemented as specified.

---

## Architecture Verification

Final architecture matches target:

```
Observation DB
      │
      ▼
PredictionService (DI: FloodPredictionModel + Session)
      │
      ▼
HydrologicalBaselineModel (or future AssamFloodModel)
      │
      ▼
flood_probability (MLPredictionOutput)
      │
      ▼
classify_risk_level()  ← Backend layer
      │
      ▼
risk_level (RiskLevel enum)
      │
      ▼
GET /api/v1/predictions (region-wide)
      │
      ▼
RegionWidePredictionResponse
      │
      ▼
Frontend (not in this phase)
```

---

## Test Commands

```bash
# Region-wide tests only
python -m pytest tests/test_region_wide_prediction.py -v

# All tests
python -m pytest tests/ -q
```
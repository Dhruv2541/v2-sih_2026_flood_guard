# Phase 5B-1 — Backend Risk Classification + Prediction API — Final Report

---

## Files Created

| File | Description |
|------|-------------|
| `backend/app/services/risk.py` | Risk classification service with `classify_risk_level()`, `RiskLevel` enum, threshold constants |
| `backend/app/schemas/prediction.py` | API response schema `PredictionResponse` |
| `backend/app/api/endpoints/predictions.py` | GET `/api/v1/predictions/{region_id}` endpoint |
| `backend/tests/test_risk_classification.py` | 17 tests for risk classification |
| `backend/tests/test_prediction_api.py` | 18 tests for prediction API endpoint |

## Files Modified

| File | Change |
|------|--------|
| `backend/app/services/__init__.py` | Export `RiskLevel`, `InvalidProbabilityError`, `classify_risk_level`, `LOW_MAX`, `MODERATE_MAX`, `HIGH_MAX` |
| `backend/app/schemas/__init__.py` | Export `PredictionResponse` |
| `backend/app/api/endpoints/__init__.py` | Export `predictions` module |
| `backend/app/api/router.py` | Include `predictions.router` with "Predictions" tag |

---

## Risk Classification Implementation

**Location**: `backend/app/services/risk.py`

```python
# Prototype threshold constants (explicit, not magic numbers)
LOW_MAX = Decimal("0.25")
MODERATE_MAX = Decimal("0.50")
HIGH_MAX = Decimal("0.75")

def classify_risk_level(flood_probability: Decimal) -> RiskLevel:
    """Classify flood probability into risk level.

    Boundary behavior (deterministic):
        0.00      -> LOW
        0.249     -> LOW
        0.25      -> MODERATE
        0.499     -> MODERATE
        0.50      -> HIGH
        0.749     -> HIGH
        0.75      -> CRITICAL
        1.00      -> CRITICAL

    Raises InvalidProbabilityError for: NaN, infinity, < 0, > 1
    """
```

**Key properties**:
- Explicit threshold constants (no magic numbers)
- Returns `RiskLevel` enum (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`)
- Defensive validation: rejects NaN, infinity, negative, >1
- Clearly documented as **PROTOTYPE PLACEHOLDERS** — not scientifically validated

---

## API Endpoint Implemented

**Endpoint**: `GET /api/v1/predictions/{region_id}`

**Full path**: `/api/v1/predictions/{region_id}` (mounted at `settings.API_PREFIX` = `/api/v1`)

**Response Model**: `PredictionResponse`

**OpenAPI Documentation**: Properly registered with:
- 200 response with example
- 404 (region not found / no observation)
- 422 (invalid input / missing rainfall)
- 503 (model unavailable)
- 500 (inference error / output validation / persistence failure)

---

## Response Schema

```python
class PredictionResponse(BaseModel):
    region_id: str
    generated_at: datetime          # timezone-aware UTC
    forecast_valid_until: datetime  # timezone-aware UTC, 6h after generated_at
    flood_probability: Decimal      # 0.0 to 1.0 (unchanged from ML output)
    risk_level: str                 # "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
    model_version: str              # e.g., "baseline-v1"
```

**Example Response**:
```json
{
  "region_id": "majuli",
  "generated_at": "2026-09-26T10:00:00Z",
  "forecast_valid_until": "2026-09-26T16:00:00Z",
  "flood_probability": 0.683,
  "risk_level": "HIGH",
  "model_version": "baseline-v1"
}
```

---

## Error Mappings

| Domain Exception | HTTP Status | Detail |
|------------------|-------------|--------|
| `RegionNotFoundError` | 404 | "Region '{region_id}' not found" |
| `NoUsableObservationError` | 404 | "No usable observation found for region '{region_id}'" |
| `MLInputError` | 422 | Original exception message |
| `MLModelUnavailableError` | 503 | "Prediction model is currently unavailable" |
| `MLInferenceError` | 500 | "Prediction model inference failed" |
| `MLOutputValidationError` | 500 | "Prediction model returned invalid output" |
| `PredictionPersistenceError` | 500 | "Failed to persist prediction" |
| `InvalidProbabilityError` | 500 | "Invalid flood probability from model: {exc}" |

**No internal stack traces, database details, or exception class names exposed to API consumers.**

---

## Tests Added (35 total)

### Risk Classification Tests (17)
| Test | Description |
|------|-------------|
| `test_threshold_constants_are_explicit` | Constants are explicit module-level values |
| `test_zero_probability_is_low` | 0.00 → LOW |
| `test_0_249_is_low` | 0.249 → LOW |
| `test_0_25_is_moderate` | 0.25 → MODERATE |
| `test_0_499_is_moderate` | 0.499 → MODERATE |
| `test_0_50_is_high` | 0.50 → HIGH |
| `test_0_749_is_high` | 0.749 → HIGH |
| `test_0_75_is_critical` | 0.75 → CRITICAL |
| `test_1_00_is_critical` | 1.00 → CRITICAL |
| `test_intermediate_values_in_each_range` | Various values in each band |
| `test_negative_probability_rejected` | Negative → InvalidProbabilityError |
| `test_probability_above_one_rejected` | >1 → InvalidProbabilityError |
| `test_nan_rejected` | NaN → InvalidProbabilityError |
| `test_positive_infinity_rejected` | +Inf → InvalidProbabilityError |
| `test_negative_infinity_rejected` | -Inf → InvalidProbabilityError |
| `test_risk_level_enum_values` | Enum has correct string values |
| `test_classify_returns_enum` | Returns RiskLevel enum |

### API Endpoint Tests (18)
| Test | Description |
|------|-------------|
| `test_successful_prediction_returns_200` | Happy path returns 200 |
| `test_response_contains_expected_fields` | All 6 fields present |
| `test_flood_probability_unchanged_from_model_output` | Probability matches ML output |
| `test_correct_risk_level_derived` | Risk level matches thresholds |
| `test_model_version_is_baseline_v1` | Version passed through |
| `test_region_not_found_returns_404` | Unknown region → 404 |
| `test_no_usable_observation_returns_404` | No observation → 404 |
| `test_missing_rainfall_returns_422` | Missing rainfall → 422 |
| `test_model_unavailable_returns_503` | Model unavailable → 503 |
| `test_model_inference_error_returns_500` | Inference error → 500 |
| `test_model_output_validation_failure_returns_500` | Invalid output → 500 |
| `test_persistence_failure_returns_500` | Persistence failure → 500 |
| `test_error_responses_dont_expose_internal_details` | No stack traces/class names |
| `test_route_uses_prediction_service_dependency_injection` | Uses DI pattern |
| `test_route_does_not_instantiate_hydrological_baseline_model_directly` | No direct instantiation |
| `test_ml_output_contract_unchanged` | ML contract preserved |
| `test_response_timestamps_are_iso_format` | ISO format with timezone |
| `test_forecast_valid_until_is_6_hours_after_generated` | 6h horizon verified |

---

## Full pytest Result

```
172 passed, 24 skipped, 2 warnings in 4.82s
```

- **Passed**: 172 (including 35 new tests)
- **Skipped**: 24 (PostgreSQL integration tests — require `DATABASE_URL_TEST` env var)
- **Warnings**: 2 (unrelated deprecation warnings from `fastapi.testclient` and `anyio`)

---

## Assumptions

1. **Risk thresholds** (0.25, 0.50, 0.75) are prototype placeholders — clearly documented as such in code and docstrings
2. **API prefix** is `/api/v1` (from `settings.API_PREFIX`)
3. **Database session** dependency (`get_db`) follows existing pattern
4. **PredictionService** already handles persistence via UPSERT — endpoint delegates to it
5. **ML contract unchanged** — `MLPredictionOutput` has no `risk_level` field
6. **Baseline model** is instantiated per-request in dependency (stateless, deterministic)

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
GET /api/v1/predictions/{region_id}
      │
      ▼
PredictionResponse (flood_probability + risk_level)
      │
      ▼
Frontend (not in this phase)
```

---

## Test Commands

```bash
# Risk classification tests only
python -m pytest tests/test_risk_classification.py -v

# API endpoint tests only
python -m pytest tests/test_prediction_api.py -v

# All tests
python -m pytest tests/ -q
```
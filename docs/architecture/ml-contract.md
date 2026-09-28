# Machine Learning Prediction Contract & Inference Boundary

**Project**: AI/ML-Based Integrated Heavy Rainfall Early Warning and Inundation Prediction System (Assam, India)  
**Phase**: Phase 4A — ML Prediction Contract & Inference Boundary  
**Status**: APPROVED SPECIFICATION  
**Authoritative Scope**: Decoupled interface between backend data pipelines and ML inference engines.

---

## 1. Architectural Boundary & Data Flow

Phase 4A establishes the formal interface contract between the operational backend and the machine learning model.

```
PostgreSQL / Supabase
        │
        ▼ (Observations + Regional Metadata)
Backend Observation Retrieval
        │
        ▼
Feature Preparation (`prepare_prediction_input`)
        │
        ▼
`MLPredictionInput` (Pydantic Contract)
        │
        ▼
`FloodPredictionModel.predict()` (Abstract Interface)
        │
        ▼
`MLPredictionOutput` (Pydantic Contract)
        │
        ▼
Output Validation Boundary (`validate_model_output`)
        │
        ▼
[Future Phase: Prediction Persistence & Scheduling]
```

---

## 2. Division of Responsibilities

| Domain | Responsibilities | Excluded / NOT Responsible For |
| :--- | :--- | :--- |
| **Backend System** | • Ingest and retrieve time-series observations from database/providers.<br>• Validate incoming observation completeness.<br>• Assemble and validate `MLPredictionInput`.<br>• Dispatch input to `FloodPredictionModel`.<br>• Validate `MLPredictionOutput` (bounds, region consistency).<br>• Handle domain exceptions (`MLInputError`, `MLInferenceError`, etc.).<br>• Persist validated predictions to PostgreSQL in future phases. | • Training ML models.<br>• Selecting algorithms (RF, XGBoost, etc.).<br>• Inventing heuristic risk thresholds.<br>• Fabricating missing sensor/terrain metrics.<br>• Imputing missing river gauge levels. |
| **Machine Learning Layer** | • Define and document model architecture.<br>• Feature engineering and selection on offline datasets.<br>• Model training, cross-validation, and artifact packaging.<br>• Implement `predict(input_data: MLPredictionInput) -> MLPredictionOutput`.<br>• Return calibrated `flood_probability` strictly in range $[0.0, 1.0]$.<br>• Supply explicit, non-empty `model_version`. | • Interacting directly with database connections.<br>• Managing HTTP provider connections.<br>• Implementing cron/APScheduler jobs.<br>• Managing user alerts or frontend REST endpoints. |

---

## 3. ML Input Contract (`MLPredictionInput`)

Located in: `backend/app/ml/schemas.py`

The input schema represents the data supplied to the ML model. It includes only features available from the authoritative backend pipeline.

### Schema Attributes

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `region_id` | `str` | Mandatory, non-empty, non-whitespace | Canonical region slug (e.g. `'DEV_AS_BAR_01'`). |
| `reference_time` | `datetime` | Mandatory, timezone-aware UTC | Time of the observation snapshot (normalized to UTC). |
| `rainfall_1h_mm` | `Decimal` | Mandatory, $\ge 0.0$ | Rolling 1-hour accumulated precipitation in mm. |
| `rainfall_3h_mm` | `Decimal` | Mandatory, $\ge 0.0$ | Rolling 3-hour accumulated precipitation in mm. |
| `rainfall_6h_mm` | `Decimal` | Mandatory, $\ge 0.0$ | Rolling 6-hour accumulated precipitation in mm. |
| `rainfall_24h_mm`| `Decimal` | Mandatory, $\ge 0.0$ | Rolling 24-hour accumulated precipitation in mm. |
| `water_level_m` | `Optional[Decimal]` | Optional, nullable | River gauge water level in meters. `None` when absent. |
| `elevation_m` | `Optional[Decimal]` | Optional, nullable | Topographical elevation in meters. `None` when absent. |
| `temperature_c` | `Optional[Decimal]` | Optional, nullable | Ambient temperature in Celsius. `None` when absent. |
| `humidity_pct` | `Optional[Decimal]` | Optional, nullable, $0.0 \le v \le 100.0$ | Relative humidity percentage. `None` when absent. |

- `extra="forbid"`: Disallows unapproved fields to prevent accidental schema drift.

---

## 4. ML Output Contract (`MLPredictionOutput`)

Located in: `backend/app/ml/schemas.py`

The output schema represents the raw result returned by the ML model inference computation.

### Schema Attributes

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `region_id` | `str` | Mandatory, non-empty, non-whitespace | Must strictly match the input's `region_id`. |
| `generated_at` | `datetime` | Mandatory, timezone-aware UTC | Timestamp when inference was executed. |
| `forecast_valid_until` | `datetime` | Mandatory, timezone-aware UTC, $\ge$ `generated_at` | End of prediction validity window. |
| `flood_probability` | `Decimal` | Mandatory, $0.0 \le p \le 1.0$ | Calibrated inundation probability. |
| `model_version` | `str` | Mandatory, non-empty, non-whitespace | Model artifact / release version identifier. |

- `extra="forbid"`: Strictly disallows extra fields.

---

## 5. Explicit Exclusions & What Phase 4A Does NOT Implement

> [!IMPORTANT]
> The following decisions are strictly locked for Phase 4A:
> 
> 1. **No Model Selection or Training**: No Random Forest, XGBoost, Neural Network, or rule-based heuristics are implemented in this phase.
> 2. **No Risk Level Classification**: `risk_level` (`low`, `moderate`, `high`, `severe`) is **NOT** part of `MLPredictionOutput` in Phase 4A. No probability thresholds (e.g. $< 0.25 = \text{low}$) are hardcoded or derived.
> 3. **No Fallback Metadata**: `is_fallback` and `fallback_reason` are database/persistence-level concepts and are **NOT** part of the model inference contract. Model failures must raise structured exceptions rather than return synthetic fallback predictions.
> 4. **No Forecast Horizon Invention**: Phase 4A does not invent fixed 1-hour, 3-hour, or 6-hour durations; it only enforces that `forecast_valid_until >= generated_at`.
> 5. **No Database Schema Changes**: The Phase 2B schema remains authoritative. Elevation is optional and must not cause table migrations.
> 6. **No Prediction Persistence or Scheduling**: No database writes, background jobs, or frontend endpoints are added in Phase 4A.

---

## 6. Strict Missing-Data & Anti-Fabrication Policy

To maintain scientific integrity and prevent hallucinated predictions:

1. **Mandatory Rainfall**: If any required rainfall accumulation (`1h`, `3h`, `6h`, `24h`) is missing or `None`, feature preparation **FAILS** with `MLInputError`. Rainfall is **NEVER** silently filled with `0`.
2. **Missing River Gauge (`water_level_m`)**: Remains explicitly `None`. It is **NEVER** filled with `0` or interpolated from historical data without an approved hydrological policy.
3. **Missing Elevation (`elevation_m`)**: If the region object lacks elevation or is `None`, it remains `None`. Elevation is **NEVER** fabricated with `0` or default values.
4. **No Speculative Feature Engineering**: The backend does NOT compute rainfall ratios, rolling derivatives, slope calculations, or synthetic flood scores. Feature engineering belongs to the ML pipeline.

---

## 7. Error Boundary & Exception Taxonomy

Located in: `backend/app/ml/exceptions.py`

The ML domain maintains an isolated error hierarchy completely separated from `WeatherProviderError` and `ObservationPersistenceError`:

```
MLError (Exception)
├── MLInputError
│   └── Raised when input features are missing, malformed, or violate constraints.
├── MLModelUnavailableError
│   └── Raised when model weights, runtime, or engine cannot be loaded.
├── MLInferenceError
│   └── Raised when calculation or execution fails during predict().
└── MLOutputValidationError
    └── Raised when model output violates probability bounds or region consistency.
```

- **Domain Isolation**:
  - Provider errors $\rightarrow$ `WeatherProviderError`
  - Database errors $\rightarrow$ `ObservationPersistenceError`
  - ML errors $\rightarrow$ `MLError`
  - None of these hierarchies inherit from each other.

---

## 8. Model Interface (`FloodPredictionModel`)

Located in: `backend/app/ml/base.py`

```python
class FloodPredictionModel(ABC):
    @abstractmethod
    def predict(self, input_data: MLPredictionInput) -> MLPredictionOutput:
        """Executes model inference for the given region's input features."""
        pass
```

- **Minimalist Design**: No dynamic registries, no plugin frameworks, no ensemble managers, and no factory abstractions.
- **Output Validation**: `validate_model_output(output, expected_region_id)` guarantees that model output satisfies probability bounds ($0.0 \le p \le 1.0$) and that `output.region_id == input.region_id` without silent substitution.

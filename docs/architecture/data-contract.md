# Authoritative Data Contract & Database Schema Proposal

**Project**: AI/ML-Based Integrated Heavy Rainfall Early Warning and Inundation Prediction System (Assam, India)  
**Phase**: Phase 2B — Database Schema Implementation  
**Target Platform**: PostgreSQL hosted on Supabase  
**Backend Framework**: FastAPI + SQLAlchemy 2.x + psycopg  
**Status**: APPROVED IMPLEMENTATION SPECIFICATION

---

## 1. Project Decision Status (Finalized vs Pending)

### FINALIZED DECISIONS:
- **Canonical Identifier**: Uniformly use `region_id` across database, API, and ML interfaces.
- **Primary Key Naming**: `regions.region_id` is the primary key column name. (Do NOT use `regions.id`).
- **Foreign Key Consistency**: `observations.region_id` and `predictions.region_id` reference `regions.region_id` with `ON DELETE CASCADE`.
- **Table Separation**: Strictly 3 normalized tables: `regions`, `observations`, `predictions`.
- **Timestamp Standard**: All stored timestamps use `timestamptz` in **UTC** (frontend handles local IST display).
- **Probability Scale**: Bounded numerical value from `0.0` to `1.0`.
- **Risk Severity Levels**: Controlled values: `'low'`, `'moderate'`, `'high'`, `'severe'`.
- **6-Hour Prediction Window**: Semantics defined by `generated_at` (run time) and `forecast_valid_until` (end of 6h window).
- **Data Boundary**: Multi-year historical training data remains outside Supabase (in `data/` or cloud buckets); Supabase stores only operational reference regions, rolling recent observations, and predictions.
- **GIS Simplicity**: Representative coordinates `(latitude, longitude)` as `double precision`. PostGIS is **not** required for this prototype.
- **Elevation Location**: `elevation_m` resides in `regions` table as static metadata.
- **Freshness Computation**: `is_stale` is **not** stored in the database; it is dynamically calculated by the backend from `current_time - recorded_at`.
- **Data Source Integrity**: `data_source` is `TEXT NOT NULL` with **no misleading database default**.
- **Model Version Integrity**: `model_version` is `TEXT NOT NULL` with **no database default** (explicitly supplied by application/ML layer).
- **No Premature Indexes**: No standalone index on `forecast_valid_until` is currently required; the unique index on `(region_id, generated_at)` supports access patterns.

### PENDING DECISIONS (Awaiting Confirmation):
- **Final ML Feature Vector**: Pending explicit confirmation from ML team before Phase 3.
- **Live River Water-Level API**: Availability of real-time CWC river gauge feeds (handled as nullable in schema).
- **Live Weather Data Providers**: Final selection between Open-Meteo, IMD, or synthetic generator.
- **Exact Region / Grid Resolution**: Administrative centers (~35 districts) vs uniform spatial grid (~100 points).
- **Numerical Risk Thresholds**: Exact cutoffs for probability-to-risk mapping (belongs to risk engine logic).
- **Scheduler Frequency**: Final interval for periodic live ingestion and prediction recalculation.

---

## 2. System Data Flow

```
[ Historical Datasets ] ──> [ ML Feature Prep & Training ] ──> [ Trained Model Artifact ]
                                                                       │
[ External Live Providers ]                                            │
 (Rainfall, River Gauges, Weather)                                     │
         │                                                             │
         ▼                                                             │
[ Backend Live Fetcher ]                                               │
         │                                                             │
         ▼                                                             │
[ observations Table ] ──> [ Backend Feature Preprocessor ]            │
                                       │ (Combines observations        │
                                       │  with regions.elevation_m)    │
                                       ▼                               ▼
                             [ In-Memory Inference Contract (Backend -> ML) ]
                                       │
                                       ▼
                             [ ML Output: Probability & Risk Level ]
                                       │
                                       ▼
                            [ predictions Table ]
                                       │
                                       ▼
                          [ FastAPI REST Endpoints ]
                                       │
                                       ▼
                     [ Frontend Map & Flood Risk Cards ]
```

---

## 3. Canonical Terminology

- **Canonical Identifier**: **`region_id`** (Type: `text`).
  - *Rule*: Always use `region_id` across all API schemas, database columns, and ML inputs.
  - *Do NOT use*: `grid_id`, `location_id`, or `zone_id` as competing keys.
  - *Primary Key*: `regions.region_id` (NOT `regions.id`).
  - *Format*: Structured slug (e.g., `DEV_AS_BAR_01`, `AS-BARPETA-01`, or spatial grid slug `GRID-2610-9175`).
- **Observation**: Environmental measurements captured at a specific point in time for a `region_id`.
- **Prediction**: Model-generated flood risk probability and category valid for a specific 6-hour forecast window.
- **Forecast Horizon**: The future 6-hour time window (`forecast_valid_until = generated_at + 6 hours`).

---

## 4. Geographic & Region Contract

### Spatial Representation Strategy
For the 6-day SIH prototype:
- Each monitored area in Assam is represented by its **representative centroid / station coordinate**:
  - `latitude`: `double precision` (degrees North, bounded 20.0 to 30.0 for Assam)
  - `longitude`: `double precision` (degrees East, bounded 88.0 to 98.0 for Assam)
- **PostGIS Decision**: **PostGIS is NOT required for the prototype**.
  - *Rationale*: Marker, pin, and circle rendering on map frameworks (Leaflet/Mapbox) requires only `(latitude, longitude)`. Enabling PostGIS introduces binary spatial types, GeoAlchemy dependencies, and platform overhead with zero practical benefit for a 6-day prototype. If regional boundary polygons are needed on the frontend, a static GeoJSON file indexed by `region_id` will be rendered directly by the frontend.
- **Topographical Elevation**:
  - `elevation_m`: `numeric(6,1)` (meters above sea level). Stored in `regions` as fixed metadata and combined with observations during ML feature assembly.

---

## 5. Observation Data Contract

### Categories of Variables
1. **Raw Observations**: Directly measured sensor metrics:
   - `rainfall_1h_mm`: `numeric(6,2)` (precipitation in last 1 hour, mm)
   - `water_level_m`: `numeric(6,2)` (river gauge height, meters, nullable, unconstrained)
   - `temperature_c`: `numeric(4,1)` (ambient temperature, Celsius, nullable)
   - `humidity_pct`: `numeric(4,1)` (relative humidity percentage, 0.0 to 100.0, nullable)
2. **Derived / Aggregated Metrics**: Windowed accumulations:
   - `rainfall_3h_mm`: `numeric(6,2)` (precipitation accumulated in last 3 hours, mm)
   - `rainfall_6h_mm`: `numeric(6,2)` (precipitation accumulated in last 6 hours, mm)
   - `rainfall_24h_mm`: `numeric(6,2)` (precipitation accumulated in last 24 hours, mm)
   - *Rationale*: Storing rolling accumulations directly simplifies ML feature assembly and avoids expensive multi-row window queries in PostgreSQL.
3. **Region Metadata**: Topographical and spatial attributes (`elevation_m`, `district`) stored in `regions`, not duplicated in observation logs.

### Freshness & Data Source Rules
- **No Persistent `is_stale` Column**: Freshness is time-dependent and calculated dynamically by the backend from `current_time - recorded_at`. The API response may expose `is_stale` as a computed field, but it is not persisted in the database.
- **No Misleading Default on `data_source`**: `data_source` is declared `TEXT NOT NULL` without a default value. In development, the backend explicitly passes `"mock"`. In production, external providers supply their identifier (e.g., `"open-meteo"`, `"imd"`, `"cwc"`).

---

## 6. Machine Learning Input Contract

> [!IMPORTANT]
> **Status: ML Feature Vector Pending Final ML-Team Confirmation.**
> The ML team has not yet frozen the exact input vector. The contract below defines the minimum decoupled interface structure so the backend and database will not need structural redesign once the feature list is confirmed.

### Interface Signature (Backend → ML Inference Engine)
The backend feature preparation layer extracts the latest observation, retrieves `elevation_m` from `regions`, and calls the ML inference engine with the following generic dictionary / JSON structure:

```json
{
  "region_id": "DEV_AS_BAR_01",
  "timestamp": "2026-09-15T18:00:00Z",
  "features": {
    "rainfall_1h_mm": 14.5,
    "rainfall_3h_mm": 41.2,
    "rainfall_6h_mm": 75.0,
    "rainfall_24h_mm": 132.8,
    "water_level_m": 48.20,
    "temperature_c": 28.4,
    "humidity_pct": 86.0,
    "elevation_m": 35.0
  }
}
```

*Architectural Boundary*: The ML layer expects numerical values. Missing sensor data (e.g., river gauge unavailable in that grid) must be imputed or handled gracefully by the ML preprocessor with default/fallback values rather than throwing unhandled exceptions.

---

## 7. Machine Learning Output Contract

The ML component returns a deterministic prediction result for a given region and timestamp:

```json
{
  "region_id": "DEV_AS_BAR_01",
  "generated_at": "2026-09-15T18:00:00Z",
  "forecast_valid_until": "2026-09-16T00:00:00Z",
  "flood_probability": 0.82,
  "risk_level": "high",
  "model_version": "v1.0"
}
```

### Constraints & Standards
- **Probability Representation**: Bounded float between `0.0` and `1.0`.
- **Risk Level Enum**: Controlled string values: `'low'`, `'moderate'`, `'high'`, `'severe'`.
- **Model Version**: Mandatory string explicitly supplied by ML component (no database default).
- **Numerical Thresholds**: Mapping from probability to risk category will be governed by the ML team / risk-engine module in Phase 3 (e.g., `< 0.30` = Low, `0.30 - 0.60` = Moderate, `0.60 - 0.85` = High, `> 0.85` = Severe). Thresholds are not hardcoded in the database.

---

## 8. 6-Hour Prediction Horizon Semantics

For the SIH prototype, the prediction semantics are defined as follows:
- **`generated_at`**: The UTC timestamp when the prediction was generated (e.g., `2026-09-15T12:00:00Z`).
- **`forecast_valid_until`**: The UTC timestamp representing the end of the current 6-hour prediction validity window (e.g., `2026-09-15T18:00:00Z`).
- **Explicit Meaning**:
  > *"The model generated a prediction at 12:00 UTC for flood risk over the following 6-hour window."*
  > `forecast_valid_until` does NOT represent the exact moment at which a flood will occur.

---

## 9. Data Freshness & Fallback Strategy

### Dynamic Freshness Evaluation
- Observations older than a configurable backend threshold (e.g., > 3 hours) are considered stale.
- The backend evaluates freshness dynamically:
  ```python
  is_stale = (current_utc_time - observation.recorded_at) > timedelta(hours=3)
  ```

### Fallback Metadata in Predictions
When external APIs throttle or fail:
1. **Recent Cached Data**: The backend uses the latest cached observation in the database.
2. **Nearby Region Imputation**: If a region has no sensor observations, rainfall from the nearest neighboring centroid can be used.
3. **Database Columns in `predictions`**:
   - `is_fallback`: `boolean` (default `false`)
   - `fallback_reason`: `text` (nullable; e.g., `'stale_data_used'`, `'neighbor_imputation'`)
4. **Frontend Indication**:
   When `is_fallback == true`, the frontend displays an informational badge:
   *"Data delayed. Approximate prediction based on recent observations."*

---

## 10. Proposed PostgreSQL Database Schema

The database consists of **3 clean, normalized tables**:

```
┌─────────────────────────────────┐
│             regions             │
├─────────────────────────────────┤
│ region_id (PK, text)            │
│ name (text)                     │
│ district (text)                 │
│ latitude (double precision)     │
│ longitude (double precision)    │
│ elevation_m (numeric)           │
│ created_at (timestamptz)        │
└────────────────┬────────────────┘
                 │ 1
                 │
                 │ has many
                 ├───────────────────────────────┐
                 │ N                             │ N
┌────────────────▼────────────────┐ ┌────────────▼────────────────────┐
│          observations           │ │           predictions           │
├─────────────────────────────────┤ ├─────────────────────────────────┤
│ id (PK, bigint identity)        │ │ id (PK, bigint identity)        │
│ region_id (FK, text)            │ │ region_id (FK, text)            │
│ recorded_at (timestamptz)       │ │ generated_at (timestamptz)      │
│ rainfall_1h_mm (numeric)        │ │ forecast_valid_until (tz)       │
│ rainfall_3h_mm (numeric)        │ │ flood_probability (numeric)     │
│ rainfall_6h_mm (numeric)        │ │ risk_level (text)               │
│ rainfall_24h_mm (numeric)       │ │ is_fallback (boolean)           │
│ water_level_m (numeric)         │ │ fallback_reason (text)          │
│ temperature_c (numeric)         │ │ model_version (text, NO DEFAULT)│
│ humidity_pct (numeric)          │ │ created_at (timestamptz)        │
│ data_source (text, NO DEFAULT)  │ └─────────────────────────────────┘
│ created_at (timestamptz)        │
└─────────────────────────────────┘
```

---

## 11. Detailed Table Specifications

### Table 1: `regions`
Stores static geographic, administrative, and topographical metadata for monitored zones in Assam.

| Column Name | PostgreSQL Type | Nullable | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `region_id` | `text` | NOT NULL | `PRIMARY KEY` | Canonical region ID (e.g. `'DEV_AS_BAR_01'`) |
| `name` | `text` | NOT NULL | | Regional descriptive name (e.g. `'Barpeta Development Grid Region'`) |
| `district` | `text` | NOT NULL | | Assam district name (e.g. `'Barpeta'`) |
| `latitude` | `double precision` | NOT NULL | `CHECK (latitude BETWEEN 20.0 AND 30.0)` | Centroid latitude (Assam bounds) |
| `longitude` | `double precision` | NOT NULL | `CHECK (longitude BETWEEN 88.0 AND 98.0)` | Centroid longitude (Assam bounds) |
| `elevation_m` | `numeric(6,1)` | NULL | | Topographical elevation in meters |
| `created_at` | `timestamptz` | NOT NULL | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp (UTC) |

---

### Table 2: `observations`
Stores periodic time-series environmental observations per region.

| Column Name | PostgreSQL Type | Nullable | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `bigint` | NOT NULL | `GENERATED ALWAYS AS IDENTITY PRIMARY KEY` | Sequential row identifier |
| `region_id` | `text` | NOT NULL | `REFERENCES regions(region_id) ON DELETE CASCADE` | Foreign key to `regions` |
| `recorded_at` | `timestamptz` | NOT NULL | | Timestamp of the actual measurement (UTC) |
| `rainfall_1h_mm` | `numeric(6,2)` | NULL | `CHECK (rainfall_1h_mm >= 0.0)` | Rainfall accumulation in last 1 hour |
| `rainfall_3h_mm` | `numeric(6,2)` | NULL | `CHECK (rainfall_3h_mm >= 0.0)` | Rainfall accumulation in last 3 hours |
| `rainfall_6h_mm` | `numeric(6,2)` | NULL | `CHECK (rainfall_6h_mm >= 0.0)` | Rainfall accumulation in last 6 hours |
| `rainfall_24h_mm`| `numeric(6,2)` | NULL | `CHECK (rainfall_24h_mm >= 0.0)` | Rainfall accumulation in last 24 hours |
| `water_level_m` | `numeric(6,2)` | NULL | | River gauge height in meters (unconstrained) |
| `temperature_c` | `numeric(4,1)` | NULL | | Ambient temperature in Celsius |
| `humidity_pct`  | `numeric(4,1)` | NULL | `CHECK (humidity_pct BETWEEN 0.0 AND 100.0)` | Relative humidity percentage |
| `data_source`   | `text` | NOT NULL | *(No default; explicitly supplied by app)* | Data provider identifier |
| `created_at`    | `timestamptz` | NOT NULL | `DEFAULT CURRENT_TIMESTAMP` | Ingestion timestamp (UTC) |

*Unique Constraint*: `UNIQUE (region_id, recorded_at)` (prevents duplicate observation records for the same timestamp).

---

### Table 3: `predictions`
Stores model inference results valid for the next 6 hours.

| Column Name | PostgreSQL Type | Nullable | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `bigint` | NOT NULL | `GENERATED ALWAYS AS IDENTITY PRIMARY KEY` | Sequential row identifier |
| `region_id` | `text` | NOT NULL | `REFERENCES regions(region_id) ON DELETE CASCADE` | Foreign key to `regions` |
| `generated_at` | `timestamptz` | NOT NULL | | UTC time when prediction was computed |
| `forecast_valid_until` | `timestamptz` | NOT NULL | `CHECK (forecast_valid_until >= generated_at)` | UTC end of 6-hour validity window |
| `flood_probability` | `numeric(4,3)` | NOT NULL | `CHECK (flood_probability >= 0.0 AND flood_probability <= 1.0)` | Model probability score (0.000 to 1.000) |
| `risk_level` | `text` | NOT NULL | `CHECK (risk_level IN ('low', 'moderate', 'high', 'severe'))` | Controlled categorical severity |
| `is_fallback` | `boolean` | NOT NULL | `DEFAULT false` | True if computed from stale/imputed data |
| `fallback_reason` | `text` | NULL | | Explanation if fallback logic was invoked |
| `model_version` | `text` | NOT NULL | *(No default; explicitly supplied by app)* | Model identifier string |
| `created_at` | `timestamptz` | NOT NULL | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp (UTC) |

*Unique Constraint*: `UNIQUE (region_id, generated_at)` (prevents duplicate predictions per run).

---

## 12. Indexing Strategy

- `regions`: `PRIMARY KEY (region_id)` creates unique btree index.
- `observations`: `UNIQUE (region_id, recorded_at)` creates composite unique btree index supporting region lookups and chronological ordering.
- `predictions`: `UNIQUE (region_id, generated_at)` creates composite unique btree index supporting region lookups and chronological ordering.
- **Decision on Standalone Indexes**:
  > *"No standalone index on `forecast_valid_until` is currently required. The unique constraint `(region_id, generated_at)` already satisfies regional prediction lookups."*

---

## 13. Frontend Output Contract

The backend will expose a unified endpoint for the frontend map view (`GET /api/v1/predictions/latest`). The planned JSON payload structure:

```json
[
  {
    "region_id": "DEV_AS_BAR_01",
    "region_name": "Barpeta Development Grid Region",
    "district": "Barpeta",
    "latitude": 26.3245,
    "longitude": 91.0082,
    "elevation_m": 35.0,
    "prediction": {
      "generated_at": "2026-09-15T18:00:00Z",
      "forecast_valid_until": "2026-09-16T00:00:00Z",
      "flood_probability": 0.82,
      "risk_level": "high",
      "model_version": "v1.0",
      "is_fallback": false,
      "fallback_reason": null
    },
    "latest_observation": {
      "recorded_at": "2026-09-15T17:30:00Z",
      "rainfall_1h_mm": 18.2,
      "rainfall_3h_mm": 45.0,
      "rainfall_6h_mm": 80.5,
      "rainfall_24h_mm": 134.5,
      "water_level_m": 48.25,
      "temperature_c": 27.8,
      "humidity_pct": 88.0,
      "is_stale": false
    }
  }
]
```

*(Note: `is_stale` is computed by the backend at response time and included in the API response, but is not stored in the database).*

---

## 14. Historical Data vs Live Data Strategy

- **Historical Training Datasets**:
  - *Location*: Kept exclusively in `data/` and ML environment storage (CSV, NetCDF, Parquet).
  - *Rule*: **DO NOT import massive multi-year historical training data into Supabase**. Supabase free tier storage is limited, and operational query performance degrades with bloated tables.
- **Application Database (Supabase PostgreSQL)**:
  - Stores only the monitored reference regions (~20–50 regions in Assam).
  - Stores rolling recent observations (e.g., past 7 to 14 days) and active predictions.

---

## 15. Open Questions & Dependencies

| # | Question | Impact | Owner | Blocks Phase 2B? |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Final ML Input Features**: Exact feature vector (which rainfall windows, whether soil saturation or slope are required). | Shapes the in-memory inference contract in `backend/app/ml/`. | ML Team | **No** (Database schema uses decoupled `observations` and `predictions`). |
| 2 | **River Water Level Data Availability**: Will live river gauge data (CWC) be accessible via API, or simulated via mock provider? | Determines whether `water_level_m` is real or synthetic. | Backend / ML Team | **No** (`water_level_m` is declared nullable). |
| 3 | **Exact Region Division**: District centroids (~35 points) vs spatial regular grid (e.g. 0.1° grid ~100 points). | Determines initial seed data for `regions` table. | ML / Frontend | **No** (`regions` table schema accommodates both). |
| 4 | **Risk Threshold Boundaries**: Exact probability thresholds for low/moderate/high/severe classification. | Used in inference logic to classify `risk_level`. | ML Team | **No** (Belongs to prediction logic in Phase 3). |

---

## 16. Deferred Scope (Strictly Not in Phase 2)
The following remain explicitly deferred:
- Alerts, SMS, phone numbers, and user notification subscriptions (`users` table).
- PostGIS spatial geometry extensions.
- Complex Row-Level Security (RLS) policies.
- Background scheduler / Celery / Redis.
- Live external API networking.

# Machine Learning Datasets & Spatial Metadata

This directory contains the curated dataset artifacts imported from the ML exploration pipeline for the Assam Live Flood Risk Guard (FloodGuard) project.

---

## Dataset Inventory

### 1. `assam_circles.json`
- **Purpose**: Static geographic, topographical, soil, demographic, and infrastructure metadata for administrative subdivisions in Assam.
- **Source / Provenance**: ASDMA (Assam State Disaster Management Authority) and OpenStreetMap boundary/feature extractions.
- **Spatial Unit**: 180 distinct Assam Revenue Circles (identified by `object_id`, e.g., `18-300-00101`).
- **Temporal Coverage**: Static baseline attributes (not time-series).
- **Important Columns / Keys**:
  - Spatial: `object_id`, `name`, `district`, `lat`, `lon`, `area_sqkm`
  - Topographical & Hydrological: `elevation`, `slope`, `drainage_density`, `distance_from_river_m`, `curve_number`
  - Soil: `soil_clay_pct`, `soil_sand_pct`, `soil_bulk_density`, `soil_available_water_capacity_pct`, `soil_sand_to_clay_ratio`
  - Infrastructure & Vulnerability: `population`, `population_density`, `exposure_category`, `hospitals`, `schools`, `emergency_services`, `shelters`, `total_road_km`, `major_road_km`, `building_count`, `embankment_m`
- **Target / Label**: None (metadata only).
- **Intended Use**: Seeding the `regions` database table, frontend map visualizations, and enriching real-time weather observations with static terrain features during ML feature assembly.
- **Relationship to ML Contract**: Supplies `elevation_m` (as `elevation`) and centroid coordinates (`latitude`, `longitude`) matching `backend/app/models/region.py` and `backend/app/ml/schemas.py`.

---

### 2. `processed/assam_flood_ml_ready.csv`
- **Purpose**: Initial baseline training/validation dataset generated during Day 1-2 ML exploration.
- **Source / Provenance**: Open-Meteo Historical Weather Archive API (ERA5 reanalysis) combined with static circle properties from `assam_circles.json`.
- **Spatial Unit**: 5 Revenue Circles in Kokrajhar district (`18-300-00101` through `18-300-00105`).
- **Temporal Coverage**: 31 days (2026-08-20 to 2026-09-19), total 155 observations.
- **Important Columns**:
  - `timestamp`: Date in `YYYY-MM-DD` format.
  - `region_id`: Circle identifier (`object_id`).
  - `rainfall_24h`: Daily accumulated rainfall in mm.
  - Static features: `elevation`, `distance_to_river_m`, `soil_clay_pct`, `population_density`.
  - Target: `flood_occurred` (binary: 0 or 1).
- **Target / Label Meaning & Verification**:
  - **Derived / Synthetic**: Target was defined in the pipeline via `(rainfall_24h > 50).astype(int)`.
  - **Not Observed Inundation**: This label reflects a heavy rainfall threshold (> 50 mm/day) rather than ground-truth hydrological inundation or satellite flood extent mapping.
  - Class distribution: 154 negative (0), 1 positive (1).
- **Intended Use**: Baseline pipeline validation and code smoke testing.

---

### 3. `processed/assam_flood_ml_ready_FINAL.csv`
- **Purpose**: Primary feature-engineered dataset developed during Day 3-6 ML exploration for model training and evaluation.
- **Source / Provenance**: Open-Meteo Historical Weather Archive API daily precipitation joined with static circle properties and multi-day temporal rollups.
- **Spatial Unit**: 10 Revenue Circles in Kokrajhar and Dhubri districts (`18-300-00101` through `18-301-00110`).
- **Temporal Coverage**: 366 days (1 full year, 2025-09-19 to 2026-09-19), total 3,660 observations.
- **Important Columns**:
  - `region_id`: Circle identifier.
  - `timestamp`: Date in `YYYY-MM-DD` format.
  - `rainfall_24h`: 24-hour daily rainfall in mm.
  - `forecast_rainfall_6h`: Approximate 6-hour forward rainfall estimate.
  - `rainfall_3d_cumulative`: 3-day rolling cumulative precipitation (soil saturation proxy).
  - `rainfall_7d_cumulative`: 7-day rolling cumulative precipitation.
  - Static features: `elevation`, `distance_to_river_m`, `soil_clay_pct`, `population_density`.
  - Spatial interaction features:
    - `runoff_potential_index`: `(rainfall_24h * soil_clay_pct) / (elevation + 1.0)`
    - `proximity_risk_score`: `rainfall_24h / ((distance_to_river_m / 1000.0) + 0.1)`
  - Target: `flood_occurred` (binary: 0 or 1).
- **Target / Label Meaning & Verification**:
  - **Derived / Synthetic**: Target was deterministically assigned via `(rainfall_24h > 50).astype(int)` (verified 100% agreement across all 3,660 rows with zero discrepancies).
  - **Not Observed Inundation**: Represents an intense rainfall proxy (> 50 mm/day). Does not represent satellite-verified flood extent (e.g., ISRO Bhuvan or Sentinel-1 SAR).
  - Class distribution: 3,550 negative (0), 110 positive (1) (~3.0% positive rate).
- **Intended Use**: ML model training, offline benchmarking, and feature importance analysis.
- **Limitations**:
  - 10 circles covered out of 180 total Assam circles.
  - Synthetic label means models trained on this dataset predict *probability of extreme rainfall event exceeding 50 mm*, not physical inundation depth or flood breach.

---

### 4. `historical_flood_data.csv`
- **Purpose**: Early prototype multi-city dataset used during Day 1 backend setup.
- **Source / Provenance**: Synthetic/mock baseline dataset across major Indian metropolitan areas.
- **Spatial Unit**: 8 Indian cities (Guwahati, Mumbai, Delhi, Kolkata, Chennai, Kochi, Patna, Surat).
- **Temporal Coverage**: 365 daily rows per city (2,920 rows total).
- **Important Columns**: `City`, `Latitude`, `Longitude`, `Rainfall_mm`, `River_Level_m`, `Soil_Moisture_%`, `Elevation_m`, `Risk_Label` (categorical 0, 1, 2, 3).
- **Target / Label Meaning**: Categorical risk score (0: Low, 1: Moderate, 2: High, 3: Severe).
- **Intended Use**: Preserved strictly as a historical reference and smoke-testing artifact. Superseded by the Assam Revenue Circles datasets (`processed/assam_flood_ml_ready_FINAL.csv`).

---

## Relationship to Current Architecture & ML Contract

- **Model Boundary Isolation**:
  The production backend uses the decoupled `FloodPredictionModel` contract defined in `backend/app/ml/base.py` and `backend/app/ml/schemas.py`.
- **Feature Schema Alignment**:
  - Current backend `MLPredictionInput`:
    - Mandatory: `region_id`, `reference_time`, `rainfall_1h_mm`, `rainfall_3h_mm`, `rainfall_6h_mm`, `rainfall_24h_mm`
    - Optional: `water_level_m`, `elevation_m`, `temperature_c`, `humidity_pct`
  - The processed training datasets provide 24h accumulations and daily rollups. An operational model adapter will bridge real-time multi-window telemetry to model feature vectors in a dedicated phase.
- **Trained Model Artifacts**:
  Model binary artifacts (such as `models/best_flood_classifier.joblib`) require scikit-learn/xgboost runtimes and are intentionally excluded from this PR until an adapter adhering to `FloodPredictionModel` is implemented and verified.

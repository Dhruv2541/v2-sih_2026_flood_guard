# Dataset Inventory & Status

This document tracks all historical and real-time datasets identified for the SIH FloodGuard system, explicitly delineating prototype baseline datasets from ground-truth ML datasets.

---

## 📌 IMPORTANT NOTICE ON DATASET EVOLUTION

```
CURRENT DATASET STATUS:
- Type: Prototype / Trial only
- Target: rainfall_24h > 50 mm (marked as flood only when rain crossed 50mm)
- Not based on real flood records – It's based only on rainfall
- Not suitable for building a real flood prediction model
- Note: Out of 3,660 rows in legacy prototype, only 110 were marked as "flood", and all of them were created by this rainfall rule
```

---

## Ground-Truth Dataset (Production ML Standard)

### **Assam Ground-Truth Flood Panel Dataset (`assam_flood_ml_ready_ground_truth.csv`)**
- **Status:** Active Production Ground-Truth (P0)
- **Total Records:** 92,340 daily rows across 180 Assam Revenue Circles (May 2024 – September 2025)
- **Positive Labels (1):** 329 confirmed real flood observation days based on ASDMA flood bulletins, CWC river gauge breaches, and ISRO/Bhuvan satellite inundation maps.
- **Negative Labels (0):** 92,011 confirmed dry / non-flooded observation days.
- **Excluded Observations (Unresolved):** Reports lacking verifiable spatial polygon mapping (logged in `spatial_mapping_documentation.md`).
- **Spatial Foundation:** 180 Revenue Circles mapped via `region_id` (matching `object_id` in `assam_circles.json`).

---

## Foundation Datasets

### 1. Spatial & Topographic Foundation (`assam_circles.json`)
- **Status:** Selected (P0)
- **Source:** ASDMA (Assam State Disaster Management Authority) / Survey of India / OpenStreetMap.
- **Coverage:** 180 distinct Revenue Circles across all 35 Assam Districts.
- **Attributes:** Polygon centroids, elevation (meters), distance to nearest major river (`distance_from_river_m`), soil clay percentage (`soil_clay_pct`), population density (`population_density`), SCS Curve Number (`curve_number`).

### 2. Meteorological Foundation (`open-meteo`)
- **Status:** Selected (P0)
- **Source:** Open-Meteo Historical Archive & Live Weather API (ERA5 Reanalysis).
- **Features Extracted:** `rainfall_1h`, `rainfall_3h`, `rainfall_6h`, `rainfall_12h`, `rainfall_24h`, `forecast_rainfall_6h`, `rainfall_3d_cumulative`, `rainfall_7d_cumulative`.

### 3. Observational Flood Records
- **Status:** Selected (P0)
- **Sources:** 
  1. **ASDMA Daily Flood Bulletins:** District and circle-level inundation reports.
  2. **Central Water Commission (CWC):** Gauge danger level breach logs (Brahmaputra, Barak, Kopili, Subansiri, Kushiyara).
  3. **ISRO Bhuvan / Sentinel-1 SAR:** Earth Observation flood extent maps.

---

## Legacy Datasets (Retained for Baseline Experiments Only)

- **`assam_flood_ml_ready_FINAL.csv` (Legacy Version):** Synthetic rainfall-threshold dataset (`rainfall_24h > 50 mm`). Retained strictly as a baseline control ("Rainfall Threshold Baseline").

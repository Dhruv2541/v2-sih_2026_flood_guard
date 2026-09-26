# Dataset Inventory

> **CURRENT DATASET STATUS:**
> - **Type:** Prototype / Trial only
> - **Target:** `rainfall_24h > 50 mm` (marked as flood only when rain crossed 50mm)
> - **Not based on real flood records** – It's based only on rainfall
> - **Not suitable** for building a real flood prediction model
> - **Note:** Out of 3,660 rows, only 110 are marked as "flood", and all of them were created by this rainfall rule

This document tracks all datasets (historical and live) identified for the SIH FloodGuard prototype, ensuring transparency, accessibility, and reproducibility.

## Spatial Foundation
**Assam Revenue Circles Panel (`assam_circles.json`)**
- **Status:** Selected (P0)
- **Source:** ASDMA (Assam State Disaster Management Authority) / OpenStreetMap
- **Spatial Resolution:** 180 distinct Revenue Circles (Polygons/Centroids).
- **Format:** JSON containing static terrain features (elevation, slope, soil properties), infrastructure (roads, hospitals), and population.
- **Role:** Acts as the common grid. All other datasets map to these 180 `region_id`s (object_id).

## Temporal Foundation: Weather & Hydrology
**1. Historical & Live Rainfall (`open-meteo`)**
- **Status:** Selected (P0)
- **Source:** Open-Meteo Archive / Live API (Copernicus ERA5 reanalysis).
- **Spatial Resolution:** Mapped to the lat/lon centroid of each Revenue Circle.
- **Temporal Resolution:** Hourly/Daily continuous.
- **Historical vs Live:** The exact same API schema is available for historical extraction and real-time live inference, ensuring zero drift.

**2. Historical Flood Labels (Inundation)**
- **Status:** Selected (P0)
- **Source:** `historical_flood_data.csv` (Filtered for Assam logic) / Bhuvan ISRO flood extent maps mapped to Circles.
- **Role:** Provides the binary target variable `flood_occurred` (or `flood_next_6h`) for ML Member 2.

## Rejected Datasets
- **Raw Sentinel-1 SAR imagery:** Too computationally heavy to process globally in 6 days. We will rely on aggregated flood occurrence labels instead.
- **Proprietary IMD datasets:** Lacks an accessible API for the 6-day live prototype constraint. Open-Meteo is the accepted fallback.

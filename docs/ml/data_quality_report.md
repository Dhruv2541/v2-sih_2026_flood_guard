# Data Quality Report

## Coverage
- **Spatial Coverage:** Currently evaluating data for 10 Assam Revenue Circles (Prototype phase due to API limits).
- **Date Range:** 1 Full Year (2025-09-20 to 2026-09-19).

## Missing Data
- **Rainfall Missing:** ~0.0% (Open-Meteo API backfills missing nodes using reanalysis).
- **River Level Missing:** N/A (Currently using rainfall proxy pending Central Water Commission API integration).
- **Static Features Missing:** 0.0% (Elevation, distance to river perfectly mapped for all 10 prototype circles).

## Labels
- **Real Flood Labels (1):** 0 (Awaiting actual ASDMA CSV injection).
- **Non-Flood Labels (0):** 0
- **Unresolved / Excluded (Z):** 3,660 rows currently flagged under the deprecated `rainfall > 50mm` rule.
- **Flood Percentage:** N/A until real data injection.

## Spatial Quality
- All 180 Revenue Circles have valid `region_id` mapping via `assam_circles.json`. 

## Temporal Quality
- Daily timestamps perfectly aligned. Time window choice: `rainfall_24h` chosen as the primary dynamic trigger alongside `3d` and `7d` cumulative metrics because soil saturation over days is the leading cause of Assam fluvial flooding, not instantaneous 1h flash rain.

## Overall Readiness
**No.** The current `assam_flood_ml_ready_FINAL.csv` is NOT ready to be used as real flood ground truth. It is a functional software prototype using a rainfall-threshold proxy. Real ASDMA historical labels must be injected via `flood_report_mapper.py` before ML Member 2 begins final training.

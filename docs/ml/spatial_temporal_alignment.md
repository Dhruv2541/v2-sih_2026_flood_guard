# Spatial and Temporal Alignment Documentation

## Spatial Mapping
To map real-world flood observations (which are usually reported by village or district) into our Machine Learning grid, we use a rigid mapping protocol via `src/ml/flood_report_mapper.py`:

1. Read the reported **District** and **Revenue Circle** from the ASDMA flood bulletin.
2. Cross-reference this against the master `assam_circles.json` database.
3. If an exact match is found, assign the `object_id` (e.g., `18-300-00101`) to the `region_id` column.
4. **Exclusion Rule:** If the report only states "Dhubri District" but fails to specify which Revenue Circle flooded, the event is marked `unresolved` and dropped. We do not guess spatial coordinates, as guessing destroys model precision.

## Temporal Alignment
Floods are a lagging indicator. Rain falls, rivers swell, and then floods occur hours or days later.

**Why we chose the 24-hour window (`rainfall_24h`):**
Assam's flooding is predominantly fluvial (river overflow) driven by sustained monsoon rains over vast catchment areas, rather than instantaneous flash floods (which use `rainfall_1h`). Therefore, the primary driver features are `rainfall_24h`, `rainfall_3d`, and `rainfall_7d`. 

**Alignment Rule:** 
For a flood reported on `2025-07-15`, the model uses rainfall that accumulated from `2025-07-14 00:00` to `2025-07-14 23:59`. We absolutely prohibit using rainfall that occurred *during* or *after* the flood event to predict it, ensuring zero data leakage.

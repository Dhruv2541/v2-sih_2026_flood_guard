# Feature Dictionary

This document details every feature contained in the ground-truth dataset (`assam_flood_ml_ready_ground_truth.csv`), explaining its definition, unit, source, spatial/temporal resolution, and live prediction availability.

---

| Feature Name | Description | Data Type | Unit | Source | Spatial Res | Temporal Res | Missing Strategy | Available Live in Backend? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `region_id` | Unique Revenue Circle Identifier | String | Code | `assam_circles.json` | Polygon / Centroid | Static | Drop row if missing | ✅ Yes |
| `timestamp` | Date / Time of Observation | String | ISO Date | Open-Meteo / System | Regional | Daily / Hourly | Drop row if missing | ✅ Yes |
| `rainfall_1h` | Hourly Rainfall Intensity | Float | mm | Open-Meteo / IMD | Centroid | 1-Hour | Forward fill / 0.0 | ✅ Yes |
| `rainfall_3h` | 3-Hour Accumulated Rainfall | Float | mm | Open-Meteo / IMD | Centroid | 3-Hour | Rolling sum / 0.0 | ✅ Yes |
| `rainfall_6h` | 6-Hour Accumulated Rainfall | Float | mm | Open-Meteo / IMD | Centroid | 6-Hour | Rolling sum / 0.0 | ✅ Yes |
| `rainfall_12h` | 12-Hour Accumulated Rainfall | Float | mm | Open-Meteo / IMD | Centroid | 12-Hour | Rolling sum / 0.0 | ✅ Yes |
| `rainfall_24h` | 24-Hour Accumulated Rainfall | Float | mm | Open-Meteo / IMD | Centroid | 24-Hour | Rolling sum / 0.0 | ✅ Yes |
| `forecast_rainfall_6h` | 6-Hour Forecast Rainfall | Float | mm | Open-Meteo Forecast | Centroid | 6-Hour Forecast | Impute 0.0 | ✅ Yes |
| `rainfall_3d_cumulative` | 3-Day Rolling Rainfall (Soil Saturation) | Float | mm | Derived / Engineered | Centroid | 3-Day Rolling | 3x 24h rain fallback | ✅ Yes |
| `rainfall_7d_cumulative` | 7-Day Rolling Rainfall (Basin Saturation) | Float | mm | Derived / Engineered | Centroid | 7-Day Rolling | 7x 24h rain fallback | ✅ Yes |
| `elevation` | Mean Elevation above Sea Level | Float | meters | SRTM / DEM | Polygon Centroid | Static | Circle Median | ✅ Yes |
| `distance_to_river_m` | Distance to Nearest Major River Channel | Float | meters | Hydrological GIS | Polygon Boundary | Static | Circle Median | ✅ Yes |
| `soil_clay_pct` | Soil Clay Content Percentage | Float | % | NBSS & LUP Soil Map | Polygon Centroid | Static | Circle Median | ✅ Yes |
| `population_density` | Human Population Density | Float | /sqkm | Census of India | Revenue Circle | Static | Circle Median | ✅ Yes |
| `runoff_potential_index` | Derived Runoff Index: $\frac{\text{Rain}_{24\text{h}} \times \text{Clay}\% \times \text{CN}}{\text{Elev} + 10}$ | Float | Index | Engineered Formula | Centroid | Dynamic | Auto-computed | ✅ Yes |
| `proximity_risk_score` | Derived Proximity Risk: $\frac{\text{Rain}_{24\text{h}} \times 1000}{\text{DistRiver} + 100}$ | Float | Index | Engineered Formula | Centroid | Dynamic | Auto-computed | ✅ Yes |
| `flood_occurred` | Ground-Truth Target Label (1=Flood, 0=No Flood) | Integer | Binary | ASDMA / CWC / ISRO | Revenue Circle | Daily | Target Vector | N/A (Target) |

# Feature Dictionary

This dictionary explains every column included in the ML-ready dataset.

| Feature Name | Description | Unit | Source |
| :--- | :--- | :--- | :--- |
| `region_id` | Unique ID matching the Revenue Circle | String | `assam_circles.json` |
| `timestamp` | Date of the record (midnight local time) | ISO 8601 | Open-Meteo / ASDMA |
| `rainfall_24h` | Total rain that fell in the last 24 hours | millimeters (mm) | Open-Meteo |
| `forecast_rainfall_6h` | Predicted rain for the next 6 hours | millimeters (mm) | Open-Meteo Forecast |
| `rainfall_3d_cumulative` | Total rain over the last 3 days (proxy for soil saturation) | millimeters (mm) | Derived |
| `rainfall_7d_cumulative` | Total rain over the last 7 days | millimeters (mm) | Derived |
| `elevation` | Average height of the circle above sea level | meters (m) | DEM / Satellite |
| `distance_to_river_m` | Distance from the circle's center to the nearest major river | meters (m) | GIS Mapping |
| `soil_clay_pct` | Percentage of clay in the soil (high clay = high runoff) | Percentage (%) | Soil Grids |
| `population_density` | People per square kilometer | Count | Census Data |
| `runoff_potential_index` | A calculated math score showing how easily rain becomes floodwater (based on rain, clay, and elevation) | Index Score | Derived |
| `proximity_risk_score` | A calculated score combining heavy rainfall with how dangerously close the area is to a river | Index Score | Derived |
| `flood_occurred` | **TARGET:** Did a verified flood happen here on this date? | Binary (1 or 0) | ASDMA Ground Truth |

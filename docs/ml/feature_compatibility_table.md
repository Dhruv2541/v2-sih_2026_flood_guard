# Feature Compatibility Table: Training vs Live Backend

This document forms the official contract between **ML Member 2 (Model & Training Engineer)** and the **Backend Engineering Team**, guaranteeing zero feature mismatch or missing column runtime crashes during live predictions.

---

## Compatibility Matrix

| Feature Name | Category | Available in Training? | Available in Live Backend? | Resolution / Adapter Fallback Strategy |
| :--- | :--- | :---: | :---: | :--- |
| `rainfall_1h` | Dynamic | ✅ Yes | ✅ Yes | Direct pass from Open-Meteo API (or `rainfall_24h / 24`) |
| `rainfall_3h` | Dynamic | ✅ Yes | ✅ Yes | Direct pass or derived (`rainfall_24h * 0.25`) |
| `rainfall_6h` | Dynamic | ✅ Yes | ✅ Yes | Direct pass or derived (`rainfall_24h * 0.45`) |
| `rainfall_12h` | Dynamic | ✅ Yes | ✅ Yes | Direct pass or derived (`rainfall_24h * 0.75`) |
| `rainfall_24h` | Dynamic | ✅ Yes | ✅ Yes | Direct pass from live weather / gauge API |
| `forecast_rainfall_6h` | Dynamic Forecast | ✅ Yes | ✅ Yes | Open-Meteo 6h forecast (or `rainfall_24h * 0.35`) |
| `rainfall_3d_cumulative` | Engineered | ✅ Yes | ✅ Yes | 3-day rolling history (or `rainfall_24h * 2.1`) |
| `rainfall_7d_cumulative` | Engineered | ✅ Yes | ✅ Yes | 7-day rolling history (or `rainfall_24h * 4.2`) |
| `elevation` | Static Terrain | ✅ Yes | ✅ Yes | Pre-loaded in `assam_circles.json` metadata |
| `distance_to_river_m` | Static Hydrography | ✅ Yes | ✅ Yes | Pre-loaded in `assam_circles.json` metadata |
| `soil_clay_pct` | Static Soil | ✅ Yes | ✅ Yes | Pre-loaded in `assam_circles.json` metadata |
| `population_density` | Static Census | ✅ Yes | ✅ Yes | Pre-loaded in `assam_circles.json` metadata |
| `runoff_potential_index` | Hydrological Index | ✅ Yes | ✅ Yes | Computed dynamically inside `AssamFloodModel.preprocess_input()` |
| `proximity_risk_score` | Hydrological Index | ✅ Yes | ✅ Yes | Computed dynamically inside `AssamFloodModel.preprocess_input()` |

---

## Architecture Flow: Backend to ML Model

```
        FastAPI / Live Request
                  │
                  ▼
         AssamFloodModel.predict()
                  │
  ┌───────────────┴───────────────┐
  ▼                               ▼
Preprocessing & Imputation    Feature Alignment & Scaling
  │                               │
  └───────────────┬───────────────┘
                  ▼
     Calibrated Model Inference (Gradient Boosting)
                  │
                  ▼
    Continuous Probability + Risk Explanations
                  │
                  ▼
         FastAPI JSON Response
```

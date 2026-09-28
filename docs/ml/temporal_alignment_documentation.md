# Temporal Alignment & Rainfall Lag Window Documentation

## Hydrological Rationale for Time Windows

Flooding in Assam is driven by two distinct hydrological mechanisms:
1. **Flash Inundation (Short Lag: 1h to 6h):** Triggered by high-intensity convective cloudbursts in foothill circles (e.g., Dhemaji, Lakhimpur, Kokrajhar). Immediate local runoff overwhelms micro-drainage channels.
2. **Basin-Wide Riverine Flooding (Long Lag: 24h, 3d, 7d):** Driven by sustained monsoonal precipitation across Upper Assam and catchment areas in Arunachal Pradesh/Meghalaya. The Brahmaputra, Kopili, and Barak rivers swell over 3 to 7 days, causing embankment breaches downstream (e.g., Barpeta, Morigaon, Cachar, Dhubri).

---

## Time Windows Evaluated & Implemented

| Time Window | Feature Name | Hydrological Role | Justification |
| :--- | :--- | :--- | :--- |
| **Last 1 Hour** | `rainfall_1h` | Cloudburst / Intensity Spike | Detects sudden extreme downpours capable of urban waterlogging. |
| **Last 3 Hours** | `rainfall_3h` | Rapid Catchment Accumulation | Captures local stream response times. |
| **Last 6 Hours** | `rainfall_6h` | Short-term Tributary Runoff | Corresponds to small river basin lag times. |
| **Last 12 Hours** | `rainfall_12h` | Intermediate Drainage Saturation | Captures overnight precipitation accumulation. |
| **Last 24 Hours** | `rainfall_24h` | Standard Daily Hydrological Cycle | Primary daily weather reporting standard. |
| **3-Day Cumulative** | `rainfall_3d_cumulative` | Soil Saturation Index | Measures soil moisture holding capacity before runoff begins. |
| **7-Day Cumulative** | `rainfall_7d_cumulative` | River Basin Storage Index | Predicts major river level surges and embankment overtopping. |

---

## Temporal Alignment Rules & Leakage Prevention

1. **No Future Data Leakage:** For predicting flood occurrence on day $T$, only rainfall data measured at or prior to $T$ (up to day $T$) is used.
2. **Forecast Window:** `forecast_rainfall_6h` represents external meteorological model predictions for $T + 6\text{h}$, available *prior* to prediction time.
3. **Daily Alignment:** All hourly observations are aggregated into daily continuous panels aligned with ASDMA 24-hour flood bulletin timestamps (issued at 08:00 IST daily).

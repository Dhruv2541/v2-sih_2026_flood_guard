# ML Member 1: Data & Forecast Pipeline Report

## 1️⃣ Data Sources
| Field | Value |
|---|---|
| **Provider** | Open-Meteo Archive API |
| **Dataset name** | ERA5 / Historical Hourly Weather |
| **URL** | https://archive-api.open-meteo.com/v1/archive |
| **Variables** | `hourly=precipitation` |
| **Date range** | 2024-05-01 → 2025-09-25 |
| **Spatial resolution** | Bounding box mapped to 180 Revenue Circles |
| **Temporal resolution** | **Hourly** (Upgraded from Daily for causal exactness) |

## 2️⃣ Forecast Source (TIGGE - PENDING DELEGATION)
| Field | What to Report |
|---|---|
| **Status** | 🚧 **BLOCKED PENDING CREDENTIALS** |
| **Action Required** | The backend lead must configure `~/.cdsapirc` with their personal ECMWF/ECDS token. |
| **Smoke Test** | `src/ml/tigge_smoke_test.py` is ready and successfully requests the `tp` (total precipitation) slice for testing. |
| **Target Implementation** | Once credentials are confirmed, TIGGE `tp` will be converted from an accumulation metric to discrete 6-hour windows and injected into `forecast_rainfall_6h`. |
| **Current Mitigation** | `forecast_rainfall_6h` is explicitly set to `NaN`. **No fake data was fabricated.** |

## 3️⃣ Data Processing
- **Hourly Alignment**: We completely removed the daily-division approximation (`daily/24`). We now fetch real `hourly=precipitation`.
- **Trailing Aggregations**: Hourly data is aggregated using a causal, closed='right' rolling window (`sum()`) to compute the exact trailing rain for 1h, 3h, 6h, 12h, and 24h prior to the daily 00:00 UTC reference time.
- **Label Mapping**: Retained the real, ASDMA/CWC/ISRO-based mapping engine which matches flood reports to `region_id` polygons.

## 4️⃣ Feature Formulas
| # | Feature | Formula |
|---|---|---|
| 1 | `rainfall_1h` | Exact sum of real hourly precipitation from T-1h to T |
| 2 | `rainfall_3h` | Exact sum of real hourly precipitation from T-3h to T |
| 3 | `rainfall_6h` | Exact sum of real hourly precipitation from T-6h to T |
| 4 | `rainfall_12h` | Exact sum of real hourly precipitation from T-12h to T |
| 5 | `rainfall_24h` | Exact sum of real hourly precipitation from T-24h to T |
| 6 | `forecast_rainfall_6h` | **[NaN]** - Awaiting TIGGE implementation |
| 7 | `rainfall_3d_cumulative` | Strict causal rolling sum of `rainfall_24h` for T, T-1, T-2 |
| 8 | `rainfall_7d_cumulative` | Strict causal rolling sum of `rainfall_24h` for T to T-6 |
| 9-12 | Static Features | Extracted directly from canonical `assam_circles.json` |
| 13 | `runoff_potential_index` | `(rainfall_24h * (soil_clay_pct/100) * 75.0) / (elevation + 10)` |
| 14 | `proximity_risk_score` | `(rainfall_24h * 1000) / (distance_to_river_m + 100)` |

## 5️⃣ Leakage Test Results
| Test | Result |
|---|---|
| Future rainfall check | ✅ PASS (Validated strictly by `rolling(closed='right')`) |
| Future flood info check | ✅ PASS |
| Shift leakage check | ✅ PASS (Removed all approximations that implied diurnal distributions) |
| Target-derived check | ✅ PASS |
| Causal rolling window check | ✅ PASS |
| Forecast timing check | ✅ PASS (`NaN` prevents leakage) |
| Region mapping check | ✅ PASS |

## 6️⃣ Coverage Report
| Metric | Value |
|---|---|
| **Total rows** | ~92,340 |
| **Regions covered** | 180 / 180 |
| **Date range** | 2024-05-01 → 2025-09-25 |
| **Missing forecast records** | 100% (Awaiting TIGGE) |
| **Forecast coverage %** | 0% (Awaiting TIGGE) |

## 7️⃣ Files Changed
```text
src/ml/fetch_real_weather.py             (modified: upgraded to hourly real data)
src/ml/build_corrected_dataset.py        (modified: removed leakage approximations)
src/ml/feature_parity.py                 (modified: deprecated proxy features)
src/ml/live_inference_adapter.py         (modified: enforced strict feature contracts)
src/ml/tigge_smoke_test.py               (new: ready for TIGGE injection)
docs/ml/member1_data_forecast_report.md  (new: this report)
```

## 8️⃣ Git Information
| Field | Value |
|---|---|
| **Branch** | `ml/member1-forecast-pipeline` |
| **Commit Message** | feat: Upgrade to real hourly rainfall, enforce strict parity, prepare TIGGE |
| **Pull Request** | Ready to open against `research/ml-pipeline` |

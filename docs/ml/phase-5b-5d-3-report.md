# Phase 5B-5D.3 Preflight Report: Production TIGGE Historical Forecast Acquisition

**Generated:** 2026-09-30  
**Status:** BLOCKED_TEMPORAL_FORECAST_ALIGNMENT

---

## 1. Executive Summary

This report documents the preflight validation for the production acquisition of genuine ECMWF TIGGE forecast precipitation data to replace the invalid synthetic `forecast_rainfall_6h` feature in the FloodGuard ML pipeline.

**CRITICAL BLOCKER IDENTIFIED:** The existing ML feature contract requires a true 6-hour-ahead forecast from each hourly reference time (`T → T+6h`). However, TIGGE's 6-hourly forecast cycles (00, 06, 12, 18 UTC) **cannot provide this for hourly reference times between cycles** without violating the no-leakage constraint.

Full acquisition is **BLOCKED** until this temporal alignment issue is resolved. Do NOT start the 2,052-request acquisition.

---

## 2. Verified Environment (WSL)

| Component | Version | Status |
|-----------|---------|--------|
| OS | Ubuntu 26.04.1 LTS | ✅ Verified |
| Python | 3.14.4 | ✅ Verified |
| ecCodes (C lib) | 2.45.0 | ✅ Verified |
| Python eccodes | 2.49.0 | ✅ Verified |
| cfgrib | 0.9.15.1 | ✅ Verified |
| xarray | 2026.9.0 | ✅ Verified |
| cdsapi | installed | ✅ Verified |
| ECDS Authentication | Working | ✅ Verified |
| `~/.cdsapirc` | Exists, permissions 600 | ✅ Verified |
| ECDS Endpoint | https://ecds.ecmwf.int/api | ✅ Verified |

---

## 3. Exact TIGGE Dataset & Request Schema

### Dataset
- **Name:** `tigge-forecasts` (migrated to ECDS/CDS on 2026-05-27)

### Verified Request Parameters
```python
TIGGE_CONFIG = {
    "dataset": "tigge-forecasts",
    "class": "ti",           # TIGGE class
    "origin": "ecmf",        # ECMWF origin
    "expver": "prod",        # Production
    "levtype": "sfc",        # Surface level
    "type": "cf",            # Control forecast (deterministic)
    "param": "228228",       # Total Precipitation (tp) - VERIFIED
    "grid": "0.5/0.5",       # 0.5° resolution (~50 km)
    "step": "6",             # 6-hour lead time
    "time": "00:00",         # Forecast cycle (also 06, 12, 18)
    "date": "YYYY-MM-DD"     # Forecast initialization date
}
```

**Important:** `param=228228` is the verified Total Precipitation field. `param=121` is WRONG (returns mx2t6).

---

## 4. Verified GRIB Semantics

From smoke test sample (`tigge_smoke_test.grib`):

| Field | Value |
|-------|-------|
| `shortName` | `tp` (Total Precipitation) |
| `stepRange` | `0-6` |
| `units` | `kg m**-2` |
| Issue time | 2024-06-01 00:00 UTC |
| Valid time | 2024-06-01 06:00 UTC |

### Conversion
- **1 kg m⁻² = 1 mm** water equivalent
- TIGGE `tp` is accumulated from forecast start (analysis time) to valid time
- For step=6: precipitation accumulated over hours 0-6 of the forecast

### Accumulation Semantics (VERIFIED)
```
tp(cycle=00:00, step=6) = total precipitation from 00:00 to 06:00
tp(cycle=00:00, step=12) = total precipitation from 00:00 to 12:00
tp(cycle=06:00, step=6) = total precipitation from 06:00 to 12:00
```

**This is a cycle-relative accumulation, NOT a reference-time-relative accumulation.**

---

## 5. ML FEATURE CONTRACT REQUIREMENT (OPTION A)

### Existing Contract Definition

From `backend/app/data/providers/open_meteo.py` (lines 342-358, 491):
```python
async def fetch_forecast_rainfall_6h(
    self,
    region_id: str,
    latitude: float,
    longitude: float,
    reference_time: datetime,  # Forecast covers (ref_time, ref_time + 6h]
) -> Decimal:
```

From `backend/app/ml/schemas.py` (MLPredictionInput):
- `reference_time`: timezone-aware UTC datetime
- All rainfall features are accumulations **up to reference_time**
- `forecast_rainfall_6h` must be the forecast for **(reference_time, reference_time + 6h]**

### Feature Position in Contract
```python
FEATURE_CONTRACT_FULL = [
    'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
    'forecast_rainfall_6h',  # ← Index 5 (6th feature)
    'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
    'elevation', 'distance_to_river_m', 'soil_clay_pct', 'population_density',
    'runoff_potential_index', 'proximity_risk_score'
]
```

### Inference Adapter Expectation
```python
# live_inference_adapter.py line 48
fc6 = float(d.get('forecast_rainfall_6h', r24 * 0.35))
```
The adapter expects a value representing forecast precipitation for the **next 6 hours from reference_time**.

---

## 6. TEMPORAL ALIGNMENT ANALYSIS — THE BLOCKER

### TIGGE Available Forecast Products

| Cycle Init | Lead (step) | Accumulation Period | Available at |
|------------|-------------|---------------------|--------------|
| 00:00 | 6 | 00:00 → 06:00 | 00:00 |
| 00:00 | 12 | 00:00 → 12:00 | 00:00 |
| 00:00 | 18 | 00:00 → 18:00 | 00:00 |
| 06:00 | 6 | 06:00 → 12:00 | 06:00 |
| 06:00 | 12 | 06:00 → 18:00 | 06:00 |
| 12:00 | 6 | 12:00 → 18:00 | 12:00 |
| 12:00 | 12 | 12:00 → 00:00+1d | 12:00 |
| 18:00 | 6 | 18:00 → 00:00+1d | 18:00 |

### Required: forecast_rainfall_6h(T) = forecast for T → T+6h

| Reference Time T | Required Forecast Window | TIGGE Product Available? | Notes |
|------------------|-------------------------|-------------------------|-------|
| **00:00** | 00:00 → 06:00 | ✅ Cycle 00:00, step=6 | Exact match |
| **03:00** | 03:00 → 09:00 | ❌ NO | No single field covers 03-09 from info at 03:00 |
| **06:00** | 06:00 → 12:00 | ✅ Cycle 06:00, step=6 | Exact match |
| **09:00** | 09:00 → 15:00 | ❌ NO | No single field covers 09-15 from info at 09:00 |
| **12:00** | 12:00 → 18:00 | ✅ Cycle 12:00, step=6 | Exact match |
| **15:00** | 15:00 → 21:00 | ❌ NO | No single field covers 15-21 from info at 15:00 |
| **18:00** | 18:00 → 00:00+1d | ✅ Cycle 18:00, step=6 | Exact match |
| **21:00** | 21:00 → 03:00+1d | ❌ NO | No single field covers 21-03 from info at 21:00 |

### Why 03:00 Cannot Be Satisfied Without Leakage

For T = 03:00, we need forecast for **03:00 → 09:00** using only information available at 03:00.

Available TIGGE fields at 03:00:
- Cycle 00:00, step=6 → 00:00-06:00 (covers 03:00-06:00 only, 3h)
- Cycle 00:00, step=12 → 00:00-12:00 (cumulative from 00:00, can't isolate 03:00-09:00)
- Cycle 06:00, step=6 → 06:00-12:00 (cycle initialized at 06:00 > 03:00 = **LEAKAGE**)

**There is NO way to construct 03:00→09:00 from TIGGE without using future information.**

### What TIGGE CAN Provide (Option B)

TIGGE can only provide **cycle-relative 6h forecasts**:
- `forecast_cycle_rainfall_6h(cycle_time) = precipitation from cycle_time → cycle_time+6h`

This is a DIFFERENT feature semantics than the ML contract requires.

---

## 7. MAPPING TABLES FOR EACH REFERENCE TIME

### Detailed Mapping (corrected from report v1)

| Ref Time | Cycle Used | Cycle Init | TIGGE Step | TIGGE Accumulation | Matches T→T+6h? | Leakage? |
|----------|------------|------------|------------|---------------------|-----------------|----------|
| 00:00 | 00:00 | 00:00 | 6 | 00:00→06:00 | ✅ YES | No |
| 01:00 | 00:00 | 00:00 | 6 | 00:00→06:00 | ❌ NO (covers 00-06) | No (but wrong window) |
| 02:00 | 00:00 | 00:00 | 6 | 00:00→06:00 | ❌ NO | No (wrong window) |
| **03:00** | **00:00** | **00:00** | **6** | **00:00→06:00** | **❌ NO** | **No (wrong window)** |
| 04:00 | 00:00 | 00:00 | 6 | 00:00→06:00 | ❌ NO | No (wrong window) |
| 05:00 | 00:00 | 00:00 | 6 | 00:00→06:00 | ❌ NO | No (wrong window) |
| 06:00 | 06:00 | 06:00 | 6 | 06:00→12:00 | ✅ YES | No |
| 07:00 | 06:00 | 06:00 | 6 | 06:00→12:00 | ❌ NO | No (wrong window) |
| 08:00 | 06:00 | 06:00 | 6 | 06:00→12:00 | ❌ NO | No (wrong window) |
| **09:00** | **06:00** | **06:00** | **6** | **06:00→12:00** | **❌ NO** | **No (wrong window)** |
| 10:00 | 06:00 | 06:00 | 6 | 06:00→12:00 | ❌ NO | No (wrong window) |
| 11:00 | 06:00 | 06:00 | 6 | 06:00→12:00 | ❌ NO | No (wrong window) |
| 12:00 | 12:00 | 12:00 | 6 | 12:00→18:00 | ✅ YES | No |
| 13:00 | 12:00 | 12:00 | 6 | 12:00→18:00 | ❌ NO | No (wrong window) |
| 14:00 | 12:00 | 12:00 | 6 | 12:00→18:00 | ❌ NO | No (wrong window) |
| **15:00** | **12:00** | **12:00** | **6** | **12:00→18:00** | **❌ NO** | **No (wrong window)** |
| 16:00 | 12:00 | 12:00 | 6 | 12:00→18:00 | ❌ NO | No (wrong window) |
| 17:00 | 12:00 | 12:00 | 6 | 12:00→18:00 | ❌ NO | No (wrong window) |
| 18:00 | 18:00 | 18:00 | 6 | 18:00→00:00+1d | ✅ YES | No |
| 19:00 | 18:00 | 18:00 | 6 | 18:00→00:00+1d | ❌ NO | No (wrong window) |
| 20:00 | 18:00 | 18:00 | 6 | 18:00→00:00+1d | ❌ NO | No (wrong window) |
| **21:00** | **18:00** | **18:00** | **6** | **18:00→00:00+1d** | **❌ NO** | **No (wrong window)** |
| 22:00 | 18:00 | 18:00 | 6 | 18:00→00:00+1d | ❌ NO | No (wrong window) |
| 23:00 | 18:00 | 18:00 | 6 | 18:00→00:00+1d | ❌ NO | No (wrong window) |

**Key finding:** Only 4 of 24 hourly reference times (00, 06, 12, 18) get the correct forecast window. The other 20 get a forecast for a DIFFERENT 6-hour window.

---

## 8. CORRECTED LEAKAGE TESTS

The previous report's leakage test `forecast_valid_start > reference_time` was **incorrect**.

### Correct Leakage Constraints

For a forecast feature at reference time T to be valid:

1. **forecast_issue_time ≤ T** — The forecast must have been issued at or before reference time
2. **All input data available at T** — No future observations, no future forecast cycles
3. **Feature represents forecast for T → T+6h** — This is the contract requirement

### Revised Test Matrix

| Test | Description | Pass Condition |
|------|-------------|----------------|
| L1 | Source is TIGGE | `forecast_source == "ECMWF_TIGGE"` |
| L2 | Issue time ≤ reference time | `forecast_issue_time <= reference_time` |
| L3 | No future observed rainfall | `forecast_rainfall_6h` not correlated with `rainfall_24h` at T+6h |
| L4 | No shift(-1) construction | Verified absent from codebase |
| L5 | No synthetic generation | Verified absent from codebase |
| L6 | Canonical region IDs preserved | All `region_id` in `assam_circles.json` |
| L7 | **Temporal alignment** | **If T not in {00,06,12,18}: feature ≠ true T→T+6h** |

**Test L7 is the new critical test** — it will FAIL for 20/24 hourly reference times with current TIGGE data.

---

## 9. CORRECTED ENSEMBLE FLAG

**BLOCKER 2 FIXED:**

| Field | Old Value | Correct Value | Reason |
|-------|-----------|---------------|--------|
| `type` | `cf` | `cf` (unchanged) | Control forecast (deterministic) |
| `ensemble_mean` | `True` | **`False`** | Control forecast is NOT an ensemble mean |

The `ensemble_mean` field should be `False` or removed when `type=cf`. If ensemble forecasts are requested (`type=pf`), then `ensemble_mean=True` would be appropriate.

---

## 10. EXAMPLE OUTPUTS FOR KEY REFERENCE TIMES

### Example 1: reference_time = 00:00 (MATCHES CONTRACT)
```json
{
  "region_id": "18-300-00101",
  "reference_time": "2024-06-01T00:00:00+00:00",
  "forecast_issue_time": "2024-06-01T00:00:00+00:00",
  "forecast_valid_start": "2024-06-01T00:00:00+00:00",
  "forecast_valid_end": "2024-06-01T06:00:00+00:00",
  "forecast_rainfall_6h": 1.33,
  "lead_hours": 6,
  "coverage": "00:00→06:00",
  "matches_contract": true,
  "note": "Exact match: cycle 00:00 step=6 = 00:00→06:00"
}
```

### Example 2: reference_time = 03:00 (MISMATCH)
```json
{
  "region_id": "18-300-00101",
  "reference_time": "2024-06-01T03:00:00+00:00",
  "forecast_issue_time": "2024-06-01T00:00:00+00:00",
  "forecast_valid_start": "2024-06-01T00:00:00+00:00",
  "forecast_valid_end": "2024-06-01T06:00:00+00:00",
  "forecast_rainfall_6h": 1.33,
  "lead_hours": 6,
  "coverage": "00:00→06:00",
  "matches_contract": false,
  "contract_window": "03:00→09:00",
  "actual_window": "00:00→06:00",
  "overlap_hours": 3,
  "note": "Uses cycle 00:00 step=6. Covers 03:00-06:00 only (3h overlap). Missing 06:00-09:00. Cannot use cycle 06:00 (leakage)."
}
```

### Example 3: reference_time = 06:00 (MATCHES CONTRACT)
```json
{
  "region_id": "18-300-00101",
  "reference_time": "2024-06-01T06:00:00+00:00",
  "forecast_issue_time": "2024-06-01T06:00:00+00:00",
  "forecast_valid_start": "2024-06-01T06:00:00+00:00",
  "forecast_valid_end": "2024-06-01T12:00:00+00:00",
  "forecast_rainfall_6h": 2.15,
  "lead_hours": 6,
  "coverage": "06:00→12:00",
  "matches_contract": true,
  "note": "Exact match: cycle 06:00 step=6 = 06:00→12:00"
}
```

### Example 4: reference_time = 09:00 (MISMATCH)
```json
{
  "region_id": "18-300-00101",
  "reference_time": "2024-06-01T09:00:00+00:00",
  "forecast_issue_time": "2024-06-01T06:00:00+00:00",
  "forecast_valid_start": "2024-06-01T06:00:00+00:00",
  "forecast_valid_end": "2024-06-01T12:00:00+00:00",
  "forecast_rainfall_6h": 2.15,
  "lead_hours": 6,
  "coverage": "06:00→12:00",
  "matches_contract": false,
  "contract_window": "09:00→15:00",
  "actual_window": "06:00→12:00",
  "overlap_hours": 3,
  "note": "Uses cycle 06:00 step=6. Covers 09:00-12:00 only (3h overlap). Missing 12:00-15:00. Cannot use cycle 12:00 (leakage)."
}
```

### Example 5: reference_time = 15:00 (MISMATCH)
```json
{
  "region_id": "18-300-00101",
  "reference_time": "2024-06-01T15:00:00+00:00",
  "forecast_issue_time": "2024-06-01T12:00:00+00:00",
  "forecast_valid_start": "2024-06-01T12:00:00+00:00",
  "forecast_valid_end": "2024-06-01T18:00:00+00:00",
  "forecast_rainfall_6h": 0.87,
  "lead_hours": 6,
  "coverage": "12:00→18:00",
  "matches_contract": false,
  "contract_window": "15:00→21:00",
  "actual_window": "12:00→18:00",
  "overlap_hours": 3,
  "note": "Uses cycle 12:00 step=6. Covers 15:00-18:00 only (3h overlap). Missing 18:00-21:00. Cannot use cycle 18:00 (leakage)."
}
```

### Example 6: reference_time = 21:00 (MISMATCH)
```json
{
  "region_id": "18-300-00101",
  "reference_time": "2024-06-01T21:00:00+00:00",
  "forecast_issue_time": "2024-06-01T18:00:00+00:00",
  "forecast_valid_start": "2024-06-01T18:00:00+00:00",
  "forecast_valid_end": "2024-06-02T00:00:00+00:00",
  "forecast_rainfall_6h": 0.42,
  "lead_hours": 6,
  "coverage": "18:00→00:00+1d",
  "matches_contract": false,
  "contract_window": "21:00→03:00+1d",
  "actual_window": "18:00→00:00+1d",
  "overlap_hours": 3,
  "note": "Uses cycle 18:00 step=6. Covers 21:00-00:00 only (3h overlap). Missing 00:00-03:00. Cannot use cycle 00:00 next day (leakage)."
}
```

---

## 11. CAN TIGGE SATISFY THE EXISTING ML CONTRACT?

**ANSWER: NO — Not for hourly reference times.**

| Aspect | Assessment |
|--------|------------|
| Contract requirement | `forecast_rainfall_6h(T) = forecast for T→T+6h` for **any hourly T** |
| TIGGE capability | Only provides `forecast for cycle→cycle+6h` at 00, 06, 12, 18 UTC |
| Match rate | **4/24 = 16.7%** of hourly reference times |
| Mismatch for other 20/24 | Returns forecast for wrong 6-hour window (3h overlap, 3h gap) |
| Leakage risk | Using next cycle would leak; using cumulative fields can't isolate window |

### What Would Be Needed for Full Compliance

To satisfy the contract for all hourly T, TIGGE would need to provide:
- **Hourly forecast cycles** (not just 6-hourly), OR
- **Sub-step accumulation fields** (e.g., step=3, step=9) to derive arbitrary windows, OR
- **Analysis-time-relative accumulations** that can be differenced

None of these are available in the standard TIGGE archive.

---

## 12. PROPOSED RESOLUTION PATHS

### Path 1: Restrict Model to Cycle Times Only (Recommended)
- **Change:** Only train/predict at reference times 00, 06, 12, 18 UTC
- **Impact:** Reduces training data from 2.22M to ~370K records (17%)
- **Pros:** Perfect temporal alignment, no leakage, uses genuine TIGGE
- **Cons:** Model can't predict at arbitrary hours; requires pipeline changes

### Path 2: Accept Mismatch with Explicit Documentation
- **Change:** Keep hourly reference times but document that `forecast_rainfall_6h` = "latest available cycle's 6h forecast" (not T→T+6h)
- **Impact:** Feature semantics change; model may learn spurious patterns
- **Pros:** Keeps full temporal resolution
- **Cons:** Feature ≠ contract; potential leakage in practice; model degradation

### Path 3: Use TIGGE Ensemble + Statistical Downscaling
- **Change:** Use ensemble forecasts + ML to estimate T→T+6h from cycle forecasts
- **Impact:** Complex; introduces model-dependent forecast feature
- **Pros:** Could approximate true T→T+6h
- **Cons:** Circular dependency (model predicting feature for model); unvalidated

### Path 4: Use Different Forecast Source
- **Change:** Use ECMWF HRES/ENS (higher resolution, more cycles) or other provider
- **Impact:** Different data source, may have cost/access restrictions
- **Pros:** Could provide true hourly forecasts
- **Cons:** May not have historical archive; different access requirements

---

## 13. REVISED QUALITY CHECKS

Add temporal alignment check to validation:

```python
def check_temporal_alignment(df):
    """Verify forecast window matches reference time → reference time + 6h."""
    mismatches = 0
    for _, row in df[df['forecast_rainfall_6h'].notna()].iterrows():
        ref = pd.Timestamp(row['reference_time'])
        issue = pd.Timestamp(row['forecast_issue_time'])
        valid_start = pd.Timestamp(row['forecast_valid_start'])
        valid_end = pd.Timestamp(row['forecast_valid_end'])
        
        # Contract: valid_start should equal ref, valid_end = ref + 6h
        if valid_start != ref or valid_end != ref + pd.Timedelta(hours=6):
            mismatches += 1
    
    return mismatches, len(df[df['forecast_rainfall_6h'].notna()])
```

Expected result: **~20/24 hourly reference times will mismatch** with current TIGGE approach.

---

## 14. ESTIMATED ACQUISITION SIZE & TIME (Unchanged)

| Metric | Estimate |
|--------|----------|
| API requests | 2,052 (513 days × 4 cycles) |
| Raw GRIB files | 2,052 |
| Raw storage | ~8-12 GB |
| Processed CSV | ~150-200 MB |
| Download time (sequential) | ~2-3 hours |
| Download time (parallel, 4 workers) | ~30-45 minutes |

---

## 15. KNOWN LIMITATIONS (Updated)

1. **Control forecast only** — Uses `type=cf` (deterministic). Ensemble spread not captured.
2. **Single lead time** — Only 6-hour lead requested. Longer leads require separate requests.
3. **0.5° resolution** — ~50 km grid; sub-grid variability not represented.
4. **TIGGE archive latency** — Near-real-time forecasts may not be available immediately.
5. **License acceptance** — TIGGE dataset requires explicit license acceptance on ECMWF website.
6. **CRITICAL: Temporal misalignment** — Only 4/24 hourly reference times get correct forecast window. The feature delivered is `cycle→cycle+6h`, not `T→T+6h`.

---

## 16. EXACT COMMAND FOR FULL ACQUISITION (When Unblocked)

```bash
# Run in WSL (Ubuntu 26.04) with activated ML environment
cd /path/to/v2-sih_2026_flood_guard

# Activate environment (if using venv)
source .venv-ml/bin/activate

# Execute full acquisition
python -m src.ml.fetch_historical_forecasts \
    --start-date 2024-05-01 \
    --end-date 2025-09-25 \
    --output-dir data/raw/tigge \
    --processed-dir data/processed \
    --cycles 0,6,12,18 \
    --lead-hours 6 \
    --max-grid-distance-km 50 \
    --max-retries 3 \
    --backoff-base 1 \
    --log-file logs/tigge_acquisition.log
```

**Note:** The script currently uses `build_historical_forecast_dataset()` function. The CLI wrapper above is the intended interface; the function can also be called directly from Python.

---

## 17. HUMAN APPROVAL REQUIRED

**⚠️ FULL ACQUISITION WILL NOT START AUTOMATICALLY.**

Explicit human approval is required before launching the full 2,052-request acquisition. To proceed:

1. **Resolve temporal alignment** (choose Path 1, 2, 3, or 4 above)
2. Update ML contract / training pipeline accordingly
3. Review this report
4. Confirm WSL environment is ready
5. Verify `~/.cdsapirc` credentials are valid
6. Run the command in Section 16

---

## 18. STATUS

**BLOCKED_TEMPORAL_FORECAST_ALIGNMENT**

### Blocker Summary

| Blocker | Status | Resolution |
|---------|--------|------------|
| B1: Temporal semantics (T→T+6h vs cycle→cycle+6h) | **BLOCKING** | Choose resolution path (1-4) |
| B2: ensemble_mean flag | Fixed in code | `ensemble_mean = False` for control forecast |
| B3: Leakage test `valid_start > ref_time` | Fixed in analysis | Use `issue_time ≤ ref_time` + temporal alignment check |
| B4: Sample outputs | Updated above | 6 examples showing match/mismatch |
| B5: Status claim | Fixed | Now `BLOCKED_TEMPORAL_FORECAST_ALIGNMENT` |

### Required Decisions Before Proceeding

1. **Which resolution path?** (Path 1 recommended: restrict to cycle times)
2. **If Path 1:** Update training pipeline to only use 00/06/12/18 reference times
3. **If Path 2:** Explicitly rename feature to `forecast_cycle_rainfall_6h` and document mismatch
4. **Update feature_parity.py** to match chosen semantics
5. **Update leakage_tests.py** with corrected temporal alignment test
6. **Update model_feature_preparation.py** to fetch correct forecast window

**Do NOT download the full 2,052 GRIB files until temporal alignment is resolved.**

**Do NOT retrain the ML model.**

**Do NOT delete existing smoke-test data.**
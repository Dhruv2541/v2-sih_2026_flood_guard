# Phase 5B-5D.4 Historical Forecast Source Feasibility Review

**Generated:** 2026-09-30  
**Status:** FEASIBILITY ANALYSIS — NO FULL ACQUISITION AUTHORIZED

---

## 1. Executive Summary

This report evaluates historical forecast data sources that could satisfy the FloodGuard ML contract requirement:

```
forecast_rainfall_6h(T) = forecast precipitation accumulated over T → T+6h
for ANY hourly reference time T (00:00, 01:00, ..., 23:00 UTC)
```

**Key Finding:** The current TIGGE workflow (via ECDS/CDS) provides forecasts only at 00/06/12/18 UTC cycles with 6-hourly accumulations from cycle start. This matches the ML contract at only **4 of 24 hourly reference times (16.7%)**. At other times, TIGGE provides forecasts for the WRONG 6-hour window.

After evaluating **8 candidate sources**, only **NOAA GEFS Reforecast (v12)** potentially satisfies the temporal requirement through its 3-hourly output intervals and sub-step accumulation fields, enabling derivation of arbitrary T→T+6h windows. However, access mechanisms, historical coverage for 2024-2025, and automation from WSL require verification.

**No candidate is confirmed GO without small-sample verification.** All sources marked "VERIFICATION NEEDED" require a concrete feasibility test before any acquisition decision.

---

## 2. Existing ML Contract (Immutable)

### Feature Definition
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

### Contract Requirements
| Requirement | Specification |
|-------------|---------------|
| **Temporal resolution** | ANY hourly reference time T (00:00–23:00 UTC) |
| **Forecast window** | Exactly T → T+6h (not cycle-relative) |
| **Information availability** | All forecast data must be issued ≤ T |
| **No leakage** | No future observations, no future forecast cycles |
| **No fabrication** | No interpolation, shifting, or synthetic generation |
| **Geography** | 180 Assam Revenue Circles (26–28°N, 89–96°E) |
| **Period** | 2024-05-01 through 2025-09-25 (513 days) |

### Feature Position
```python
FEATURE_CONTRACT_FULL = [
    'rainfall_1h', 'rainfall_3h', 'rainfall_6h', 'rainfall_12h', 'rainfall_24h',
    'forecast_rainfall_6h',  # ← Index 5 (6th feature)
    'rainfall_3d_cumulative', 'rainfall_7d_cumulative',
    ...
]
```

---

## 3. Why TIGGE Fails the Contract

| Aspect | TIGGE Reality | Contract Requirement | Gap |
|--------|---------------|---------------------|-----|
| **Forecast cycles** | 00, 06, 12, 18 UTC (6-hourly) | Any hourly T | Only 4/24 match |
| **Accumulation** | Cycle-relative: cycle → cycle+6h | Reference-relative: T → T+6h | Semantics mismatch |
| **Example T=03:00** | Available: 00:00→06:00 (covers 03-06 only) | Required: 03:00→09:00 | 3h gap (06-09), cannot use 06:00 cycle (leakage) |
| **Example T=09:00** | Available: 06:00→12:00 (covers 09-12 only) | Required: 09:00→15:00 | 3h gap (12-15), cannot use 12:00 cycle (leakage) |
| **Sub-step fields** | Not available in standard TIGGE archive | Would need step=3, step=9 to derive 03-09 | Not provided |

**Conclusion:** TIGGE cannot satisfy the contract for hourly reference times without leakage or fabrication.

---

## 4. Candidate Sources Evaluation

### Evaluation Criteria
| Criterion | Weight | Notes |
|-----------|--------|-------|
| Temporal alignment (T→T+6h for hourly T) | Critical | Must satisfy ML contract |
| Historical coverage 2024-05-01 to 2025-09-25 | Critical | Must cover full period |
| Geographic coverage (Assam) | Critical | Must cover 26-28°N, 89-96°E |
| Precipitation accumulation fields | Critical | Must provide tp or equivalent |
| API/automated download from WSL | High | Must be scriptable |
| Authentication/license | Medium | Must be obtainable |
| Resolution ≤ 0.5° | Medium | Sufficient for 180 circles |
| Cost | Low | Prefer free/open |

---

### Candidate 1: TIGGE (Current) — BASELINE

| Property | Value |
|----------|-------|
| **Dataset** | `tigge-forecasts` (ECDS/CDS) |
| **Forecast cycles** | 00, 06, 12, 18 UTC (6-hourly) |
| **Lead times** | 6, 12, 18, 24, ... hours |
| **Accumulation** | Cycle-relative (cycle → cycle+step) |
| **Resolution** | 0.5° × 0.5° (~50 km) |
| **Type** | Control (`cf`) + Ensemble (`pf`, 50 members) |
| **Parameter** | `param=228228` (tp, Total Precipitation) |
| **Historical coverage** | ~2006–present |
| **Access** | ECDS/CDS API, `cdsapi` Python client |
| **Authentication** | `~/.cdsapirc` with ECDS key |
| **License** | TIGGE license acceptance required |
| **Automation from WSL** | ✅ Verified working |
| **Temporal alignment** | ❌ **FAILS** — Only 16.7% match |
| **GO/NO-GO** | **NO-GO** for current contract |

**Verdict:** Already validated. Fails temporal alignment. Only usable if contract changes to cycle-relative.

---

### Candidate 2: ECMWF HRES/ENS Historical (MARS Archive)

| Property | Value |
|----------|-------|
| **Dataset** | ECMWF operational HRES (High RESolution) + ENS (Ensemble) |
| **Forecast cycles** | 00, 06, 12, 18 UTC (6-hourly) — same as TIGGE |
| **Lead times** | Hourly to 90h, then 3-hourly to 240h, then 6-hourly |
| **Accumulation** | Model timestep outputs; can derive arbitrary windows IF sub-hourly fields available |
| **Resolution** | HRES: ~9 km (0.1°); ENS: ~18 km (0.2°) |
| **Type** | Deterministic (HRES) + Ensemble (ENS, 50 members) |
| **Parameter** | `tp` (Total Precipitation), `cp` (Convective Precipitation), `lsp` (Large-scale) |
| **Historical coverage** | HRES: ~2016–present; ENS: ~1990s–present (varies) |
| **Access** | **MARS Web API** (not CDS/ECDS) — requires special registration |
| **Authentication** | ECMWF account with MARS access + project allocation |
| **License** | ECMWF member state or commercial license |
| **Automation from WSL** | Possible via `ecmwf-api-client` or `metview` |
| **Temporal alignment** | ❌ **LIKELY FAILS** — Same 6-hourly cycles as TIGGE. Sub-hourly fields may exist for recent years but historical archive access uncertain. |
| **GO/NO-GO** | **VERIFICATION NEEDED** — Need to confirm: (1) sub-hourly `tp` availability for 2024-2025, (2) MARS access from WSL, (3) whether step=1h or step=3h fields exist in archive |

**Key Question:** Does MARS archive store hourly `tp` accumulation fields (step=1,2,3...) for historical HRES/ENS, or only the standard 6-hourly steps?

**Test Required:** Request MARS for 2024-06-01 00:00 cycle, step=1,2,3,4,5,6 for Assam domain. Check if returns data.

---

### Candidate 3: ECMWF ERA5 Reforecast (ERA5-RF)

| Property | Value |
|----------|-------|
| **Dataset** | `era5-reforecast` or similar (CDS) |
| **Forecast cycles** | Typically weekly (e.g., every Monday 00:00) or monthly |
| **Lead times** | Up to 46 days (sub-seasonal) |
| **Accumulation** | Model output intervals (typically 6-hourly or daily) |
| **Resolution** | ~31 km (0.25°) |
| **Type** | Ensemble reforecast (11 members?) |
| **Parameter** | `tp` (Total Precipitation) |
| **Historical coverage** | ~1981–present (reforecast for ERA5 period) |
| **Access** | CDS API (`cdsapi`) |
| **Authentication** | Standard CDS key |
| **License** | Open (Copernicus) |
| **Automation from WSL** | ✅ CDS API works |
| **Temporal alignment** | ❌ **FAILS** — Not hourly/daily cycles. Reforecasts are weekly/monthly initializations for sub-seasonal prediction, not daily weather forecasting. |
| **GO/NO-GO** | **NO-GO** — Wrong temporal design (sub-seasonal, not daily forecasts) |

---

### Candidate 4: ECMWF SEAS5 Reforecast

| Property | Value |
|----------|-------|
| **Dataset** | `seasonal-original-single-levels` or similar (CDS) |
| **Forecast cycles** | Monthly (1st of month 00:00) |
| **Lead times** | Up to 7 months |
| **Accumulation** | Monthly/seasonal means |
| **Resolution** | ~36 km |
| **Type** | Seasonal ensemble (25 members) |
| **Parameter** | `tp` (monthly means) |
| **Historical coverage** | ~1981–present |
| **Access** | CDS API |
| **Temporal alignment** | ❌ **FAILS** — Seasonal, not daily/hourly |
| **GO/NO-GO** | **NO-GO** |

---

### Candidate 5: NOAA GEFS Reforecast v12 (GEFSv12/R)

| Property | Value |
|----------|-------|
| **Dataset** | GEFSv12 Reforecast (GEFSv12/R) |
| **Forecast cycles** | **Every 6 hours (00, 06, 12, 18) PLUS 00:00 daily reforecast for past 20+ years** |
| **Lead times** | 0–384h (16 days) |
| **Output interval** | **3-hourly** (0, 3, 6, 9, 12, 15, 18, 21, 24, ... hours) |
| **Accumulation** | **3-hourly precipitation accumulation** (APCP_3hr) + 6-hourly |
| **Resolution** | 0.25° × 0.25° (~25 km) |
| **Type** | Ensemble (11 members: 1 control + 10 perturbed) |
| **Parameter** | `apcp` (Accumulated Precipitation) — 3hr and 6hr accumulations |
| **Historical coverage** | **2000–2019** (reforecast period) — **NOT 2024-2025** |
| **Real-time GEFS** | 2020–present via NOMADS (00,06,12,18 cycles, 3-hourly output) |
| **Access** | NOAA NOMADS (HTTPS/THREDDS), AWS S3 (`noaa-gefs-pds`), Google Cloud |
| **Authentication** | None (public) |
| **License** | Public domain (US Government) |
| **Automation from WSL** | ✅ `wget`/`curl`/THREDDS/OPeNDAP/AWS CLI |
| **Temporal alignment** | ✅ **POTENTIALLY PASSES** — 3-hourly APCP fields allow deriving arbitrary T→T+6h windows by summing two 3-hourly steps. For any hourly T, can use the 3-hourly intervals that bracket T. |
| **GO/NO-GO** | **VERIFICATION NEEDED** — Critical: Real-time GEFS (2020+) has 3-hourly output. Need to confirm 2024-2025 data exists and is accessible. Reforecast only goes to 2019. |

**Key Insight:** Real-time GEFS (operational, not reforecast) runs 4x/day with **3-hourly precipitation output** (APCP_3hr). For any hourly reference time T, we can sum the two 3-hourly intervals covering T→T+6h. Example:
- T=03:00: Use APCP_3hr for 00→03 and 03→06 from 00:00 cycle, plus 06→09 from 06:00 cycle? Wait — 06:00 cycle not available at 03:00 (leakage).
- Better: Use 00:00 cycle's 3-hourly output: 00→03, 03→06, 06→09. Sum 03→06 + 06→09 = 03→09. **All from 00:00 cycle (issued ≤ 03:00). NO LEAKAGE.**
- This works IF the 00:00 cycle provides 3-hourly output out to 9h lead.

**Verification Needed:** Does operational GEFS provide 3-hourly APCP out to at least 9h lead from each cycle? If yes, then for any T, use the cycle ≤ T and sum appropriate 3-hourly steps.

---

### Candidate 6: NOAA GFS (Deterministic) Historical

| Property | Value |
|----------|-------|
| **Dataset** | GFS 0.25° (operational) |
| **Forecast cycles** | 00, 06, 12, 18 UTC |
| **Lead times** | Hourly to 120h, then 3-hourly |
| **Accumulation** | Hourly precipitation rate (`prate`) + 3/6-hourly accumulations |
| **Resolution** | 0.25° × 0.25° (~25 km) |
| **Type** | Deterministic |
| **Parameter** | `prate` (Precipitation Rate, kg/m²/s) + `apcp` |
| **Historical coverage** | 2020–present via NOMADS/AWS |
| **Access** | NOAA NOMADS, AWS S3 (`noaa-gfs-pds`) |
| **Authentication** | None |
| **License** | Public domain |
| **Automation from WSL** | ✅ |
| **Temporal alignment** | ✅ **POTENTIALLY PASSES** — Hourly `prate` allows integration over any T→T+6h window from a single cycle. For T=03:00, use 00:00 cycle's hourly `prate` from hour 3 to hour 9. |
| **GO/NO-GO** | **VERIFICATION NEEDED** — Confirm hourly `prate` available in historical archive for 2024-2025. |

---

### Candidate 7: NOAA NAM / NAM-Nest (Regional, CONUS only)

| Property | Value |
|----------|-------|
| **Domain** | North America only |
| **Assam coverage** | ❌ **NO** |
| **GO/NO-GO** | **NO-GO** — Wrong domain |

---

### Candidate 8: ERA5 Reanalysis (NOT Forecast)

| Property | Value |
|----------|-------|
| **Type** | Reanalysis (observations + model) — **NOT a forecast** |
| **Temporal alignment** | ❌ **FAILS** — Not a forecast product |
| **GO/NO-GO** | **NO-GO** — Violates "forecast" requirement |

---

### Candidate 9: JMA GSM / MSM (Japan Meteorological Agency)

| Property | Value |
|----------|-------|
| **Domain** | Global (GSM) / Regional (MSM) |
| **Forecast cycles** | 00, 06, 12, 18 UTC |
| **Resolution** | GSM: ~20 km; MSM: ~5 km (Japan only) |
| **Historical archive** | Limited public access; may require registration |
| **Automation from WSL** | Uncertain |
| **Temporal alignment** | Same 6-hourly cycle issue |
| **GO/NO-GO** | **VERIFICATION NEEDED** — Low priority (access uncertainty) |

---

### Candidate 10: UK Met Office Global/UKV

| Property | Value |
|----------|-------|
| **Domain** | Global (~10 km) / UK only (UKV) |
| **Historical access** | Commercial/academic license required |
| **GO/NO-GO** | **NO-GO** — Access restrictions |

---

## 5. Source-by-Source Comparison Matrix

| Source | Cycles | Output Interval | Can Derive T→T+6h? | Coverage 2024-25 | Assam | Access | License | WSL Auto | GO/NO-GO |
|--------|--------|-----------------|-------------------|------------------|-------|--------|---------|----------|----------|
| **TIGGE** | 00,06,12,18 | 6h (cycle-rel) | ❌ 16.7% | ✅ | ✅ | ECDS/API | TIGGE license | ✅ | **NO-GO** |
| **ECMWF HRES/ENS (MARS)** | 00,06,12,18 | Hourly* | ❓ Need sub-hourly archive | ✅ | ✅ | MARS API | Member/commercial | ❓ | **VERIFY** |
| **ERA5 Reforecast** | Weekly/monthly | 6h/daily | ❌ | ✅ | ✅ | CDS/API | Open | ✅ | **NO-GO** |
| **SEAS5 Reforecast** | Monthly | Monthly | ❌ | ✅ | ✅ | CDS/API | Open | ✅ | **NO-GO** |
| **NOAA GEFS Reforecast** | 00 only (daily) | 3h | ❌ (period ends 2019) | ❌ 2019 end | ✅ | NOMADS/AWS | Public | ✅ | **NO-GO** (period) |
| **NOAA GEFS Operational** | 00,06,12,18 | **3h** | ✅ **POTENTIAL** | ✅ 2020+ | ✅ | NOMADS/AWS | Public | ✅ | **VERIFY** |
| **NOAA GFS Operational** | 00,06,12,18 | **Hourly (prate)** | ✅ **POTENTIAL** | ✅ 2020+ | ✅ | NOMADS/AWS | Public | ✅ | **VERIFY** |
| **JMA GSM** | 00,06,12,18 | 3h/6h | ❓ | ❓ | ✅ | Limited | ? | ❓ | **LOW** |
| **ERA5 Reanalysis** | N/A (analysis) | Hourly | ❌ Not forecast | ✅ | ✅ | CDS/API | Open | ✅ | **NO-GO** |

---

## 6. Temporal Alignment Evidence — How Candidates Could Work

### NOAA GEFS Operational (3-hourly APCP)

**Mechanism for T→T+6h at ANY hourly T:**

```
For reference time T:
1. Find cycle C = latest cycle ≤ T (C ∈ {00,06,12,18})
2. GEFS cycle C provides 3-hourly APCP: C→C+3, C+3→C+6, C+6→C+9, ...
3. Sum the two 3-hourly intervals that cover T → T+6h
   - Example T=03:00, C=00:00: Need 03→09. Sum APCP(03→06) + APCP(06→09) from 00:00 cycle.
   - Both intervals from same cycle (issued 00:00 ≤ 03:00). NO LEAKAGE.
   - Example T=09:00, C=06:00: Need 09→15. Sum APCP(09→12) + APCP(12→15) from 06:00 cycle.
   - 06:00 cycle issued at 06:00 ≤ 09:00. NO LEAKAGE.
```

**Requirement:** GEFS cycle must provide 3-hourly APCP out to at least (T-C)+6h lead.
- Max (T-C) = 5 hours (e.g., T=05:00, C=00:00 → need lead 11h)
- GEFS provides 3-hourly output to 384h → **SUFFICIENT**

### NOAA GFS Operational (Hourly `prate`)

**Mechanism:**
```
For reference time T:
1. Find cycle C = latest cycle ≤ T
2. GFS cycle C provides hourly precipitation RATE (prate) for hours 1..120
3. Integrate prate from hour (T-C) to hour (T-C+6) → accumulation over T→T+6h
4. Example T=03:00, C=00:00: Integrate prate hours 3,4,5,6,7,8,9 (6 hours)
```

**Requirement:** GFS hourly `prate` available in historical archive.
- GFS 0.25° provides hourly output to 120h → **SUFFICIENT**

---

## 7. Authentication & Access Requirements

| Source | Auth Mechanism | Cost | Setup Effort |
|--------|---------------|------|--------------|
| TIGGE (ECDS) | `~/.cdsapirc` with ECDS key | Free (license acceptance) | Low |
| ECMWF HRES/ENS (MARS) | ECMWF account + MARS access + compute allocation | Member state / commercial | High |
| NOAA GEFS/GFS (NOMADS) | None (public HTTPS) | Free (US Gov) | Low |
| NOAA GEFS/GFS (AWS S3) | AWS credentials (optional, for speed) | Free data / pay egress | Medium |
| NOAA GEFS/GFS (Google Cloud) | GCP credentials | Free data / pay egress | Medium |

---

## 8. Coverage Evidence Needed

For each VERIFICATION NEEDED candidate, must confirm:

| Source | Must Verify |
|--------|-------------|
| **NOAA GEFS Operational** | (1) 2024-05-01 to 2025-09-25 data exists on NOMADS/AWS<br>(2) 3-hourly APCP available for all 4 cycles<br>(3) 3-hourly output extends to ≥11h lead<br>(4) 0.25° grid covers Assam |
| **NOAA GFS Operational** | (1) 2024-05-01 to 2025-09-25 data exists<br>(2) Hourly `prate` available for all 4 cycles<br>(3) Hourly output extends to ≥11h lead<br>(4) 0.25° grid covers Assam |
| **ECMWF HRES/ENS (MARS)** | (1) MARS access obtainable<br>(2) Sub-hourly `tp` archived for 2024-2025<br>(3) Can request arbitrary steps (1h, 2h, 3h...) |

---

## 9. Small-Sample Verification Plan

**For each VERIFICATION NEEDED candidate, test these 6 reference times:**

| Reference Time | Required Window | Test Procedure |
|----------------|----------------|----------------|
| **00:00** | 00:00→06:00 | Baseline — should work for all sources |
| **03:00** | 03:00→09:00 | Critical — TIGGE fails here |
| **06:00** | 06:00→12:00 | Baseline — cycle-aligned |
| **09:00** | 09:00→15:00 | Critical — TIGGE fails here |
| **15:00** | 15:00→21:00 | Critical — TIGGE fails here |
| **21:00** | 21:00→03:00+1d | Critical — TIGGE fails here |

**Test Steps per Source:**
1. Identify forecast cycle C ≤ T
2. Request forecast fields for cycle C covering T→T+6h
3. Extract precipitation for one Assam circle (e.g., 18-300-00101 at 26.5659°N, 89.9934°E)
4. Verify: `issue_time ≤ T`, `valid_start == T`, `valid_end == T+6h`
5. Record precipitation value and confirm physical plausibility (0–500 mm)

**Test Domain (Assam subset):**
- Latitude: 24°N to 29°N
- Longitude: 88°E to 97°E

---

## 10. Risks & Limitations

| Risk | Source | Mitigation |
|------|--------|------------|
| **Historical data gaps** | GEFS/GFS operational archive | Test sample dates across period; NOMADS may purge old cycles |
| **Format changes** | NOAA model upgrades (GFSv16, GEFSv12→v13) | Verify consistent parameter names across period |
| **Assimilation cycles** | Some cycles may be "analysis" not forecast | Verify cycle type (forecast vs analysis) |
| **Timezone handling** | All sources use UTC; ensure no offset | Explicit UTC in all requests |
| **Grid interpolation** | 0.25° GEFS/GFS vs 0.5° TIGGE | Use nearest-grid; document distance |
| **Leakage via next cycle** | Temptation to use C+6 cycle for T near boundary | Strictly enforce `issue_time ≤ reference_time` |
| **Rate limits** | NOMADS HTTPS has limits | Use AWS S3 mirror or implement backoff |
| **MARS access denied** | ECMWF HRES/ENS requires allocation | Have NOAA fallback ready |

---

## 11. Recommended Implementation Path

### Phase 1: Immediate Verification (This Week)
```
Priority 1: NOAA GFS Operational (AWS S3: noaa-gfs-pds)
  - Simplest: hourly `prate` → integrate T→T+6h
  - Public, no auth, AWS CLI from WSL
  - Test 6 reference times for 2024-06-01

Priority 2: NOAA GEFS Operational (AWS S3: noaa-gefs-pds)
  - 3-hourly APCP → sum two intervals
  - Ensemble mean available (11 members)
  - Test same 6 reference times

Priority 3: ECMWF HRES/ENS (MARS) — if accessible
  - Higher resolution (9km/18km)
  - Need MARS access approval
```

### Phase 2: Decision Gate
After verification, choose ONE source that:
1. ✅ Passes all 6 reference time tests
2. ✅ Covers full 2024-05-01 to 2025-09-25
3. ✅ Automatable from WSL
4. ✅ No license/access blockers

### Phase 3: Acquisition Code Adaptation
Adapt `fetch_historical_forecasts.py` for chosen source:
- New request builder (NOMADS/AWS vs ECDS)
- New parser (GRIB2 for NOAA vs GRIB1/2 for TIGGE)
- Temporal alignment logic (sum 3-hourly / integrate hourly)
- Same output contract (region_id, timestamps, forecast_rainfall_6h, grid metadata)

---

## 12. Explicit GO / NO-GO Decisions

| Candidate | Decision | Reason |
|-----------|----------|--------|
| TIGGE (ECDS) | **NO-GO** | Fails temporal alignment (16.7% match) |
| ECMWF HRES/ENS (MARS) | **VERIFY** | Potential sub-hourly fields; need MARS access + archive check |
| ERA5 Reforecast | **NO-GO** | Weekly cycles, sub-seasonal design |
| SEAS5 Reforecast | **NO-GO** | Monthly cycles, seasonal design |
| GEFS Reforecast (v12) | **NO-GO** | Period ends 2019 |
| **NOAA GEFS Operational** | **VERIFY** | **Best candidate** — 3-hourly APCP, public, 2020+ |
| **NOAA GFS Operational** | **VERIFY** | **Strong candidate** — hourly `prate`, public, 2020+ |
| JMA GSM | **LOW** | Access uncertain, same cycle limitation |
| UK Met Office | **NO-GO** | Commercial license |
| ERA5 Reanalysis | **NO-GO** | Not a forecast |

---

## 13. Next Steps

1. **Run small-sample verification** for NOAA GFS and NOAA GEFS operational data
2. **Test 6 reference times** (00, 03, 06, 09, 15, 21 UTC) for 2024-06-01
3. **Confirm full period coverage** on NOMADS/AWS
4. **Select ONE source** that passes all tests
5. **Update acquisition code** for chosen source
6. **Run preflight again** with new source (Phase 5B-5D.3 equivalent)
7. **Only then** authorize full acquisition

---

## 14. No Full Acquisition Authorized

> **NO FULL ACQUISITION IS AUTHORIZED BY THIS PHASE.**

This report documents feasibility analysis only. Before any acquisition code modification or full download:
- Small-sample verification must complete successfully
- Temporal alignment must be demonstrated for all 6 test reference times
- Full period coverage must be confirmed
- Human approval required after verification results

---

## Appendix: NOAA AWS S3 Access Patterns

### GFS 0.25° (noaa-gfs-pds)
```
s3://noaa-gfs-pds/gfs.YYYYMMDD/HH/atmos/gfs.tHHZ.pgrb2.0p25.fFFF
# Example: gfs.20240601/00/atmos/gfs.t00z.pgrb2.0p25.f006
# f006 = 6-hour forecast (00→06)
# Need hourly prate: may be in separate files or same file
```

### GEFS 0.25° (noaa-gefs-pds)
```
s3://noaa-gefs-pds/gefs.YYYYMMDD/HH/atmos/pgrb2ap5/gefs.tHHZ.pgrb2a.0p25.fFFF.mem
# Example: gefs.20240601/00/atmos/pgrb2ap5/gefs.t00z.pgrb2a.0p25.f006.mem001
# mem001 = control, mem002-011 = ensemble
# APCP_3hr available in pgrb2ap5 files
```

### NOMADS HTTPS (alternative)
```
https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t00z.pgrb2.0p25.f006&var_APCP=on&left_lon=88&right_lon=97&top_lat=29&bottom_lat=24&dir=%2Fgfs.20240601%2F00%2Fatmos
```

---

*End of Feasibility Report*
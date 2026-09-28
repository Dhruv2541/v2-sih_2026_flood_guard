# Label Definition Document

This document establishes the official criteria, boundaries, and sources for the binary target variable `flood_occurred` used in training and evaluating the Assam Flood Prediction Model.

---

## Target Definition Summary

- **Target Variable Name:** `flood_occurred`
- **Data Type:** Binary Integer (`0` or `1`)
- **Spatial Unit:** Assam Revenue Circle (`region_id`)
- **Temporal Resolution:** Daily continuous observation panel (with multi-window rainfall antecedents)

---

## Positive Label (1) = Real Flood

A row is assigned `flood_occurred = 1` if and only if there is **empirical evidence** confirming an active flood event in that specific Revenue Circle on that specific date.

### Verified Sources of Evidence:
1. **ASDMA Daily Flood Bulletins:** Official district/circle inundation logs issued by the Assam State Disaster Management Authority.
2. **CWC River Gauge Data:** Recorded river water level exceeding danger mark at relevant CWC monitoring stations (e.g. Brahmaputra at Dibrugarh/Tezpur/Dhubri, Kopili at Kampur, Barak at Silchar).
3. **ISRO/Bhuvan Inundation Maps:** Earth observation satellite maps confirming standing flood water over agricultural or inhabited revenue circle areas.
4. **Sentinel-1 SAR Satellite Products:** Synthetic Aperture Radar imagery detecting surface water expansion.

---

## Negative Label (0) = Confirmed No Flood

A row is assigned `flood_occurred = 0` when the Revenue Circle experienced non-flooded conditions during a monitored time window with no reported inundation or river overflow.

---

## Unresolved / Excluded Observations (`unresolved`)

Flood reports or news items that cannot be definitively mapped to a specific Revenue Circle polygon or exact date window are **not guessed**. They are classified as `unresolved` and **excluded** from the ground-truth target vector.

---

## Golden Rule of Flood Labeling

> 🌟 **GOLDEN RULE:**
> *Just because there is no official flood report on a given day, does NOT automatically guarantee zero local waterlogging. Reports can be delayed, incomplete, or communication-disrupted. Therefore, negative labels are constructed during periods of verified dry/normal conditions and clear weather.*

---

## Summary of Differences: Baseline vs Ground-Truth Target

| Property | Rainfall Threshold Baseline (Legacy) | Ground-Truth Real Target (Production) |
| :--- | :--- | :--- |
| **Rule** | `rainfall_24h > 50 mm` | Official ASDMA/CWC/ISRO Inundation Proof |
| **Physical Reality** | Ignores elevation, river level, soil drainage | Reflects actual hydrological flooding |
| **False Positive Rate** | Extremely High (heavy rain on hill tops marked as flood) | Low (only true ground inundation) |
| **Usage** | Baseline comparison experiment only | Primary Model Target (`flood_occurred`) |

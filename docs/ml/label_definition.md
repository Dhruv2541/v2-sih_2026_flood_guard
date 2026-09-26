# Flood Label Definition

**Target Name:** `flood_occurred`

## Positive Label (1) = Real Flood
- **Definition:** There is concrete, real-world evidence that a flood occurred.
- **Criteria:** We know exactly **which Revenue Circle** was affected and on **which date/time**.
- **Main Sources of Proof:** ASDMA (Assam State Disaster Management Authority) Daily Flood Bulletins, ISRO Bhuvan Inundation Maps, and Sentinel-1 SAR imagery analysis.

## Negative Label (0) = No Flood
- **Definition:** We have a reliable reason to state no flood happened during this time in this specific location.
- **Criteria:** During the monsoon season, if ASDMA explicitly lists districts/circles as unaffected, or satellite imagery confirms dry land.
- **Golden Rule:** Just because there is no flood report does NOT mean there was no flood. Reports can be missing, delayed, or incomplete. Ambiguous dates without concrete evidence of dryness are marked as `unresolved` and excluded from the training dataset.

## Dimensions
- **Spatial Unit:** Assam Revenue Circle (Mapped to `region_id`).
- **Temporal Resolution:** Daily (Aggregated from hourly reports to match standard ASDMA 24-hour bulletin cycles).

## Known Limitations
- ASDMA reports are often aggregated at the District level rather than the Revenue Circle level. We rely on cross-referencing village names with Revenue Circle boundaries to achieve accuracy.
- Flash floods lasting less than 12 hours may be missed by Sentinel-1 satellite passes.

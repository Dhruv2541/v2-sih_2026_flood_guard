# Spatial Mapping Documentation: Flood Report to Revenue Circle

## Overview
This document details the spatial mapping procedure linking historical flood reports, bulletins, and satellite observations to standard Assam Revenue Circles (`region_id`).

## Spatial Resolution & Common Identifier
- **Spatial Unit:** Assam Revenue Circle (Polygon / Centroid)
- **Standard Identifier:** `region_id` (matches `object_id` in `assam_circles.json`, e.g., `18-300-00101` or Circle Slug)

## Mapped Real Flood Events

| District | Revenue Circle | `region_id` | Start Date | End Date | Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| DHEMAJI | Dhemaji | `18-308-00150` | 2024-06-20 | 2024-07-04 | ASDMA Daily Flood Report |
| DHEMAJI | Jonai | `18-308-00152` | 2024-06-22 | 2024-07-06 | ISRO Bhuvan Inundation Map |
| LAKHIMPUR | North Lakhimpur | `18-307-00145` | 2024-06-19 | 2024-07-03 | ASDMA Flood Bulletin |
| LAKHIMPUR | Subansiri (Pt-I) | `18-307-00147` | 2024-06-21 | 2024-07-05 | CWC Gauge Danger Level |
| LAKHIMPUR | Bihpuria | `18-307-00142` | 2024-06-22 | 2024-07-02 | ASDMA Daily Flood Report |
| BARPETA | Barpeta | `18-303-00122` | 2024-06-25 | 2024-07-08 | ASDMA Daily Flood Report |
| BARPETA | Barnagar (Pt) | `18-303-00264` | 2024-06-26 | 2024-07-07 | ISRO Bhuvan Inundation Map |
| BARPETA | Kalgachia | `18-303-00120` | 2024-06-27 | 2024-07-09 | ASDMA Flood Bulletin |
| MORIGAON | Mikirbheta | `18-304-00129` | 2024-06-24 | 2024-07-06 | ASDMA Daily Flood Report |
| MORIGAON | Bhuragaon | `18-304-00126` | 2024-06-25 | 2024-07-08 | CWC Kopili River Overflow |
| CACHAR | Silchar | `18-316-00185` | 2024-05-28 | 2024-06-10 | ASDMA Flood Bulletin |
| CACHAR | Katigora | `18-316-00184` | 2024-05-29 | 2024-06-12 | Barak River Gauge Breach |
| DHUBRI | Dhubri (Pt) | `18-301-00112` | 2024-07-01 | 2024-07-12 | Brahmaputra Inundation Bulletin |
| BISWANATH | Biswanath | `18-756-00249` | 2024-06-23 | 2024-07-04 | ASDMA Daily Flood Report |
| MAJULI | Ujani Majuli | `18-760-00280` | 2024-06-20 | 2024-07-07 | ISRO Bhuvan Inundation Map |
| DIBRUGARH | Dibrugarh West | `18-310-00158` | 2024-06-21 | 2024-07-03 | ASDMA Daily Flood Report |
| SONITPUR | Tezpur | `18-306-00139` | 2024-06-25 | 2024-07-02 | ASDMA Flood Bulletin |
| NALBARI | PachimNalbari | `18-323-00223` | 2024-06-24 | 2024-07-05 | ASDMA Flood Bulletin |
| KAMRUP | Palasbari | `18-321-00272` | 2024-06-26 | 2024-07-06 | ASDMA Flood Bulletin |
| GOLAGHAT | Bokakhat | `18-313-00172` | 2024-06-22 | 2024-07-07 | Kaziranga ASDMA Inundation Report |
| CACHAR | Silchar | `18-316-00185` | 2025-05-24 | 2025-06-05 | ASDMA Daily Flood Report |
| KARIMGANJ | Karimganj | `18-317-00189` | 2025-05-25 | 2025-06-06 | ASDMA Daily Flood Report |
| LAKHIMPUR | Subansiri (Pt-I) | `18-307-00147` | 2025-05-30 | 2025-06-08 | ASDMA Flood Bulletin |
| BARPETA | Barpeta | `18-303-00122` | 2025-06-01 | 2025-06-12 | ISRO Bhuvan Inundation Map |
| MORIGAON | Mikirbheta | `18-304-00129` | 2025-06-02 | 2025-06-14 | CWC Kopili Gauge Breach |


## Unresolved & Excluded Flood Events
Per strict quality rules, flood reports lacking verifiable spatial mapping to specific Revenue Circles were **excluded** (`unresolved`) from ground-truth target labeling:

| District / Zone | Reported Location | Date Range | Source | Reason for Exclusion |
| :--- | :--- | :--- | :--- | :--- |
| Dhemaji | Sissiaborgaon | 2024-06-18 to 2024-07-05 | ASDMA Daily Flood Report | Revenue Circle 'Sissiaborgaon' in district 'Dhemaji' could not be matched to assam_circles.json |
| Dhubri | Gauripur | 2024-07-02 to 2024-07-11 | ASDMA Daily Flood Report | Revenue Circle 'Gauripur' in district 'Dhubri' could not be matched to assam_circles.json |
| Dhemaji | Sissiaborgaon | 2025-05-28 to 2025-06-10 | ASDMA Daily Flood Report | Revenue Circle 'Sissiaborgaon' in district 'Dhemaji' could not be matched to assam_circles.json |
| Kamrup Metro | Unknown Circle | 2024-06-18 to 2024-06-20 | Social Media News Flash | No specific Revenue Circle spatial boundary given |
| Upper Assam Zone | Unspecified | 2024-07-01 to 2024-07-02 | Unverified Telegram Channel | Lacks district & revenue circle mapping |

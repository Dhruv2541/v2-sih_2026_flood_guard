# FloodGuard Backend Integration Requirements: Impact & Exposure Assessment

**Target Service**: Exposure & Human Vulnerability Analysis  
**Specification Version**: 1.0 (Phase 9 Audit)  
**Status**: Pre-Integration Audit & Contract Definition  
**Target Endpoint**: `GET /api/impact/{location_name}`  

---

## 1. Executive Summary

This document specifies the exact backend data requirements, schemas, and endpoints necessary to power the FloodGuard **Impact Assessment Page** (`ImpactView.tsx`). 

Currently, the backend is not yet ready. The frontend has been refactored in Phase 9 with an isolated adapter layer (`src/lib/impactAdapter.ts`) to cleanly ingest live backend payloads once available, while keeping development mock data strictly isolated and identified (`DEV MOCK • SIMULATED EXPOSURE MODEL`). Hardcoded fallback numbers have been removed from the frontend to ensure that when live data is connected, missing fields display unpopulated states (`—`) rather than fabricated numbers.

---

## 2. Metric-by-Metric Audit & Specifications

### 2.1 Total Population Affected / At Risk
- **Metric**: Total Population in Flood Inundation Path
- **Current source**: `currentSector.populationAtRisk` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock (local development sector dataset)
- **Required backend field**: `population_at_risk` (integer, e.g. `686000`) or `total_exposed`
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend (mocked in frontend)

---

### 2.2 Children Under 5 (Pediatric Priority Demographics)
- **Metric**: Vulnerable Demographics — Children Under 5 Years
- **Current source**: `currentSector.vulnerableDemographics.childrenUnder5` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock (local development mock; static fallback removed in Phase 9)
- **Required backend field**: `demographics.children_under_5` (integer, e.g. `84200`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend (mocked in frontend)

---

### 2.3 Elderly Population Above 65 (Mobility Assistance Priority)
- **Metric**: Vulnerable Demographics — Elderly Persons (65+)
- **Current source**: `currentSector.vulnerableDemographics.elderlyAbove65` / `elderlyOver65` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock (local development mock; static fallback removed in Phase 9)
- **Required backend field**: `demographics.elderly_above_65` (integer, e.g. `58900`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend (mocked in frontend)

---

### 2.4 Livestock & Cattle Exposed
- **Metric**: Vulnerable Demographics — Livestock & Domestic Animals
- **Current source**: `currentSector.vulnerableDemographics.livestockCount` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock (local development mock; static fallback removed in Phase 9)
- **Required backend field**: `demographics.livestock_count` (integer, e.g. `142000`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend (mocked in frontend)

---

### 2.5 Pregnant Women (Maternal Health Tracking)
- **Metric**: Vulnerable Demographics — Pregnant & Lactating Women
- **Current source**: `currentSector.vulnerableDemographics.pregnantWomen` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock (data model field)
- **Required backend field**: `demographics.pregnant_women` (integer, e.g. `3200`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.6 Informal Dwellings & Kutcha Housing
- **Metric**: Housing Vulnerability — Kutcha / Riverine Island Dwellings
- **Current source**: `currentSector.vulnerableDemographics.informalDwellings` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock (data model field)
- **Required backend field**: `demographics.informal_dwellings` (integer, e.g. `18200`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.7 Safe Shelters & Evacuation Centers Count
- **Metric**: Designated Safe Relief Camps & High-Plinth Shelters
- **Current source**: `currentSector.infrastructureCounts.schools` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock
- **Required backend field**: `infrastructure_counts.schools` (integer) or `shelters_count` (integer)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.8 Hospitals & Healthcare Facilities Count
- **Metric**: Medical Facilities Count in Risk Buffer
- **Current source**: `currentSector.infrastructureCounts.hospitals` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock
- **Required backend field**: `infrastructure_counts.hospitals` (integer, e.g. `4`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.9 Educational Institutions & Designated Shelters Count
- **Metric**: Schools / Colleges Count in Risk Buffer
- **Current source**: `currentSector.infrastructureCounts.schools` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock
- **Required backend field**: `infrastructure_counts.schools` (integer, e.g. `23`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.10 Road Network Assets Count
- **Metric**: Arterial Highway & Connecting Road Segments in Risk Buffer
- **Current source**: `currentSector.infrastructureCounts.roads` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock
- **Required backend field**: `infrastructure_counts.roads` (integer, e.g. `18`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.11 Bridges & Culverts Count
- **Metric**: Bridges & Critical Hydraulic Crossings in Risk Buffer
- **Current source**: `currentSector.infrastructureCounts.bridges` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock
- **Required backend field**: `infrastructure_counts.bridges` (integer, e.g. `3`)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.12 Total Monitored Infrastructure Assets
- **Metric**: Total Physical Assets Monitored
- **Current source**: `currentSector.infrastructureList.length` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock
- **Required backend field**: Array length of `infrastructure_list` or `total_infrastructure_count`
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.13 Critical Infrastructure Asset Item List
- **Metric**: Individual Asset Entity Records (Hospitals, Schools, Roads, Bridges)
  - Asset ID (`id`)
  - Asset Name (`name`)
  - Asset Type (`type`: `'hospital' | 'school' | 'road' | 'bridge'`)
  - Threat / Risk Level (`risk_level`: `'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'`)
  - Operational Status (`status`, e.g. `"Potentially affected"`, `"Critical inundation zone"`, `"Elevated & Safe"`)
  - Proximity to Flood Water (`distance_from_inundation_m`, integer in meters)
  - Bed / Population Capacity (`capacity`, string e.g. `"200 Beds • Trauma Center"`)
  - Operational Directives & Details (`details`, string)
  - Spatial Coordinates (`coordinates`: `{ lat: number, lng: number }`)
- **Current source**: `currentSector.infrastructureList` in `src/data/assamData.ts`
- **Is it mock/static/API?**: Mock
- **Required backend field**: `infrastructure_list` (array of objects)
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

### 2.14 Affected Regions & Catchment Sectors
- **Metric**: Geographic Identification & Boundary Context
  - District name (`district`)
  - Administrative sub-division (`subdivision`)
  - Regional centroid coordinates (`coordinates`: `{ lat: number, lng: number }`)
  - Affected circles/neighborhoods (`affected_neighborhoods`: array of strings)
- **Current source**: `currentSector.district`, `currentSector.subdivision`, `currentSector.coordinates`, `ASSAM_SECTORS`
- **Is it mock/static/API?**: Mock
- **Required backend field**: `location`, `district`, `subdivision`, `coordinates`, `affected_neighborhoods`
- **Required endpoint**: `GET /api/impact/{location_name}`
- **Status**: Missing in live backend

---

## 3. Required API Endpoint Contract

### Endpoint: `GET /api/impact/{location_name}`

#### Path Parameter
- `location_name` (string, required): Standardized circle, district, or sector name (e.g. `Dhemaji`, `Majuli`, `Silchar`, `Barpeta`, `Dibrugarh`, `Lakhimpur`).

#### Expected Response Body (JSON)
```json
{
  "location": "Dhemaji",
  "district": "Dhemaji",
  "subdivision": "Upper Assam Valley",
  "coordinates": {
    "lat": 27.4812,
    "lng": 94.5822
  },
  "population_at_risk": 686000,
  "demographics": {
    "children_under_5": 84200,
    "elderly_above_65": 58900,
    "pregnant_women": 3200,
    "livestock_count": 142000,
    "informal_dwellings": 18200
  },
  "infrastructure_counts": {
    "hospitals": 4,
    "schools": 23,
    "roads": 18,
    "bridges": 3
  },
  "infrastructure_list": [
    {
      "id": "inf-h1",
      "name": "Dhemaji Civil District Hospital",
      "type": "hospital",
      "status": "Potentially affected",
      "risk_level": "HIGH",
      "distance_from_inundation_m": 320,
      "capacity": "200 Beds • Trauma Center",
      "details": "Basement generators elevated; outpatient wards relocated to 1st floor.",
      "coordinates": {
        "lat": 27.485,
        "lng": 94.588
      }
    },
    {
      "id": "inf-h2",
      "name": "Gogamukh Community Health Centre (CHC)",
      "type": "hospital",
      "status": "Critical inundation zone",
      "risk_level": "CRITICAL",
      "distance_from_inundation_m": 45,
      "capacity": "50 Beds • Emergency Unit",
      "details": "Surrounding compound submerged 0.6m. Patients shifted to raised wing.",
      "coordinates": {
        "lat": 27.442,
        "lng": 94.495
      }
    },
    {
      "id": "inf-s1",
      "name": "Dhemaji Higher Secondary School",
      "type": "school",
      "status": "Designated evacuation shelter",
      "risk_level": "LOW",
      "distance_from_inundation_m": 750,
      "capacity": "1,200 Persons • Relief Camp",
      "details": "Elevated 2.5m above ground; backup potable water tanker installed.",
      "coordinates": {
        "lat": 27.489,
        "lng": 94.595
      }
    },
    {
      "id": "inf-r1",
      "name": "National Highway 15 (NH-15) Km 42-48",
      "type": "road",
      "status": "Water overtopping culverts",
      "risk_level": "HIGH",
      "distance_from_inundation_m": 0,
      "capacity": "Critical Supply Lifeline",
      "details": "Single-lane traffic controlled by SDRF; heavy vehicles diverted via North Lakhimpur.",
      "coordinates": {
        "lat": 27.46,
        "lng": 94.52
      }
    },
    {
      "id": "inf-b1",
      "name": "Jiadhal Railway & Road Bridge #12",
      "type": "bridge",
      "status": "Structural scour watch",
      "risk_level": "CRITICAL",
      "distance_from_inundation_m": 15,
      "capacity": "Heavy Rail & Multi-axle",
      "details": "Pier 3 experiencing heavy braided channel velocity; speed restriction 15 km/h enforced.",
      "coordinates": {
        "lat": 27.47,
        "lng": 94.54
      }
    }
  ],
  "affected_neighborhoods": [
    "Dhemaji Municipality (Wards 1, 3, 5)",
    "Gogamukh Riverine Agricultural Belt",
    "Batgharia Embankment Breach Zone",
    "Machkhowa Low-lying Chaporis",
    "Sissiborgaon Floodplain"
  ],
  "timestamp": "2026-10-04T14:30:00Z"
}
```

---

## 4. Frontend Readiness & Migration Summary

1. **Adapter Layer**: The frontend has implemented [`src/lib/impactAdapter.ts`](file:///c:/Users/divyk/Downloads/frontend/frontend/src/lib/impactAdapter.ts) which safely parses and normalizes the payload into a typed `NormalizedImpactData` contract.
2. **Zero Fabrication**: All demographic indicators and infrastructure counts strictly reflect backend responses. If a field is omitted by the backend, the UI renders `—` and an informative note (e.g. *"Census exposure not reported"*), without fabricating static fallback numbers.
3. **Data State Handling**: The component handles:
   - **Loading**: Multi-card skeleton loaders (`SkeletonCard`).
   - **Empty**: Informative empty state (`EmptyState`) when no assets are found in a category.
   - **Error**: High-contrast error message (`ErrorState`) with a retry callback.
   - **Backend Unavailable**: Dedicated outage banner (`BackendUnavailable`) when the API cannot be reached.
4. **Transition to Live Backend**:
   When the backend endpoint `GET /api/impact/{location_name}` is deployed, simply pass the API response directly into `<ImpactView impactData={apiResponse} dataState={dataState} onRetry={refetch} />`.

# Backend Foundation & Database Layer - Live Flood Risk Prediction API

## Overview
This directory contains the Python / FastAPI backend and PostgreSQL database foundation for the 6-day Smart India Hackathon (SIH) prototype predicting live flood risks for regions/grids in Assam, India.

## Technical Specifications
- **Python Version**: `Python 3.11.x` (ensures long-term compatibility with future ML libraries)
- **Framework**: `FastAPI` (REST APIs)
- **Database**: PostgreSQL hosted on `Supabase`
- **ORM / Database Layer**: `SQLAlchemy 2.x` (DeclarativeBase, Mapped types)
- **PostgreSQL Driver**: `psycopg` (v3 with binary wheels)
- **Configuration Management**: `pydantic-settings`
- **Testing**: `pytest` + `httpx`

---

## Database Architecture (Phase 2B)

The database consists of **3 clean, normalized core tables**:

1. **`regions`**:
   - Primary key: **`region_id`** (Text)
   - Columns: `name`, `district`, `latitude`, `longitude`, `elevation_m`, `created_at`
   - Constraints: `latitude BETWEEN 20.0 AND 30.0`, `longitude BETWEEN 88.0 AND 98.0`
2. **`observations`**:
   - Primary key: `id` (`bigint GENERATED ALWAYS AS IDENTITY`)
   - Foreign key: `region_id REFERENCES regions(region_id) ON DELETE CASCADE`
   - Columns: `recorded_at`, `rainfall_1h_mm`, `rainfall_3h_mm`, `rainfall_6h_mm`, `rainfall_24h_mm`, `water_level_m`, `temperature_c`, `humidity_pct`, `data_source`, `created_at`
   - Constraints: `UNIQUE (region_id, recorded_at)`, non-negative rainfall checks, humidity 0–100 check.
   - Note: Freshness (`is_stale`) is dynamic and evaluated at runtime by backend logic; it is **not** a database column.
3. **`predictions`**:
   - Primary key: `id` (`bigint GENERATED ALWAYS AS IDENTITY`)
   - Foreign key: `region_id REFERENCES regions(region_id) ON DELETE CASCADE`
   - Columns: `generated_at`, `forecast_valid_until`, `flood_probability`, `risk_level`, `is_fallback`, `fallback_reason`, `model_version`, `created_at`
   - Constraints: `UNIQUE (region_id, generated_at)`, probability 0.0–1.0, risk level `('low', 'moderate', 'high', 'severe')`, `forecast_valid_until >= generated_at`.
   - Note: No database default on `model_version` (must be explicitly provided).

### Timestamp Standard
All database timestamps use `timestamptz` stored in **UTC**. The frontend converts UTC to local Indian Standard Time (IST, UTC+05:30) for presentation.

---

## Getting Started (Local Development)

### 1. Prerequisites
Ensure **Python 3.11.x** is installed:
```powershell
py -3.11 --version
```

### 2. Virtual Environment & Dependencies
```powershell
py -3.11 -m venv backend/.venv
.\backend\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```powershell
copy backend\.env.example backend\.env
```
Configure your credentials in `backend/.env`:
```env
ENVIRONMENT=development
API_PREFIX=/api/v1
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL_TEST=postgresql+psycopg://USER:PASSWORD@HOST:PORT/TEST_DATABASE
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:3000","http://127.0.0.1:5173"]
```

---

## Database Management Commands

### 1. Explicit Schema Initialization
Database tables are **never** created automatically on application startup. To initialize tables in Supabase:
```powershell
python -m app.database.init_db
```
*(Connects using `DATABASE_URL` and creates `regions`, `observations`, and `predictions` tables).*

### 2. Optional Development Seeding
To populate temporary development grid regions for local UI testing:
```powershell
python -m app.database.seed
```
> [!IMPORTANT]
> The seeded records (`DEV_AS_BAR_01`, `DEV_AS_DHU_01`, `DEV_AS_MAJ_01`) are temporary development mock regions and **NOT** the final production Assam grid. The seed command is idempotent and optional.

---

## Running the Application
```powershell
uvicorn app.main:app --app-dir backend --reload --port 8000
```
- Health Check: `http://127.0.0.1:8000/api/v1/health` (Always works independently of DB)
- Database Check: `http://127.0.0.1:8000/api/v1/health/db`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## Running Automated Tests

### 1. Foundation & Model Invariant Tests
```powershell
pytest backend/tests/test_health.py -v
```

### 2. PostgreSQL Integration Tests
The database constraint tests require a dedicated, isolated test PostgreSQL database (configured via `DATABASE_URL_TEST` in `.env`). Tests will **never** run against the production/development database.
```powershell
pytest backend/tests/test_database.py -v
```

---

## Deferred to Future Phases
The following remain explicitly out of scope for Phase 2:
- Live external API integrations (Open-Meteo, IMD, CWC river gauges)
- ML model training, feature preparation, and inference logic
- Risk threshold calculations
- User subscriptions, alerts, and SMS dispatching
- Scheduled background ingestion jobs
- Frontend application components

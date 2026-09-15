# Assam Live Flood Risk Guard (SIH Prototype)

A 6-day Smart India Hackathon (SIH) prototype for **Live Flood Risk Prediction** in Assam, India.

---

## 1. Project Purpose
Assam regularly faces severe monsoon flooding across its major river basins (e.g. Brahmaputra and Barak). This system is designed to ingest environmental indicators (rainfall, river water gauge levels, weather metrics), feed them to an ML model, and deliver live ~6-hour flood risk assessments per region/grid through interactive dashboards and early-warning alerts.

---

## 2. Team Structure
- **2 ML Engineers**: Data collection, feature engineering, model training, validation, and inference contracts.
- **1 Backend Engineer**: FastAPI core, database integration, external provider pipelines, inference orchestration, and REST APIs.
- **1 Frontend Engineer**: Interactive dashboard, live regional flood map, risk visualization, and alert subscriptions.

---

## 3. Technology Decisions
- **Backend**: Python 3.11.x + FastAPI
- **Database**: PostgreSQL hosted on Supabase
- **ORM / Database Layer**: SQLAlchemy 2.x
- **Database Driver**: psycopg (v3)
- **API Standard**: REST with JSON schemas and OpenAPI/Swagger docs
- **ML Integration**: Embedded directly into backend service layer once trained
- **Frontend**: Communicates via REST APIs over HTTP/JSON

---

## 4. High-Level Architecture
```
Assam Region / Grid Mapping
            ↓
Live Environmental Data Providers (Rainfall, River Gauge Levels, Weather)
            ↓
Backend Ingestion & Feature Aggregation
            ↓
ML Inference Engine (Trained Model)
            ↓
Flood Probability & Risk Scoring (Next ~6 Hours)
            ↓
REST API (FastAPI)
      ↙           ↘
Frontend UI     Alert Service (SMS / Push)
```

---

## 5. Repository Structure
```
project-root/
│
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app entry point, CORS, lifespan
│   │   ├── config.py         # Pydantic Settings configuration
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── router.py     # Centralized API router
│   │   │   └── endpoints/
│   │   │       ├── __init__.py
│   │   │       └── health.py # Health & DB diagnostic endpoints
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── connection.py # SQLAlchemy 2.0 engine & session dependency
│   │   ├── models/           # SQLAlchemy database models (Base declared)
│   │   ├── schemas/          # Pydantic request & response schemas
│   │   ├── services/         # Business logic & service orchestration
│   │   ├── data/             # Ingestion pipelines
│   │   │   └── providers/    # Third-party weather / river APIs
│   │   ├── ml/               # Model inference integration wrapper
│   │   ├── alerts/           # Alert & notification services
│   │   └── jobs/             # Scheduled tasks and cron workers
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py    # Pytest test suite
│   ├── requirements.txt      # Core backend dependencies
│   ├── .env.example          # Generic environment template
│   └── README.md             # Backend setup & development guide
│
├── frontend/                 # Frontend dashboard application (upcoming)
│   └── .gitkeep
├── ml/                       # ML exploration, training scripts, notebooks
│   └── .gitkeep
├── data/                     # Raw and processed datasets
│   └── .gitkeep
├── docs/                     # Architectural, API, and ML specifications
│   ├── architecture/
│   │   └── README.md
│   ├── api/
│   │   └── README.md
│   └── ml/
│       └── README.md
├── .gitignore
└── README.md
```

---

## 6. Local Setup Instructions (Backend)

### Step 1: Install Python 3.11
Verify Python 3.11 is installed:
```powershell
py -3.11 --version
```

### Step 2: Create Python Virtual Environment
```powershell
py -3.11 -m venv backend/.venv
```

### Step 3: Activate Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  .\backend\.venv\Scripts\Activate.ps1
  ```
- **macOS / Linux**:
  ```bash
  source backend/.venv/bin/activate
  ```

### Step 4: Install Dependencies
```powershell
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Step 5: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
copy backend\.env.example backend\.env
```
*(On Linux/macOS: `cp backend/.env.example backend/.env`)*

Open `backend/.env` and insert your Supabase PostgreSQL connection string:
```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
ENVIRONMENT=development
API_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:3000","http://127.0.0.1:5173"]
```

### Step 6: Start FastAPI
```powershell
uvicorn app.main:app --app-dir backend --reload --port 8000
```
Server runs at `http://127.0.0.1:8000`.

---

## 7. Health Endpoints & Testing

- **Liveness Health Check**:
  `GET http://127.0.0.1:8000/api/v1/health`
  - Returns: `200 OK` `{"status": "ok"}`
  - **Does NOT require Supabase or external APIs.**
- **Database Health Check**:
  `GET http://127.0.0.1:8000/api/v1/health/db`
  - Returns: `200 OK` `{"status": "ok", "database": "connected"}` if configured and connected.
  - Returns: `503 Service Unavailable` if unconfigured or unreachable.
- **API Documentation**:
  - Swagger UI: `http://127.0.0.1:8000/docs`
  - ReDoc: `http://127.0.0.1:8000/redoc`

### Run Automated Tests
```powershell
pytest backend/tests/ -v
```

---

## 8. Current Phase: Foundation (Phase 1)
This is strictly the **foundation phase**.

### Intentionally NOT Implemented Yet (Deferred to Future Phases):
- Application database tables (`regions`, `observations`, `predictions`, `users`, `alerts`)
- ML model training, feature preprocessing, or inference
- Flood risk calculation and prediction logic
- Weather / rainfall / water-level API integrations
- Alert and SMS notifications
- Background scheduler / Celery / Redis
- Frontend components
- Authentication and user management

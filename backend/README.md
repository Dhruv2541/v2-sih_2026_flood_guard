# Backend Foundation - Live Flood Risk Prediction API

## Overview
This directory contains the Python / FastAPI backend foundation for the 6-day Smart India Hackathon (SIH) prototype predicting live flood risks for regions/grids in Assam, India.

## Technical Specifications
- **Python Version**: `Python 3.11.x` (ensures long-term compatibility with future ML libraries)
- **Framework**: `FastAPI` (REST APIs)
- **Database**: PostgreSQL hosted on `Supabase`
- **ORM / Database Layer**: `SQLAlchemy 2.x`
- **PostgreSQL Driver**: `psycopg` (v3 with binary wheels)
- **Configuration Management**: `pydantic-settings`
- **Testing**: `pytest` + `httpx`

---

## Getting Started (Local Development)

### 1. Prerequisites
Ensure **Python 3.11.x** is installed on your machine:
```bash
python --version
# or on Windows with py launcher:
py -3.11 --version
```

### 2. Create the Virtual Environment
Navigate to the repository root and create a dedicated virtual environment inside the `backend` directory:

On Windows (PowerShell):
```powershell
py -3.11 -m venv backend/.venv
```

On macOS / Linux:
```bash
python3.11 -m venv backend/.venv
```

### 3. Activate the Virtual Environment
On Windows (PowerShell):
```powershell
.\backend\.venv\Scripts\Activate.ps1
```

On macOS / Linux:
```bash
source backend/.venv/bin/activate
```

### 4. Install Dependencies
```powershell
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 5. Configure Environment Variables
Copy the generic example environment file to `.env`:
```powershell
copy backend\.env.example backend\.env
```
*(On Linux/macOS: `cp backend/.env.example backend/.env`)*

Open `backend/.env` and configure your credentials:
```env
ENVIRONMENT=development
API_PREFIX=/api/v1
DATABASE_URL=postgresql+psycopg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:3000","http://127.0.0.1:5173"]
```
> [!NOTE]
> Obtain the PostgreSQL connection string directly from your **Supabase Dashboard**:
> `Project Settings -> Database -> Connection string -> URI` (select Connection pooling or direct 5432, and ensure protocol prefix is `postgresql+psycopg://`).

### 6. Start the FastAPI Development Server
From the repository root:
```powershell
uvicorn app.main:app --app-dir backend --reload --port 8000
```
The server will start at `http://127.0.0.1:8000`.

---

## Health & Diagnostic Endpoints

### Application Health Check (No Supabase Dependency)
Confirms that the FastAPI process is running and responsive. Does **not** require database credentials or network access to Supabase:
- **URL**: `http://127.0.0.1:8000/api/v1/health`
- **Expected Response**: `200 OK`
```json
{
  "status": "ok"
}
```

### Database Connectivity Check (Requires Supabase Credentials)
Explicitly tests connectivity to your Supabase PostgreSQL instance:
- **URL**: `http://127.0.0.1:8000/api/v1/health/db`
- **Connected Response**: `200 OK`
```json
{
  "status": "ok",
  "database": "connected"
}
```
- **Disconnected / Unconfigured Response**: `503 Service Unavailable`
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "Database connection string is not configured or contains placeholder values."
}
```

---

## Interactive API Documentation
With the server running, visit:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Running Automated Tests
Run tests with `pytest`:
```powershell
pytest backend/tests/ -v
```

---

## Scope of Phase 1 (Foundation)
This phase establishes strictly the backend foundation and developer ergonomics. The following are intentionally deferred:
- Database tables and schemas (`regions`, `observations`, `predictions`, `users`, `alerts`)
- ML model training, preprocessing, or inference
- Weather / rainfall / water-level API ingestion
- Alerts / SMS notifications
- Background scheduler / Celery / Redis
- Frontend components

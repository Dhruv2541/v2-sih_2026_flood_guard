# Architecture Overview - Live Flood Risk Prediction (Assam, India)

## 1. System Vision
The goal of this system is to deliver live flood risk predictions for regions/grids across Assam, India, for the Smart India Hackathon (SIH).

The high-level data and control flow will be:
```
Assam Region / Grid Mapping
            ↓
Live Environmental Data Providers (Rainfall, Water Levels, Weather)
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

## 2. Layer Separation of Concerns

The backend follows a strict separation of concerns to enable seamless collaboration across team members:

- **API Layer (`app/api/`)**:
  - Handles incoming HTTP requests, route definitions, and parameter validation.
  - Delegates all computational logic to services.
  - Returns standardized JSON responses.

- **Database Layer (`app/database/`)**:
  - Manages database engine life-cycle, connection pooling (`pool_pre_ping=True`), and transactional session generators (`get_db`).
  - Connects to Supabase-managed PostgreSQL via SQLAlchemy 2.0 and `psycopg`.
  - Fully decoupled: missing or invalid credentials do NOT crash application startup.

- **Models Layer (`app/models/`)**:
  - Contains SQLAlchemy declarative models mapped to PostgreSQL tables.
  - In Phase 1, only the base metadata (`DeclarativeBase`) is initialized; entity tables are deferred until ML and data contracts are finalized.

- **Schemas Layer (`app/schemas/`)**:
  - Contains Pydantic models for request bodies and response serialization.

- **Services Layer (`app/services/`)**:
  - Coordinates business logic, invoking ML inference, orchestrating database transactions, and computing risk assessments.

- **Data Providers Layer (`app/data/providers/`)**:
  - Interfaces with external weather, rainfall, and water level APIs.

- **ML Layer (`app/ml/`)**:
  - Encapsulates model loading, feature scaling/formatting, and batch or real-time inference.

- **Alerts Layer (`app/alerts/`)**:
  - Encapsulates alert threshold evaluation and notification dispatch (SMS, webhooks).

- **Jobs Layer (`app/jobs/`)**:
  - Handles scheduled ingestion and automated prediction updates.

## 3. Phase 1 Scope vs Future Phases

- **Phase 1 (Foundation)**:
  - Clean project layout and package structure.
  - FastAPI bootstrap with lifespan logging.
  - Centralized routing with `/api/v1/health` and `/api/v1/health/db`.
  - Pydantic Settings with generic environment configuration.
  - Resilient Supabase PostgreSQL connection management.
  - Test suite with Pytest.

- **Deferred to Later Phases**:
  - Application database tables (`regions`, `observations`, `predictions`, `users`, `alerts`).
  - ML model loading, training, and inference.
  - External weather/river sensor integrations.
  - Alerts and SMS dispatching.
  - Background scheduler and jobs.
  - Frontend dashboard implementation.

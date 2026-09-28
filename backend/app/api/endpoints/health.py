from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.database.connection import check_db_connection

router = APIRouter()


@router.get(
    "/health",
    summary="Application Health Check",
    description="Confirms that the FastAPI backend process is operational. Independent of external services.",
    status_code=status.HTTP_200_OK,
)
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get(
    "/health/db",
    summary="Database Connectivity Check",
    description="Tests connectivity to the PostgreSQL/Supabase database.",
)
def database_health_check() -> JSONResponse:
    is_connected, message = check_db_connection()
    if is_connected:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": "ok", "database": "connected"},
        )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "error",
            "database": "disconnected",
            "message": message,
        },
    )

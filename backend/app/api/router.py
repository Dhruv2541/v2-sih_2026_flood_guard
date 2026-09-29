from fastapi import APIRouter
from app.api.endpoints import health, predictions

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(predictions.router, tags=["Predictions"])

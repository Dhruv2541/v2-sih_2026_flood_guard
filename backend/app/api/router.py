from fastapi import APIRouter
from app.api.endpoints import health, prediction

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(prediction.router, tags=["Prediction"])
from fastapi import APIRouter
from app.api.endpoints import health, predictions, regions, observations, prediction

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(predictions.router, tags=["Predictions"])
api_router.include_router(regions.router, tags=["Regions"])
api_router.include_router(observations.router, tags=["Observations"])
api_router.include_router(prediction.router, tags=["ML Inference"])
from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.config import settings

# Configure basic application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("flood_guard")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(f"Starting {settings.PROJECT_NAME} in '{settings.ENVIRONMENT}' mode...")
    logger.info(f"API Prefix: {settings.API_PREFIX}")
    logger.info(f"Allowed CORS Origins: {settings.CORS_ORIGINS}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Live Flood Risk Prediction API for Assam, India (SIH Prototype).",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include Centralized API Router
app.include_router(api_router, prefix=settings.API_PREFIX)

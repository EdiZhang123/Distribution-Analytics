"""
Main API router.

Registers all sub-routers for distribution analytics endpoints.
Add new feature routers here as they are implemented.
"""

from fastapi import APIRouter

from backend.api.datasets import router as datasets_router

router = APIRouter()

router.include_router(datasets_router, prefix="/datasets", tags=["datasets"])


@router.get("/ping", tags=["meta"])
def ping():
    """Liveness check for the API layer."""
    return {"message": "pong"}

"""
Main API router.

Registers all sub-routers for distribution analytics endpoints.
Add new feature routers here as they are implemented.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/ping", tags=["meta"])
def ping():
    """Liveness check for the API layer."""
    return {"message": "pong"}

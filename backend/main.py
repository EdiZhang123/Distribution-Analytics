"""
FastAPI application entry point.

Sets up CORS for the Vite dev server, mounts the API router,
and exposes a top-level health check.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.router import router

app = FastAPI(
    title="Distribution Analytics Engine",
    description=(
        "A platform for comparing, monitoring, and explaining "
        "differences between data distributions."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health", tags=["meta"])
def health_check():
    """Returns service liveness status. No dependencies checked here."""
    return {"status": "ok"}

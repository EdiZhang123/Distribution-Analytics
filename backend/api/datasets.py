"""
Dataset management API.

Routes (all under the /datasets prefix registered in router.py):
  POST /upload          - upload a CSV or XLSX file
  POST /google-sheet    - ingest a public Google Sheet by URL
  GET  /                - list all stored datasets (summary only)
  GET  /{dataset_name}  - retrieve a dataset with its rows

Error codes used:
  400 - unsupported file type or unparseable content
  404 - dataset not found
  502 - Google Sheets fetch failed
"""

import re
import io

import httpx
import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from backend.services.dataset_store import StoredDataset, dataset_store

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class DatasetSummaryResponse(BaseModel):
    name: str
    columns: list[str]
    numeric_columns: list[str]
    row_count: int
    col_count: int


class DatasetDetailResponse(DatasetSummaryResponse):
    rows: list[dict]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _dataframe_to_stored(name: str, df: pd.DataFrame) -> StoredDataset:
    """
    Convert a parsed DataFrame into a StoredDataset.

    Numeric columns are those where pandas infers a numeric dtype.
    Rows are serialized as plain dicts; non-JSON-serializable values
    (NaT, NaN) are converted to None so downstream responses are clean.
    """
    columns = list(df.columns)
    numeric_columns = list(df.select_dtypes(include="number").columns)

    # Replace NaN/NaT with None for clean JSON serialisation
    rows = df.where(pd.notnull(df), other=None).to_dict(orient="records")

    return StoredDataset(
        name=name,
        columns=columns,
        numeric_columns=numeric_columns,
        rows=rows,
        row_count=len(df),
        col_count=len(columns),
    )


def _stored_to_summary(ds: StoredDataset) -> DatasetSummaryResponse:
    return DatasetSummaryResponse(
        name=ds.name,
        columns=ds.columns,
        numeric_columns=ds.numeric_columns,
        row_count=ds.row_count,
        col_count=ds.col_count,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/upload", response_model=DatasetSummaryResponse, status_code=201)
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_name: str = Form(...),
) -> DatasetSummaryResponse:
    """
    Parse an uploaded CSV or XLSX file and store it.

    The dataset_name is used as the store key; uploading with an existing
    name overwrites the previous dataset.
    """
    content = await file.read()
    filename = file.filename or ""
    content_type = file.content_type or ""

    is_csv = filename.endswith(".csv") or "csv" in content_type
    is_xlsx = filename.endswith(".xlsx") or filename.endswith(".xls") or (
        "spreadsheet" in content_type or "excel" in content_type
    )

    try:
        if is_csv:
            df = pd.read_csv(io.BytesIO(content))
        elif is_xlsx:
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported file type '{filename}'. "
                    "Only .csv and .xlsx files are accepted."
                ),
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse file: {exc}",
        ) from exc

    stored = _dataframe_to_stored(dataset_name, df)
    dataset_store.save(stored)
    return _stored_to_summary(stored)


class GoogleSheetRequest(BaseModel):
    url: str
    dataset_name: str


@router.post("/google-sheet", response_model=DatasetSummaryResponse, status_code=201)
async def ingest_google_sheet(body: GoogleSheetRequest) -> DatasetSummaryResponse:
    """
    Fetch a public Google Sheet by URL and store it as a dataset.

    Supports both /edit and /pub URLs.  The sheet ID and optional gid are
    extracted via regex; the sheet is downloaded as CSV via Google's export
    endpoint.

    The sheet must be publicly accessible ("Anyone with the link can view").
    """
    # Extract spreadsheet ID and optional gid from a variety of Google Sheets URL formats
    sheet_id_match = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", body.url)
    if not sheet_id_match:
        raise HTTPException(
            status_code=400,
            detail="Could not extract a Google Sheets spreadsheet ID from the URL.",
        )
    sheet_id = sheet_id_match.group(1)

    gid_match = re.search(r"[?&#]gid=(\d+)", body.url)
    gid = gid_match.group(1) if gid_match else "0"

    export_url = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/export?format=csv&gid={gid}"
    )

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            response = await client.get(export_url)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Google Sheets returned HTTP {exc.response.status_code}. "
                "Ensure the sheet is publicly accessible."
            ),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch Google Sheet: {exc}",
        ) from exc

    try:
        df = pd.read_csv(io.BytesIO(response.content))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse Google Sheet CSV export: {exc}",
        ) from exc

    stored = _dataframe_to_stored(body.dataset_name, df)
    dataset_store.save(stored)
    return _stored_to_summary(stored)


@router.get("/", response_model=list[DatasetSummaryResponse])
def list_datasets() -> list[DatasetSummaryResponse]:
    """Return summary metadata for all stored datasets."""
    return [_stored_to_summary(ds) for ds in dataset_store.list_all()]


@router.get("/{dataset_name}", response_model=DatasetDetailResponse)
def get_dataset(dataset_name: str) -> DatasetDetailResponse:
    """Return full dataset including all rows."""
    ds = dataset_store.get(dataset_name)
    if ds is None:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{dataset_name}' not found.",
        )
    return DatasetDetailResponse(
        name=ds.name,
        columns=ds.columns,
        numeric_columns=ds.numeric_columns,
        row_count=ds.row_count,
        col_count=ds.col_count,
        rows=ds.rows,
    )

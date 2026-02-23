"""
Pydantic schemas for dataset input and validation.

These define the expected shape of data entering the API layer.
No statistical assumptions are made here — validation only.
Callers are responsible for ensuring data is already preprocessed
(normalized, deduped, missing values handled) before submission.
"""

from typing import List

from pydantic import BaseModel, Field


class DatasetPayload(BaseModel):
    """
    Represents a named dataset as a 2D array of float values.

    Shape: (n_samples, n_features). All values must be finite.
    The API does not silently clean NaNs or Infs — it raises on invalid input.
    """

    name: str = Field(..., description="Human-readable identifier for this dataset.")
    data: List[List[float]] = Field(
        ...,
        description=(
            "2D array of shape (n_samples, n_features). "
            "No NaNs or Infs allowed. Caller is responsible for preprocessing."
        ),
    )
    feature_names: List[str] | None = Field(
        default=None,
        description="Optional ordered list of feature names, length must match n_features.",
    )

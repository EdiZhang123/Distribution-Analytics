"""
In-memory dataset store.

WARNING: This is a development-only, non-thread-safe store.
All data lives in process memory and is lost on restart.
Do not use in production or concurrent environments.
"""

from dataclasses import dataclass, field


@dataclass
class StoredDataset:
    """
    A parsed dataset held in memory.

    `rows` contains the raw data as a list of dicts (one per row).
    `numeric_columns` is the subset of `columns` whose values are all numeric —
    determined at parse time by the caller, not inferred here.
    """

    name: str
    columns: list[str]
    numeric_columns: list[str]
    rows: list[dict]
    row_count: int
    col_count: int


class DatasetStore:
    """
    Simple dict-backed store for StoredDataset objects.

    Non-thread-safe. Designed for single-process dev use only.
    All mutation and retrieval is synchronous.
    """

    def __init__(self) -> None:
        self._store: dict[str, StoredDataset] = {}

    def save(self, dataset: StoredDataset) -> None:
        """Insert or overwrite a dataset by name."""
        self._store[dataset.name] = dataset

    def get(self, name: str) -> StoredDataset | None:
        """Return the dataset with the given name, or None if not found."""
        return self._store.get(name)

    def list_all(self) -> list[StoredDataset]:
        """Return all stored datasets in insertion order."""
        return list(self._store.values())

    def delete(self, name: str) -> bool:
        """
        Remove a dataset by name.
        Returns True if it existed and was removed, False otherwise.
        """
        if name in self._store:
            del self._store[name]
            return True
        return False


# Module-level singleton.
# Import this in API routes: `from backend.services.dataset_store import dataset_store`
dataset_store = DatasetStore()

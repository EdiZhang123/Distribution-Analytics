import { useState, useEffect, useCallback } from "react";
import axios from "axios";

/**
 * Fetches the list of all stored datasets from GET /api/datasets.
 *
 * Re-fires automatically when `refresh` is incremented. Call
 * `triggerRefresh` (e.g. after a successful upload) to reload the list.
 *
 * @returns {{ datasets: Array, loading: boolean, error: string|null, triggerRefresh: () => void }}
 */
export function useDatasetList() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefresh((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchList() {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get("/api/datasets");
        if (!cancelled) {
          setDatasets(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err.response?.data?.detail ?? err.message ?? "Unknown error";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchList();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { datasets, loading, error, triggerRefresh };
}

/**
 * Fetches full dataset detail (including rows) from GET /api/datasets/{name}.
 *
 * Only fires when `name` is non-null/non-empty.
 * Re-fires automatically when `name` changes.
 *
 * @param {string|null} name  - Dataset name to fetch
 * @returns {{ dataset: Object|null, loading: boolean, error: string|null }}
 */
export function useDatasetDetail(name) {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!name) {
      setDataset(null);
      return;
    }

    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/datasets/${encodeURIComponent(name)}`);
        if (!cancelled) {
          setDataset(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err.response?.data?.detail ?? err.message ?? "Unknown error";
          setError(message);
          setDataset(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [name]);

  return { dataset, loading, error };
}

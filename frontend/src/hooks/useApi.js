import { useState, useCallback } from "react";
import axios from "axios";

/**
 * Generic hook for making API requests to the FastAPI backend.
 *
 * Returns { data, loading, error, execute } where `execute` triggers the
 * request. The hook does not fire automatically — callers decide when to fetch.
 * Errors are surfaced explicitly rather than silently swallowed.
 *
 * @param {string} method  - HTTP method: "get" | "post" | "put" | "delete"
 * @param {string} url     - API path, e.g. "/api/ping"
 * @returns {{ data, loading, error, execute }}
 */
export function useApi(method, url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (body = null) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios({ method, url, data: body });
        setData(response.data);
        return response.data;
      } catch (err) {
        const message =
          err.response?.data?.detail ?? err.message ?? "Unknown error";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [method, url]
  );

  return { data, loading, error, execute };
}

import React, { useState } from "react";

/**
 * Shows dataset metadata and, for file uploads, re-parse controls.
 *
 * @param {Object}   dataset    - Full dataset object from the API
 * @param {Function} onReparse  - Called with (datasetName, hasHeader, interpretation)
 */
export default function DatasetDetailsPanel({ dataset, onReparse }) {
  const [hasHeader, setHasHeader] = useState(dataset.has_header ?? true);
  const [interpretation, setInterpretation] = useState(
    dataset.interpretation ?? "tabular"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleReparse() {
    setLoading(true);
    setError(null);
    try {
      await onReparse(dataset.name, hasHeader, interpretation);
    } catch (err) {
      const message =
        err.response?.data?.detail ?? err.message ?? "Re-parse failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Metadata grid */}
      <div className="details-grid">
        <span className="details-grid__label">Name</span>
        <span className="details-grid__value">{dataset.name}</span>

        <span className="details-grid__label">Rows</span>
        <span className="details-grid__value">
          {dataset.row_count?.toLocaleString()}
        </span>

        <span className="details-grid__label">Columns</span>
        <span className="details-grid__value">{dataset.col_count}</span>

        <span className="details-grid__label">All columns</span>
        <span className="details-grid__value">
          {(dataset.columns ?? []).join(", ") || "—"}
        </span>

        <span className="details-grid__label">Numeric columns</span>
        <span className="details-grid__value">
          {(dataset.numeric_columns ?? []).join(", ") || "—"}
        </span>

        <span className="details-grid__label">Type</span>
        <span className="details-grid__value">
          {dataset.interpretation ?? "tabular"}
        </span>
      </div>

      {/* Re-parse controls — only for file uploads */}
      {dataset.is_file_upload && (
        <>
          <hr className="details-divider" />

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <span
              className="form-label"
              style={{ fontWeight: 600, marginBottom: 0 }}
            >
              Re-parse settings
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <input
                id="details-has-header"
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
              />
              <label
                htmlFor="details-has-header"
                className="form-label"
                style={{ marginBottom: 0 }}
              >
                File has a header row
              </label>
            </div>

            <div>
              <span className="form-label">Data format</span>
              <div style={{ display: "flex", gap: "var(--space-5)", marginTop: "var(--space-1)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="details-interpretation"
                    value="tabular"
                    checked={interpretation === "tabular"}
                    onChange={() => setInterpretation("tabular")}
                  />
                  Tabular
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="details-interpretation"
                    value="point_cloud"
                    checked={interpretation === "point_cloud"}
                    onChange={() => setInterpretation("point_cloud")}
                  />
                  Point cloud
                </label>
              </div>
            </div>

            {!hasHeader && interpretation === "point_cloud" && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontStyle: "italic", margin: 0 }}>
                Columns named automatically: 2 cols → x, y &nbsp;|&nbsp; 3 cols → x, y, z &nbsp;|&nbsp; more → dim_0, dim_1, …
              </p>
            )}

            {error && (
              <p style={{ color: "var(--error)", fontSize: "var(--text-xs)", margin: 0 }}>
                {error}
              </p>
            )}

            <div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleReparse}
                disabled={loading}
              >
                {loading ? "Re-parsing…" : "Re-apply"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState } from "react";
import PlotlyChart from "../charts/PlotlyChart";
import DataUploader from "../components/DataUploader";
import { useDatasetList, useDatasetDetail } from "../hooks/useDatasets";

/**
 * Home page.
 *
 * Layout:
 *   1. DataUploader — upload CSV, XLSX, or Google Sheet
 *   2. Dataset list — clickable cards showing name + row/col counts
 *   3. When a dataset is selected:
 *        - Column selector (numeric columns only)
 *        - Histogram of the selected column via PlotlyChart
 */
export default function HomePage() {
  const { datasets, loading: listLoading, error: listError, triggerRefresh } =
    useDatasetList();

  const [selectedDatasetName, setSelectedDatasetName] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);

  const { dataset, loading: detailLoading, error: detailError } =
    useDatasetDetail(selectedDatasetName);

  function handleSelectDataset(name) {
    if (name === selectedDatasetName) {
      // Deselect on second click
      setSelectedDatasetName(null);
      setSelectedColumn(null);
    } else {
      setSelectedDatasetName(name);
      setSelectedColumn(null);
    }
  }

  function handleColumnChange(event) {
    setSelectedColumn(event.target.value || null);
  }

  // Extract numeric values for the histogram from the loaded dataset rows
  const histogramValues =
    dataset && selectedColumn
      ? dataset.rows
          .map((row) => row[selectedColumn])
          .filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)))
          .map(Number)
      : null;

  const histogramData = histogramValues
    ? [
        {
          x: histogramValues,
          type: "histogram",
          name: selectedColumn,
          marker: { color: "#2c5282", opacity: 0.75 },
        },
      ]
    : null;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Distribution Analytics Engine</h1>
      </header>

      <DataUploader onUploadSuccess={triggerRefresh} />

      {/* Dataset list */}
      <section className="content-section">
        <h2 className="section-heading">Datasets</h2>

        {listLoading && <p className="text-muted">Loading datasets…</p>}
        {listError && <p className="text-error">Error: {listError}</p>}

        {!listLoading && datasets.length === 0 && (
          <p className="text-muted">No datasets yet. Upload one above.</p>
        )}

        <div className="card-grid">
          {datasets.map((ds) => (
            <button
              key={ds.name}
              onClick={() => handleSelectDataset(ds.name)}
              className={`dataset-card${selectedDatasetName === ds.name ? " dataset-card--selected" : ""}`}
              type="button"
            >
              <span className="dataset-card__name">{ds.name}</span>
              <span className="dataset-card__meta">
                {ds.row_count.toLocaleString()} rows × {ds.col_count} cols
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Dataset detail + histogram */}
      {selectedDatasetName && (
        <section className="content-section detail-section">
          {detailLoading && <p className="text-muted">Loading dataset…</p>}
          {detailError && <p className="text-error">Error: {detailError}</p>}

          {dataset && (
            <>
              <h2 className="section-heading">{dataset.name}</h2>

              {dataset.numeric_columns.length === 0 ? (
                <p className="text-muted">
                  No numeric columns found in this dataset.
                </p>
              ) : (
                <>
                  <div className="selector-row">
                    <div className="form-field">
                      <label className="form-label" htmlFor="column-select">
                        Column
                      </label>
                      <select
                        id="column-select"
                        value={selectedColumn ?? ""}
                        onChange={handleColumnChange}
                        className="form-input form-select"
                      >
                        <option value="">— select a column —</option>
                        {dataset.numeric_columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {histogramData && (
                    <PlotlyChart
                      data={histogramData}
                      layout={{
                        title: `Distribution of "${selectedColumn}"`,
                        xaxis: { title: selectedColumn },
                        yaxis: { title: "Count" },
                        bargap: 0.05,
                        paper_bgcolor: "#f7f6f2",
                        plot_bgcolor: "#f7f6f2",
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}

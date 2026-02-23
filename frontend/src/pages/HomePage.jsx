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
          marker: { color: "#0070f3", opacity: 0.8 },
        },
      ]
    : null;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Distribution Analytics Engine</h1>

      <DataUploader onUploadSuccess={triggerRefresh} />

      {/* Dataset list */}
      <section>
        <h2 style={styles.sectionHeading}>Datasets</h2>

        {listLoading && <p style={styles.muted}>Loading datasets…</p>}
        {listError && <p style={styles.error}>Error: {listError}</p>}

        {!listLoading && datasets.length === 0 && (
          <p style={styles.muted}>No datasets yet. Upload one above.</p>
        )}

        <div style={styles.cardGrid}>
          {datasets.map((ds) => (
            <button
              key={ds.name}
              onClick={() => handleSelectDataset(ds.name)}
              style={{
                ...styles.card,
                ...(selectedDatasetName === ds.name ? styles.cardSelected : {}),
              }}
              type="button"
            >
              <span style={styles.cardName}>{ds.name}</span>
              <span style={styles.cardMeta}>
                {ds.row_count.toLocaleString()} rows × {ds.col_count} cols
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Dataset detail + histogram */}
      {selectedDatasetName && (
        <section style={styles.detailSection}>
          {detailLoading && <p style={styles.muted}>Loading dataset…</p>}
          {detailError && <p style={styles.error}>Error: {detailError}</p>}

          {dataset && (
            <>
              <h2 style={styles.sectionHeading}>{dataset.name}</h2>

              {dataset.numeric_columns.length === 0 ? (
                <p style={styles.muted}>
                  No numeric columns found in this dataset.
                </p>
              ) : (
                <>
                  <div style={styles.selectorRow}>
                    <label style={styles.selectLabel} htmlFor="column-select">
                      Column:
                    </label>
                    <select
                      id="column-select"
                      value={selectedColumn ?? ""}
                      onChange={handleColumnChange}
                      style={styles.select}
                    >
                      <option value="">— select a column —</option>
                      {dataset.numeric_columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  {histogramData && (
                    <PlotlyChart
                      data={histogramData}
                      layout={{
                        title: `Distribution of "${selectedColumn}"`,
                        xaxis: { title: selectedColumn },
                        yaxis: { title: "Count" },
                        bargap: 0.05,
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "1.5rem 1rem",
    fontFamily: "sans-serif",
  },
  title: {
    marginBottom: "1.5rem",
  },
  sectionHeading: {
    marginBottom: "0.75rem",
    fontSize: "1.15rem",
  },
  muted: {
    color: "#666",
    fontSize: "0.9rem",
  },
  error: {
    color: "#c00",
    fontSize: "0.9rem",
  },
  cardGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "0.75rem 1rem",
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "#fafafa",
    cursor: "pointer",
    textAlign: "left",
    minWidth: 160,
  },
  cardSelected: {
    border: "2px solid #0070f3",
    background: "#e8f0fe",
  },
  cardName: {
    fontWeight: 600,
    fontSize: "0.95rem",
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: "0.8rem",
    color: "#555",
  },
  detailSection: {
    marginTop: "1.5rem",
  },
  selectorRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  selectLabel: {
    fontWeight: 500,
    fontSize: "0.9rem",
  },
  select: {
    padding: "0.35rem 0.6rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: "0.9rem",
  },
};

import React, { useState, useEffect } from "react";
import axios from "axios";
import PlotlyChart from "../charts/PlotlyChart";
import DataUploader from "../components/DataUploader";
import HoverTooltip from "../components/HoverTooltip";
import ConfirmModal from "../components/ConfirmModal";
import ColumnSelector from "../components/ColumnSelector";
import DatasetDetailsPanel from "../components/DatasetDetailsPanel";
import { useDatasetList, useMultipleDatasetsDetail } from "../hooks/useDatasets";

const COMPARISON_COLORS = ["#2c5282", "#9b2335", "#276749", "#744210", "#553c9a"];

/**
 * Home page.
 *
 * Layout:
 *   1. DataUploader — upload CSV, XLSX, or Google Sheet
 *   2. Dataset list — clickable cards; click to toggle selection (multi-select)
 *   3. When datasets are selected:
 *        - Details panel (single dataset) with metadata + re-parse
 *        - Column selector (checkbox-based, 1-3 axes)
 *        - Chart: 1 col → histogram, 2 cols → 2D scatter, 3 cols → 3D scatter
 *        - Multi-dataset → histogram comparison (max 1 column)
 *   4. HoverTooltip — fixed-position LaTeX overlay on chart hover
 */
export default function HomePage() {
  const { datasets, loading: listLoading, error: listError, triggerRefresh } =
    useDatasetList();

  const [selectedDatasetNames, setSelectedDatasetNames] = useState(new Set());
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [hoverState, setHoverState] = useState({ visible: false, x: 0, y: 0, point: null });
  const [normalizeData, setNormalizeData] = useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const datasetMap = useMultipleDatasetsDetail(Array.from(selectedDatasetNames));

  // Only include datasets that have successfully loaded
  const loadedDatasets = Array.from(selectedDatasetNames)
    .map((name) => datasetMap.get(name)?.dataset)
    .filter(Boolean);

  const singleDataset = loadedDatasets.length === 1 ? loadedDatasets[0] : null;
  const isMultiDataset = loadedDatasets.length > 1;

  // Auto-populate columns for point-cloud datasets with x/y/z
  useEffect(() => {
    if (!singleDataset) return;
    const allColumns = singleDataset.columns ?? [];
    const xCol = allColumns.find((c) => c.toLowerCase() === "x");
    const yCol = allColumns.find((c) => c.toLowerCase() === "y");
    const zCol = allColumns.find((c) => c.toLowerCase() === "z");
    if (xCol && yCol && zCol) {
      setSelectedColumns([xCol, yCol, zCol]);
    }
  }, [singleDataset?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleToggleDataset(name) {
    setSelectedDatasetNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
    setSelectedColumns([]);
  }

  async function handleDeleteDataset(name) {
    try {
      await axios.delete(`/api/datasets/${encodeURIComponent(name)}`);
      setSelectedDatasetNames((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
      triggerRefresh();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async function handleReparse(datasetName, hasHeader, interpretation) {
    await axios.patch(`/api/datasets/${encodeURIComponent(datasetName)}/settings`, {
      has_header: hasHeader,
      interpretation,
    });
    // Deselect so the detail view re-fetches fresh data on next click
    setSelectedDatasetNames((prev) => {
      const next = new Set(prev);
      next.delete(datasetName);
      return next;
    });
    setSelectedColumns([]);
    triggerRefresh();
  }

  function handleHoverData({ cursorX, cursorY, point }) {
    setHoverState({ visible: true, x: cursorX, y: cursorY, point });
  }

  function handleUnhoverData() {
    setHoverState((prev) => ({ ...prev, visible: false }));
  }

  // ---- Shared numeric columns ----
  let sharedNumericColumns = [];
  if (loadedDatasets.length > 1) {
    sharedNumericColumns = loadedDatasets.reduce((acc, ds, i) => {
      if (i === 0) return ds.numeric_columns ?? [];
      const dsSet = new Set(ds.numeric_columns ?? []);
      return acc.filter((col) => dsSet.has(col));
    }, []);
  } else if (loadedDatasets.length === 1) {
    sharedNumericColumns = loadedDatasets[0].numeric_columns ?? [];
  }

  const noSharedColumns = loadedDatasets.length > 1 && sharedNumericColumns.length === 0;
  const maxColumns = isMultiDataset ? 1 : 3;

  function standardize(values) {
    if (values.length === 0) return values;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    if (standardDeviation === 0) return values.map(() => 0);
    return values.map((v) => (v - mean) / standardDeviation);
  }

  // ---- Build chart traces and layout ----
  let chartData = null;
  let chartLayout = null;

  if (selectedColumns.length === 1 && loadedDatasets.length >= 1) {
    const col = selectedColumns[0];
    if (loadedDatasets.length === 1) {
      // Single histogram
      const ds = loadedDatasets[0];
      const rawValues = ds.rows
        .map((row) => row[col])
        .filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)))
        .map(Number);
      const values = normalizeData ? standardize(rawValues) : rawValues;
      chartData = [
        {
          x: values,
          type: "histogram",
          name: col,
          marker: { color: COMPARISON_COLORS[0], opacity: 0.75 },
        },
      ];
      chartLayout = {
        title: `Distribution of "${col}"${normalizeData ? " (standardized)" : ""}`,
        xaxis: { title: normalizeData ? `${col} (z-score)` : col },
        yaxis: { title: "Count" },
        bargap: 0.05,
        paper_bgcolor: "#f7f6f2",
        plot_bgcolor: "#f7f6f2",
      };
    } else {
      // Overlaid histograms for comparison
      chartData = loadedDatasets.map((ds, i) => {
        const rawValues = ds.rows
          .map((row) => row[col])
          .filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)))
          .map(Number);
        const values = normalizeData ? standardize(rawValues) : rawValues;
        return {
          x: values,
          type: "histogram",
          name: ds.name,
          marker: {
            color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
            opacity: 0.6,
          },
        };
      });
      chartLayout = {
        title: `Comparison of "${col}"${normalizeData ? " (standardized)" : ""}`,
        xaxis: { title: normalizeData ? `${col} (z-score)` : col },
        yaxis: { title: "Count" },
        bargap: 0.05,
        barmode: "overlay",
        paper_bgcolor: "#f7f6f2",
        plot_bgcolor: "#f7f6f2",
      };
    }
  } else if (selectedColumns.length === 2 && loadedDatasets.length === 1) {
    // 2D scatter
    const ds = loadedDatasets[0];
    const [xCol, yCol] = selectedColumns;
    const validRows = ds.rows.filter((row) => {
      const xv = row[xCol];
      const yv = row[yCol];
      return (
        xv !== null && xv !== undefined && !Number.isNaN(Number(xv)) &&
        yv !== null && yv !== undefined && !Number.isNaN(Number(yv))
      );
    });
    chartData = [
      {
        x: validRows.map((r) => Number(r[xCol])),
        y: validRows.map((r) => Number(r[yCol])),
        type: "scatter",
        mode: "markers",
        name: ds.name,
        marker: { color: COMPARISON_COLORS[0], size: 5, opacity: 0.75 },
      },
    ];
    chartLayout = {
      title: `${xCol} vs ${yCol}`,
      xaxis: { title: xCol },
      yaxis: { title: yCol },
      paper_bgcolor: "#f7f6f2",
      plot_bgcolor: "#f7f6f2",
    };
  } else if (selectedColumns.length === 3 && loadedDatasets.length === 1) {
    // 3D scatter
    const ds = loadedDatasets[0];
    const [xCol, yCol, zCol] = selectedColumns;
    const validRows = ds.rows.filter((row) => {
      const xv = row[xCol];
      const yv = row[yCol];
      const zv = row[zCol];
      return (
        xv !== null && xv !== undefined && !Number.isNaN(Number(xv)) &&
        yv !== null && yv !== undefined && !Number.isNaN(Number(yv)) &&
        zv !== null && zv !== undefined && !Number.isNaN(Number(zv))
      );
    });
    chartData = [
      {
        x: validRows.map((r) => Number(r[xCol])),
        y: validRows.map((r) => Number(r[yCol])),
        z: validRows.map((r) => Number(r[zCol])),
        type: "scatter3d",
        mode: "markers",
        name: ds.name,
        marker: { color: COMPARISON_COLORS[0], size: 2, opacity: 0.75 },
      },
    ];
    chartLayout = {
      title: `3D Scatter: ${xCol}, ${yCol}, ${zCol}`,
      scene: {
        xaxis: { title: xCol },
        yaxis: { title: yCol },
        zaxis: { title: zCol },
      },
      paper_bgcolor: "#f7f6f2",
      plot_bgcolor: "#f7f6f2",
    };
  }

  const selectionCount = selectedDatasetNames.size;
  const selectedNamesArray = Array.from(selectedDatasetNames);

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Distribution Analytics Engine</h1>
      </header>

      <DataUploader onUploadSuccess={triggerRefresh} />

      {/* Dataset list */}
      <section className="content-section">
        <h2 className="section-heading">
          Datasets
          {selectionCount > 0 && (
            <span className="selection-badge">{selectionCount} selected</span>
          )}
        </h2>

        {listLoading && <p className="text-muted">Loading datasets…</p>}
        {listError && <p className="text-error">Error: {listError}</p>}

        {!listLoading && datasets.length === 0 && (
          <p className="text-muted">No datasets yet. Upload one above.</p>
        )}

        <div className="card-grid">
          {datasets.map((ds) => (
            <div
              key={ds.name}
              role="button"
              tabIndex={0}
              onClick={() => handleToggleDataset(ds.name)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleToggleDataset(ds.name); }}
              className={`dataset-card${selectedDatasetNames.has(ds.name) ? " dataset-card--selected" : ""}`}
            >
              <span className="dataset-card__name">{ds.name}</span>
              <span className="dataset-card__meta">
                {ds.row_count.toLocaleString()} rows × {ds.col_count} cols
              </span>
              <div className="dataset-card__actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="dataset-card__action-btn dataset-card__action-btn--delete"
                  title="Delete dataset"
                  onClick={() => setDeleteTarget(ds.name)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dataset detail + chart */}
      {selectionCount > 0 && (
        <section className="content-section detail-section">
          {/* Per-dataset loading and error states */}
          {selectedNamesArray.map((name) => {
            const entry = datasetMap.get(name);
            if (!entry) return null;
            if (entry.loading) {
              return (
                <p key={name} className="text-muted">
                  Loading {name}…
                </p>
              );
            }
            if (entry.error) {
              return (
                <p key={name} className="text-error">
                  Error loading {name}: {entry.error}
                </p>
              );
            }
            return null;
          })}

          {loadedDatasets.length > 0 && (
            <>
              <h2 className="section-heading">
                {isMultiDataset
                  ? `Comparing ${loadedDatasets.length} datasets`
                  : loadedDatasets[0].name}
              </h2>

              {/* Details panel — single dataset only */}
              {singleDataset && (
                <DatasetDetailsPanel
                  dataset={singleDataset}
                  onReparse={handleReparse}
                />
              )}

              {noSharedColumns ? (
                <p className="text-muted">
                  No shared numeric columns found across the selected datasets.
                </p>
              ) : sharedNumericColumns.length === 0 ? (
                <p className="text-muted">
                  No numeric columns found in this dataset.
                </p>
              ) : (
                <>
                  <ColumnSelector
                    columns={sharedNumericColumns}
                    selectedColumns={selectedColumns}
                    onChange={setSelectedColumns}
                    maxColumns={maxColumns}
                  />

                  {selectedColumns.length === 1 && loadedDatasets.length >= 1 && (
                    <label className="normalize-toggle">
                      <input
                        type="checkbox"
                        checked={normalizeData}
                        onChange={(e) => setNormalizeData(e.target.checked)}
                      />
                      Normalize (subtract mean, divide by std)
                    </label>
                  )}

                  {chartData && (
                    <PlotlyChart
                      data={chartData}
                      layout={chartLayout}
                      onHoverData={handleHoverData}
                      onUnhoverData={handleUnhoverData}
                    />
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}

      <HoverTooltip {...hoverState} />

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete dataset"
        message={`Are you sure you want to delete "${deleteTarget}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={async () => {
          const name = deleteTarget;
          setDeleteTarget(null);
          await handleDeleteDataset(name);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

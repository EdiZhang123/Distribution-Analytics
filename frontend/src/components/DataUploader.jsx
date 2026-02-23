import React, { useState } from "react";
import axios from "axios";

const TABS = ["CSV", "XLSX", "Google Sheet"];

/**
 * DataUploader
 *
 * Provides a tabbed interface for uploading datasets:
 *   - CSV / XLSX: file picker + dataset name field
 *   - Google Sheet: URL text input + dataset name field
 *
 * On successful upload, calls `onUploadSuccess()` so the parent can
 * refresh its dataset list.
 *
 * All API errors are surfaced explicitly in red below the form.
 *
 * @param {{ onUploadSuccess: () => void }} props
 */
export default function DataUploader({ onUploadSuccess }) {
  const [activeTab, setActiveTab] = useState("CSV");
  const [file, setFile] = useState(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [datasetName, setDatasetName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  function handleFileChange(event) {
    const selected = event.target.files[0] ?? null;
    setFile(selected);
    // Auto-populate dataset name from filename (strip extension)
    if (selected) {
      const nameWithoutExt = selected.name.replace(/\.[^.]+$/, "");
      setDatasetName(nameWithoutExt);
    }
    setError(null);
    setSuccessMessage(null);
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setFile(null);
    setSheetUrl("");
    setDatasetName("");
    setError(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!datasetName.trim()) {
      setError("Dataset name is required.");
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "Google Sheet") {
        if (!sheetUrl.trim()) {
          setError("Google Sheet URL is required.");
          setLoading(false);
          return;
        }
        await axios.post("/api/datasets/google-sheet", {
          url: sheetUrl.trim(),
          dataset_name: datasetName.trim(),
        });
      } else {
        if (!file) {
          setError("Please select a file.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("dataset_name", datasetName.trim());
        await axios.post("/api/datasets/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccessMessage(`Dataset "${datasetName.trim()}" uploaded successfully.`);
      setFile(null);
      setSheetUrl("");
      setDatasetName("");
      onUploadSuccess();
    } catch (err) {
      const message =
        err.response?.data?.detail ?? err.message ?? "Upload failed.";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setLoading(false);
    }
  }

  const isFileTab = activeTab === "CSV" || activeTab === "XLSX";
  const fileAccept = activeTab === "CSV" ? ".csv" : ".xlsx,.xls";

  return (
    <section className="card uploader-card">
      <h2 className="uploader-heading">Upload Dataset</h2>

      {/* Segmented tab selector */}
      <div className="segmented-control" role="tablist" style={{ marginBottom: "var(--space-5)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => handleTabChange(tab)}
            className={`segmented-tab${activeTab === tab ? " segmented-tab--active" : ""}`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* File input or URL input depending on tab */}
        {isFileTab ? (
          <div className="form-field">
            <span className="form-label">{activeTab} file</span>
            <div className="file-drop-zone">
              <label className="file-drop-label" htmlFor="file-upload">
                <span className="file-drop-icon">↑</span>
                <span className="file-drop-text">
                  {file ? file.name : `Choose a ${activeTab} file`}
                </span>
                <span className="file-drop-hint">or drag and drop</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept={fileAccept}
                onChange={handleFileChange}
                className="file-input-hidden"
              />
            </div>
          </div>
        ) : (
          <div className="form-field">
            <label className="form-label" htmlFor="sheet-url">Google Sheet URL</label>
            <input
              id="sheet-url"
              type="url"
              value={sheetUrl}
              onChange={(e) => {
                setSheetUrl(e.target.value);
                setError(null);
                setSuccessMessage(null);
              }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="form-input"
            />
          </div>
        )}

        {/* Dataset name */}
        <div className="form-field">
          <label className="form-label" htmlFor="dataset-name">Dataset name</label>
          <input
            id="dataset-name"
            type="text"
            value={datasetName}
            onChange={(e) => {
              setDatasetName(e.target.value);
              setError(null);
              setSuccessMessage(null);
            }}
            placeholder="my-dataset"
            className="form-input"
          />
        </div>

        <div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert--error" role="alert" style={{ marginTop: "var(--space-4)" }}>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="alert alert--success" role="status" style={{ marginTop: "var(--space-4)" }}>
          {successMessage}
        </div>
      )}
    </section>
  );
}

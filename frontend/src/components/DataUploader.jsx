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

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Upload Dataset</h2>

      {/* Tab selector */}
      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {}),
            }}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* File input or URL input depending on tab */}
        {isFileTab ? (
          <div style={styles.field}>
            <label style={styles.label}>
              {activeTab} file
              <input
                type="file"
                accept={activeTab === "CSV" ? ".csv" : ".xlsx,.xls"}
                onChange={handleFileChange}
                style={styles.fileInput}
              />
            </label>
          </div>
        ) : (
          <div style={styles.field}>
            <label style={styles.label}>
              Google Sheet URL
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => {
                  setSheetUrl(e.target.value);
                  setError(null);
                  setSuccessMessage(null);
                }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                style={styles.textInput}
              />
            </label>
          </div>
        )}

        {/* Dataset name */}
        <div style={styles.field}>
          <label style={styles.label}>
            Dataset name
            <input
              type="text"
              value={datasetName}
              onChange={(e) => {
                setDatasetName(e.target.value);
                setError(null);
                setSuccessMessage(null);
              }}
              placeholder="my-dataset"
              style={styles.textInput}
            />
          </label>
        </div>

        <button type="submit" disabled={loading} style={styles.submitButton}>
          {loading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}
      {successMessage && <p style={styles.success}>{successMessage}</p>}
    </div>
  );
}

const styles = {
  container: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "1.25rem",
    marginBottom: "1.5rem",
    maxWidth: 520,
  },
  heading: {
    marginTop: 0,
    marginBottom: "0.75rem",
    fontSize: "1.1rem",
  },
  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: "1rem",
  },
  tab: {
    padding: "0.35rem 0.9rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    cursor: "pointer",
    background: "#f5f5f5",
    fontSize: "0.9rem",
  },
  activeTab: {
    background: "#0070f3",
    color: "#fff",
    borderColor: "#0070f3",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  textInput: {
    padding: "0.4rem 0.6rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: "0.9rem",
  },
  fileInput: {
    fontSize: "0.875rem",
  },
  submitButton: {
    padding: "0.5rem 1.25rem",
    background: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.95rem",
    alignSelf: "flex-start",
  },
  error: {
    color: "#c00",
    marginTop: "0.5rem",
    fontSize: "0.875rem",
  },
  success: {
    color: "#1a7f37",
    marginTop: "0.5rem",
    fontSize: "0.875rem",
  },
};

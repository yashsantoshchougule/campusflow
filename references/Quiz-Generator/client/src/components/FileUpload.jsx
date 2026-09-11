import React, { useState } from "react";
import { api } from "../api/client";

export default function FileUpload({ onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function handleFile(file) {
    if (!file) return;

    const allowedTypes = ["pdf", "docx", "pptx", "txt"];
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(ext)) {
      alert("File type not supported. Please upload PDF, DOCX, PPTX, or TXT");
      return;
    }

    setUploading(true);
    try {
      await api.uploadDocument(file);
      alert("Document uploaded successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  return (
    <div
      style={{
        ...styles.dropzone,
        ...(dragActive ? styles.dropzoneActive : {}),
        ...(uploading ? styles.dropzoneDisabled : {}),
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {uploading ? (
        <p>Uploading...</p>
      ) : (
        <>
          <p style={styles.text}>
            📁 Drag & drop a file here, or click to select
          </p>
          <p style={styles.subtext}>
            Supports: PDF, DOCX, PPTX, TXT (max 10MB)
          </p>
          <input
            type="file"
            style={styles.input}
            onChange={(e) => handleFile(e.target.files[0])}
            accept=".pdf,.docx,.pptx,.txt"
          />
        </>
      )}
    </div>
  );
}

const styles = {
  dropzone: {
    border: "2px dashed #ccc",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.3s",
  },
  dropzoneActive: {
    borderColor: "#667eea",
    background: "#f0f4ff",
  },
  dropzoneDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  text: {
    fontSize: "16px",
    marginBottom: "8px",
  },
  subtext: {
    fontSize: "14px",
    color: "#666",
  },
  input: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
};

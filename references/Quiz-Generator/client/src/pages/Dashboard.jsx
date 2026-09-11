import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import FileUpload from "../components/FileUpload";

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  backBtn: {
    background: "#f5f7fa",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  list: {
    marginTop: "32px",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    padding: "40px",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  meta: {
    color: "#666",
    fontSize: "14px",
    marginTop: "8px",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  viewBtn: {
    background: "#f5f7fa",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  generateBtn: {
    background: "#667eea",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
};

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const res = await api.getDocuments();
      setDocuments(res.data);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleUploadSuccess() {
    loadDocuments();
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📚 My Documents</h1>
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          ← Back
        </button>
      </div>

      <FileUpload onSuccess={handleUploadSuccess} />

      <div style={styles.list}>
        {loading ? (
          <p>Loading...</p>
        ) : documents.length === 0 ? (
          <p style={styles.empty}>
            No documents yet. Upload one to get started!
          </p>
        ) : (
          documents.map((doc) => (
            <div key={doc._id} style={styles.card}>
              <div>
                <h3>{doc.filename}</h3>
                <p style={styles.meta}>
                  {doc.fileType.toUpperCase()} • {doc.stats?.blockCount || 0}{" "}
                  blocks •
                  {doc.status === "completed" ? " ✅ Ready" : " ⏳ Processing"}
                </p>
              </div>
              {doc.status === "completed" && (
                <div style={styles.actions}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => navigate(`/docs/${doc._id}`)}
                  >
                    View
                  </button>
                  <button
                    style={styles.generateBtn}
                    onClick={() => navigate(`/docs/${doc._id}/generate`)}
                  >
                    Generate Quiz
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

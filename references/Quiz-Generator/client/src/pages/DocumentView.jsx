import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  backBtn: {
    background: "#f5f7fa",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "24px",
  },
  header: {
    marginBottom: "24px",
  },
  meta: {
    color: "#666",
    marginTop: "8px",
  },
  generateBtn: {
    background: "#667eea",
    color: "white",
    border: "none",
    padding: "14px 28px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    marginBottom: "32px",
  },
  preview: {
    marginTop: "32px",
  },
  block: {
    background: "white",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  sourceRef: {
    color: "#667eea",
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
};

export default function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
  }, [id]);

  async function loadDocument() {
    try {
      const res = await api.getDocument(id);
      setDocument(res.data.document);
      setBlocks(res.data.blocks);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (!document) return <div style={styles.container}>Document not found</div>;

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>

      <div style={styles.header}>
        <h1>{document.filename}</h1>
        <p style={styles.meta}>
          {document.fileType.toUpperCase()} • {document.stats?.blockCount}{" "}
          blocks •{document.stats?.wordCount} words
        </p>
      </div>

      <button
        style={styles.generateBtn}
        onClick={() => navigate(`/docs/${id}/generate`)}
      >
        Generate Quiz from This Document
      </button>

      <div style={styles.preview}>
        <h2>Content Preview (First 10 Blocks)</h2>
        {blocks.map((block) => (
          <div key={block._id} style={styles.block}>
            <div style={styles.sourceRef}>{block.sourceRef}</div>
            <p>{block.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

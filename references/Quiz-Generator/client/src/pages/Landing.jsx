import React from "react";
import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
  },
  content: {
    textAlign: "center",
    color: "white",
    maxWidth: "600px",
  },
  title: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  subtitle: {
    fontSize: "24px",
    marginBottom: "12px",
    opacity: 0.9,
  },
  description: {
    fontSize: "16px",
    marginBottom: "32px",
    opacity: 0.8,
  },
  button: {
    background: "white",
    color: "#667eea",
    border: "none",
    padding: "16px 48px",
    fontSize: "18px",
    fontWeight: "bold",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "40px",
    transition: "transform 0.2s",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    marginTop: "40px",
  },
  feature: {
    background: "rgba(255, 255, 255, 0.2)",
    padding: "12px",
    borderRadius: "8px",
    backdropFilter: "blur(10px)",
  },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>📚 Quiz Generator</h1>
        <p style={styles.subtitle}>
          AI-Powered Quiz Generation from Your Documents
        </p>
        <p style={styles.description}>
          Upload PPTX, PDF, DOCX, or TXT files and generate high-quality quizzes
          with citations
        </p>
        <button style={styles.button} onClick={() => navigate("/dashboard")}>
          Get Started
        </button>
        <div style={styles.features}>
          <div style={styles.feature}>✅ AI-Powered Generation</div>
          <div style={styles.feature}>📖 Citation Tracking</div>
          <div style={styles.feature}>🎯 Quality Verification</div>
          <div style={styles.feature}>⏰ Auto-Expire (24h)</div>
        </div>
      </div>
    </div>
  );
}

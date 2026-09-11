import React, { useState } from "react";

export default function Citation({ citation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.citation}>
      <div style={styles.header} onClick={() => setExpanded(!expanded)}>
        <span style={styles.sourceRef}>📄 {citation.sourceRef}</span>
        <span style={styles.toggle}>{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && <div style={styles.quote}>"{citation.quote}"</div>}
    </div>
  );
}

const styles = {
  citation: {
    marginTop: "8px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    overflow: "hidden",
  },
  header: {
    padding: "12px",
    background: "#fafafa",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceRef: {
    fontWeight: "500",
    color: "#667eea",
  },
  toggle: {
    fontSize: "12px",
    color: "#999",
  },
  quote: {
    padding: "12px",
    fontStyle: "italic",
    background: "white",
    borderTop: "1px solid #e0e0e0",
  },
};

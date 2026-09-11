import React from "react";

export default function ProgressBar({ progress }) {
  return (
    <div style={styles.container}>
      <div style={styles.bar}>
        <div style={{ ...styles.fill, width: `${progress}%` }} />
      </div>
      <p style={styles.text}>{progress}%</p>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
  },
  bar: {
    width: "100%",
    height: "24px",
    background: "#e0e0e0",
    borderRadius: "12px",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    transition: "width 0.5s ease",
  },
  text: {
    textAlign: "center",
    marginTop: "12px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#667eea",
  },
};

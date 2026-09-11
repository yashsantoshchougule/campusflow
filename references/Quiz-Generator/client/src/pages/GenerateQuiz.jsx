import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import ProgressBar from "../components/ProgressBar";

export default function GenerateQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useState({
    count: 10,
    language: "en",
    difficulty: { easy: 4, medium: 4, hard: 2 },
  });
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  async function handleGenerate() {
    const difficultyCount =
      params.difficulty.easy +
      params.difficulty.medium +
      params.difficulty.hard;

    if (difficultyCount !== params.count) {
      alert(
        "The sum of difficulty count must be equal to the number of questions",
      );
      return;
    }

    try {
      setGenerating(true);
      const res = await api.createQuiz(id, params);
      setJobId(res.data.jobId);
      setQuizId(res.data.quizId);
      pollJob(res.data.jobId);
    } catch (error) {
      console.error("Generate error:", error);
      alert("Failed to start generation");
      setGenerating(false);
    }
  }

  async function pollJob(jobId) {
    const interval = setInterval(async () => {
      try {
        const res = await api.getJob(jobId);
        setProgress(res.data.progress);
        setStatus(res.data.lastLog?.msg || "");

        if (res.data.status === "completed") {
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/quiz/${res.data.quizId}`);
          }, 1000);
        } else if (res.data.status === "failed") {
          clearInterval(interval);
          alert("Generation failed: " + res.data.error);
          setGenerating(false);
        }
      } catch (error) {
        clearInterval(interval);
        console.error("Poll error:", error);
      }
    }, 2000);
  }

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate(`/docs/${id}`)}>
        ← Back
      </button>

      <h1>Generate Quiz</h1>

      {!generating ? (
        <div style={styles.form}>
          <div style={styles.field}>
            <label>Number of Questions</label>
            <input
              type="number"
              value={params.count}
              onChange={(e) =>
                setParams({ ...params, count: parseInt(e.target.value) })
              }
              min="5"
              max="50"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label>Language</label>
            <select
              value={params.language}
              onChange={(e) =>
                setParams({ ...params, language: e.target.value })
              }
              style={styles.input}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>

          <div style={styles.field}>
            <label>Difficulty Distribution</label>
            <div style={styles.difficultyGrid}>
              <div>
                <label style={styles.diffLabel}>Easy</label>
                <input
                  type="number"
                  value={params.difficulty.easy}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      difficulty: {
                        ...params.difficulty,
                        easy: parseInt(e.target.value),
                      },
                    })
                  }
                  min="0"
                  style={styles.diffInput}
                />
              </div>
              <div>
                <label style={styles.diffLabel}>Medium</label>
                <input
                  type="number"
                  value={params.difficulty.medium}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      difficulty: {
                        ...params.difficulty,
                        medium: parseInt(e.target.value),
                      },
                    })
                  }
                  min="0"
                  style={styles.diffInput}
                />
              </div>
              <div>
                <label style={styles.diffLabel}>Hard</label>
                <input
                  type="number"
                  value={params.difficulty.hard}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      difficulty: {
                        ...params.difficulty,
                        hard: parseInt(e.target.value),
                      },
                    })
                  }
                  min="0"
                  style={styles.diffInput}
                />
              </div>
            </div>
          </div>

          <button style={styles.generateBtn} onClick={handleGenerate}>
            🚀 Generate Quiz
          </button>
        </div>
      ) : (
        <div style={styles.progress}>
          <ProgressBar progress={progress} />
          <p style={styles.status}>{status}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
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
  form: {
    background: "white",
    padding: "32px",
    borderRadius: "12px",
    marginTop: "24px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  field: {
    marginBottom: "24px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "16px",
    marginTop: "8px",
  },
  difficultyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginTop: "8px",
  },
  diffLabel: {
    display: "block",
    fontSize: "14px",
    marginBottom: "4px",
    color: "#666",
  },
  diffInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "16px",
  },
  generateBtn: {
    width: "100%",
    background: "#667eea",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  },
  progress: {
    marginTop: "40px",
    textAlign: "center",
  },
  status: {
    marginTop: "16px",
    color: "#666",
    fontSize: "14px",
  },
};

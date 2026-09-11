import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import Citation from "../components/Citation";

export default function Review() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReview();
  }, [quizId]);

  async function loadReview() {
    try {
      const res = await api.getReview(quizId);
      setWrongQuestions(res.data.wrongQuestions);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={styles.container}>Loading...</div>;

  if (wrongQuestions.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h1>🎉 Perfect Score!</h1>
          <p>You didn't get any questions wrong.</p>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        style={styles.backBtn}
        onClick={() =>
          navigate(`/quiz/${quizId}/result`, {
            state: { results: location.state.results },
          })
        }
      >
        ← Back to Results
      </button>

      <h1>Wrong Answers Review</h1>
      <p style={styles.subtitle}>
        {wrongQuestions.length} question{wrongQuestions.length > 1 ? "s" : ""}{" "}
        to review
      </p>

      {wrongQuestions.map((q, idx) => (
        <div key={q._id} style={styles.questionCard}>
          <div style={styles.header}>
            <span style={styles.badge}>Wrong Answer</span>
          </div>

          <p style={styles.question}>{q.question}</p>

          <div style={styles.options}>
            {q.options.map((option, optIdx) => {
              const isCorrect = optIdx === q.correctAnswerIndex;
              const isUserAnswer = optIdx === q.userAnswer;

              let optionStyle = styles.option;
              if (isCorrect) {
                optionStyle = { ...styles.option, ...styles.correctOption };
              } else if (isUserAnswer) {
                optionStyle = { ...styles.option, ...styles.wrongOption };
              }

              return (
                <div key={optIdx} style={optionStyle}>
                  {String.fromCharCode(65 + optIdx)}. {option}
                  {isCorrect && (
                    <span style={styles.correctLabel}> ✓ Correct Answer</span>
                  )}
                  {isUserAnswer && !isCorrect && (
                    <span style={styles.wrongLabel}> ✗ Your Answer</span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={styles.explanation}>
            <strong>Explanation:</strong>
            <p>{q.explanation}</p>
          </div>

          {q.citations && q.citations.length > 0 && (
            <div style={styles.citations}>
              <strong>Supporting Evidence from Document:</strong>
              {q.citations.map((citation, cIdx) => (
                <Citation key={cIdx} citation={citation} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
  subtitle: {
    color: "#666",
    marginBottom: "32px",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
  },
  questionCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "2px solid #ff6b6b",
  },
  header: {
    marginBottom: "16px",
  },
  badge: {
    background: "#ff6b6b",
    color: "white",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  question: {
    fontSize: "18px",
    fontWeight: "500",
    marginBottom: "16px",
  },
  options: {
    marginBottom: "16px",
  },
  option: {
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "8px",
    border: "2px solid #e0e0e0",
    position: "relative",
  },
  correctOption: {
    background: "#d3f9d8",
    borderColor: "#51cf66",
  },
  wrongOption: {
    background: "#ffe0e0",
    borderColor: "#ff6b6b",
  },
  correctLabel: {
    color: "#51cf66",
    fontWeight: "bold",
    fontSize: "14px",
  },
  wrongLabel: {
    color: "#ff6b6b",
    fontWeight: "bold",
    fontSize: "14px",
  },
  explanation: {
    background: "#f8f9fa",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  citations: {
    background: "#fff9db",
    padding: "16px",
    borderRadius: "8px",
  },
};

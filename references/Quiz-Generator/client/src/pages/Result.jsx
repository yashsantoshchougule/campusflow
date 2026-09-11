import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import Citation from "../components/Citation";

export default function Result() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState(location.state?.results || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizData();
  }, [quizId]);

  async function loadQuizData() {
    try {
      const res = await api.getQuiz(quizId);
      setQuiz(res.data.quiz);
      setQuestions(res.data.questions);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !results)
    return <div style={styles.container}>Loading...</div>;

  const wrongCount = results.results.filter((r) => !r.correct).length;

  return (
    <div style={styles.container}>
      <div style={styles.scoreCard}>
        <h1 style={styles.scoreTitle}>Quiz Completed!</h1>
        <div style={styles.scoreCircle}>
          <div style={styles.scoreNumber}>{results.score}%</div>
          <div style={styles.scoreLabel}>
            {questions.length - wrongCount} / {questions.length} Correct
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          style={styles.reviewBtn}
          onClick={() =>
            navigate(`/quiz/${quizId}/review`, { state: { results } })
          }
        >
          📝 Review Wrong Answers ({wrongCount})
        </button>
        <button
          style={styles.dashboardBtn}
          onClick={() => navigate("/dashboard")}
        >
          🏠 Back to Dashboard
        </button>
      </div>

      <h2 style={styles.sectionTitle}>Detailed Results</h2>

      {questions.map((q, idx) => {
        const result = results.results[idx];
        const isCorrect = result.correct;

        return (
          <div key={q._id} style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <span style={styles.questionNum}>Question {idx + 1}</span>
              <span style={isCorrect ? styles.correctBadge : styles.wrongBadge}>
                {isCorrect ? "✓ Correct" : "✗ Wrong"}
              </span>
            </div>

            <p style={styles.question}>{q.question}</p>

            <div style={styles.options}>
              {q.options.map((option, optIdx) => {
                const isCorrectOption = optIdx === result.correctAnswerIndex;
                let optionStyle = styles.option;

                if (isCorrectOption) {
                  optionStyle = { ...styles.option, ...styles.correctOption };
                } else if (
                  !isCorrect &&
                  optIdx === results.results[idx].userAnswer
                ) {
                  optionStyle = { ...styles.option, ...styles.wrongOption };
                }

                return (
                  <div key={optIdx} style={optionStyle}>
                    {String.fromCharCode(65 + optIdx)}. {option}
                  </div>
                );
              })}
            </div>

            <div style={styles.explanation}>
              <strong>Explanation:</strong>
              <p>{result.explanation}</p>
            </div>

            {result.citations && result.citations.length > 0 && (
              <div style={styles.citations}>
                <strong>Citations:</strong>
                {result.citations.map((citation, cIdx) => (
                  <Citation key={cIdx} citation={citation} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  scoreCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    marginBottom: "32px",
  },
  scoreTitle: {
    marginBottom: "24px",
  },
  scoreCircle: {
    display: "inline-block",
  },
  scoreNumber: {
    fontSize: "64px",
    fontWeight: "bold",
  },
  scoreLabel: {
    fontSize: "18px",
    opacity: 0.9,
  },
  actions: {
    display: "flex",
    gap: "16px",
    marginBottom: "32px",
  },
  reviewBtn: {
    flex: 1,
    background: "#ff6b6b",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
  },
  dashboardBtn: {
    flex: 1,
    background: "#f5f7fa",
    border: "none",
    padding: "16px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
  },
  sectionTitle: {
    marginBottom: "24px",
  },
  resultCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  questionNum: {
    fontWeight: "bold",
    color: "#666",
  },
  correctBadge: {
    background: "#51cf66",
    color: "white",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  wrongBadge: {
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
  },
  correctOption: {
    background: "#d3f9d8",
    borderColor: "#51cf66",
  },
  wrongOption: {
    background: "#ffe0e0",
    borderColor: "#ff6b6b",
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

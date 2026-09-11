import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import QuestionCard from "../components/QuestionCard";

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "32px",
  },
  progress: {
    fontSize: "14px",
    color: "#666",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    background: "#e0e0e0",
    borderRadius: "4px",
    marginTop: "8px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#667eea",
    transition: "width 0.3s",
  },
  answeredText: {
    fontSize: "12px",
    marginTop: "4px",
  },
  navigation: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "32px",
  },
  navBtn: {
    background: "#f5f7fa",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
  },
  submitBtn: {
    background: "#667eea",
    color: "white",
    border: "none",
    padding: "12px 32px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
};

export default function Quiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  async function loadQuiz() {
    try {
      const res = await api.getQuiz(quizId);
      setQuiz(res.data.quiz);
      setQuestions(res.data.questions);
      setAnswers(new Array(res.data.questions.length).fill(null));
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(optionIndex) {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  async function handleSubmit() {
    if (answers.includes(null)) {
      alert("Please answer all questions before submitting");
      return;
    }

    try {
      const res = await api.submitQuiz(quizId, answers);
      navigate(`/quiz/${quizId}/result`, { state: { results: res.data } });
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit answers");
    }
  }

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (!quiz) return <div style={styles.container}>Quiz not found</div>;

  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.progress}>
          Question {currentIndex + 1} of {questions.length}
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${(answeredCount / questions.length) * 100}%`,
              }}
            />
          </div>
          <p style={styles.answeredText}>{answeredCount} answered</p>
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        selectedAnswer={answers[currentIndex]}
        onSelect={handleAnswer}
        showAnswer={false}
      />

      <div style={styles.navigation}>
        <button
          style={styles.navBtn}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button style={styles.submitBtn} onClick={handleSubmit}>
            Submit Quiz
          </button>
        ) : (
          <button style={styles.navBtn} onClick={handleNext}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

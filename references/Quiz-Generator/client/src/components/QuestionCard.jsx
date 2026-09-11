import React from "react";

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  showAnswer,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.difficulty}>
        <span style={getDifficultyStyle(question.difficulty)}>
          {question.difficulty.toUpperCase()}
        </span>
      </div>

      <h2 style={styles.question}>{question.question}</h2>

      <div style={styles.options}>
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrect = showAnswer && idx === question.correctAnswerIndex;

          let optionStyle = styles.option;
          if (isSelected) {
            optionStyle = { ...styles.option, ...styles.selectedOption };
          }
          if (showAnswer && isCorrect) {
            optionStyle = { ...styles.option, ...styles.correctOption };
          }

          return (
            <div
              key={idx}
              style={optionStyle}
              onClick={() => !showAnswer && onSelect(idx)}
            >
              <span style={styles.optionLetter}>
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </div>
          );
        })}
      </div>

      {question.tags && question.tags.length > 0 && (
        <div style={styles.tags}>
          {question.tags.map((tag, idx) => (
            <span key={idx} style={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function getDifficultyStyle(difficulty) {
  const baseStyle = {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
  };

  if (difficulty === "easy") {
    return { ...baseStyle, background: "#d3f9d8", color: "#2f9e44" };
  } else if (difficulty === "medium") {
    return { ...baseStyle, background: "#fff3bf", color: "#f59f00" };
  } else {
    return { ...baseStyle, background: "#ffe0e0", color: "#e03131" };
  }
}

const styles = {
  card: {
    background: "white",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  difficulty: {
    marginBottom: "16px",
  },
  question: {
    fontSize: "24px",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  option: {
    padding: "16px",
    borderRadius: "12px",
    border: "2px solid #e0e0e0",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  selectedOption: {
    borderColor: "#667eea",
    background: "#f0f4ff",
  },
  correctOption: {
    borderColor: "#51cf66",
    background: "#d3f9d8",
  },
  optionLetter: {
    display: "inline-block",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#f5f7fa",
    textAlign: "center",
    lineHeight: "32px",
    fontWeight: "bold",
    flexShrink: 0,
  },
  tags: {
    marginTop: "16px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  tag: {
    background: "#f5f7fa",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#666",
  },
};

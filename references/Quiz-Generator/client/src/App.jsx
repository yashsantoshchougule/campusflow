import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initSession } from "./utils/session";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import DocumentView from "./pages/DocumentView";
import GenerateQuiz from "./pages/GenerateQuiz";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import Review from "./pages/Review";

function App() {
  useEffect(() => {
    initSession();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/docs/:id" element={<DocumentView />} />
        <Route path="/docs/:id/generate" element={<GenerateQuiz />} />
        <Route path="/quiz/:quizId" element={<Quiz />} />
        <Route path="/quiz/:quizId/result" element={<Result />} />
        <Route path="/quiz/:quizId/review" element={<Review />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

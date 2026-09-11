import { useState, useEffect } from "react"
import { generateQuiz, evaluateAnswers } from "../../api"
import {
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Sparkles,
  Trophy,
  Target,
  BookOpen,
  Zap
} from "lucide-react"
import DashboardNav from "../dashboard/DashboardNav"
function QuizScreen({ subject, onSubmit, onBack, onLogout, user }) {
  const [quiz, setQuiz] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)

  useEffect(() => {
    fetchQuiz()
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchQuiz = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await generateQuiz(subject)
      setQuiz(response.data.quiz || [])
    } catch (error) {
      setError("Failed to generate quiz. Is backend running?")
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionIndex, option) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }))
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const answersArray = quiz.map((_, i) => answers[i] || "A")
      const response = await evaluateAnswers(quiz, answersArray, subject)
      onSubmit(quiz, response.data)
    } catch (error) {
      console.error("Error details:", error.response?.data)
    } finally {
      setSubmitting(false)
    }
  }

  const allAnswered = quiz.length > 0 && Object.keys(answers).length === quiz.length
  const progress = quiz.length > 0 ? (Object.keys(answers).length / quiz.length) * 100 : 0
  const currentQuestion = quiz[currentQuestionIndex]

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getOptionLetter = (index) => {
    return String.fromCharCode(65 + index)
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-6 h-6 text-rose-500 animate-pulse" />
          </div>
        </div>
        <p className="text-rose-600 font-medium">Generating your quiz...</p>
        <p className="text-gray-400 text-sm">This may take a few moments</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-rose-200/30 shadow-lg">
        <div className="p-4 bg-red-100 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to Generate Quiz</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={fetchQuiz}
          className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40">
      
      {/* Decorative warm elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/10 rounded-full blur-3xl -z-10" />

      <DashboardNav
        active="quiz"
        onDashboard={onBack}
        onUpload={() => {}}
        onNotes={() => {}}
        onQuiz={() => {}}
        onRoadmap={() => {}}
        onAnalytics={() => {}}
        onAnalyticsV2={() => {}}
        onLogout={onLogout}
        onStudy={() => {}}
      />

      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-10 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fadeUp">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl">
                <Brain className="w-7 h-7 text-rose-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Quiz
              </h1>
            </div>
            <p className="text-rose-500/80 ml-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Test your knowledge on {subject}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-rose-200/30">
              <Clock className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-gray-700">{formatTime(timeSpent)}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200/30">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-gray-700">
                {Object.keys(answers).length}/{quiz.length}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 animate-fadeUp">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {quiz.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-rose-200/30 animate-fadeUp">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Quiz Questions</h3>
            <p className="text-gray-500">Unable to generate questions for this subject</p>
          </div>
        ) : (
          <>
            {/* Question Counter */}
            <div className="flex items-center justify-between mb-6 animate-fadeUp">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  currentQuestionIndex === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-white/50 text-rose-600 hover:scale-105'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <span className="text-sm font-medium text-gray-500">
                Question {currentQuestionIndex + 1} of {quiz.length}
              </span>
              
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.length - 1, prev + 1))}
                disabled={currentQuestionIndex === quiz.length - 1}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  currentQuestionIndex === quiz.length - 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-white/50 text-rose-600 hover:scale-105'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 p-8 animate-fadeUp">
              <div className="flex items-start gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-lg leading-relaxed">
                    {currentQuestion?.question}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Topic: {currentQuestion?.topic}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {currentQuestion && Object.entries(currentQuestion.options || {}).map(
                  ([letter, text]) => (
                    <button
                      key={letter}
                      onClick={() => handleAnswer(currentQuestionIndex, letter)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                        answers[currentQuestionIndex] === letter
                          ? "border-rose-500 bg-rose-50/50 shadow-md shadow-rose-100/50"
                          : "border-gray-200/50 hover:border-rose-300 hover:bg-rose-50/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                          answers[currentQuestionIndex] === letter
                            ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white"
                            : "bg-gray-100 text-gray-500 group-hover:bg-rose-100 group-hover:text-rose-600"
                        }`}>
                          {letter}
                        </span>
                        <span className={`text-gray-700 transition-colors duration-200 ${
                          answers[currentQuestionIndex] === letter
                            ? "font-medium text-gray-900"
                            : "group-hover:text-gray-900"
                        }`}>
                          {text}
                        </span>
                        {answers[currentQuestionIndex] === letter && (
                          <CheckCircle className="ml-auto w-5 h-5 text-rose-500" />
                        )}
                      </div>
                    </button>
                  )
                )}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mt-6">
                {quiz.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentQuestionIndex
                        ? 'w-8 bg-gradient-to-r from-rose-500 to-amber-500'
                        : answers[index]
                          ? 'w-2 bg-emerald-400'
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 animate-fadeUp">
              {!allAnswered && (
                <div className="flex items-center gap-2 mb-4 text-amber-600 text-sm bg-amber-50/80 backdrop-blur-sm p-3 rounded-xl border border-amber-200/50">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{quiz.length - Object.keys(answers).length} questions remaining</span>
                </div>
              )}
              
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={!allAnswered || submitting}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  !allAnswered || submitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.01]'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : allAnswered ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    Submit Answers
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    Answer all questions to submit
                  </>
                )}
              </button>

              {allAnswered && !submitting && (
                <p className="text-center text-xs text-emerald-600 mt-3 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  All questions answered! Ready to submit.
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowSubmitModal(false)}
          />
          
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-rose-200/50 max-w-md w-full p-8 animate-fadeUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl">
                <Zap className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Submit Quiz?</h2>
                <p className="text-sm text-gray-500">You've answered all questions</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Questions</span>
                <span className="font-medium text-gray-800">{quiz.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Answered</span>
                <span className="font-medium text-emerald-600">{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Time Spent</span>
                <span className="font-medium text-gray-800">{formatTime(timeSpent)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                Review Answers
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false)
                  handleSubmit()
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizScreen
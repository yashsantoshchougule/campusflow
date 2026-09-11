import {
  Trophy,
  Target,
  BookOpen,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  GraduationCap,
  Zap
} from "lucide-react"
import DashboardNav from "../dashboard/DashboardNav"
function ResultScreen({ results, onRestart, onBack, onLogout, user, subject }) {
  if (!results) return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-rose-200/30 shadow-lg">
        <div className="p-4 bg-amber-100 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Available</h3>
        <p className="text-gray-500">Complete a quiz to see your results here</p>
      </div>
    </div>
  )

  const { results: quizResults, weak_topics, recommendations } = results
  const score = quizResults.filter(r => r.is_correct).length
  const totalQuestions = quizResults.length
  const percentage = Math.round((score / totalQuestions) * 100)
  
  const correctCount = score
  const incorrectCount = totalQuestions - score
  const isPerfect = score === totalQuestions
  const isExcellent = percentage >= 80
  const isGood = percentage >= 60

  const getPerformance = () => {
    if (isPerfect) return { message: "Perfect Score! 🏆", color: "from-emerald-500 to-teal-500", emoji: "🎉" }
    if (isExcellent) return { message: "Excellent Work! ⭐", color: "from-blue-500 to-cyan-500", emoji: "🌟" }
    if (isGood) return { message: "Good Job! Keep Going 💪", color: "from-amber-500 to-orange-500", emoji: "💪" }
    return { message: "Keep Studying! You Got This 📚", color: "from-rose-500 to-orange-500", emoji: "📚" }
  }

  const performance = getPerformance()

  const getScoreColor = () => {
    if (percentage >= 80) return "text-emerald-600"
    if (percentage >= 60) return "text-blue-600"
    if (percentage >= 40) return "text-amber-600"
    return "text-rose-600"
  }

  const getRingColor = () => {
    if (percentage >= 80) return "#10b981"
    if (percentage >= 60) return "#3b82f6"
    if (percentage >= 40) return "#f59e0b"
    return "#f43f5e"
  }

  // Calculate best streak
  const bestStreak = quizResults.reduce((max, curr, i, arr) => {
    if (curr.is_correct) {
      let streak = 1
      for (let j = i + 1; j < arr.length && arr[j].is_correct; j++) streak++
      return Math.max(max, streak)
    }
    return max
  }, 0)

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
                <Trophy className="w-7 h-7 text-rose-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Quiz Results
              </h1>
            </div>
            <p className="text-rose-500/80 ml-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {subject ? `Results for ${subject}` : 'Your quiz performance'}
            </p>
          </div>
          <button
            onClick={onRestart}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02] flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Another Quiz
          </button>
        </div>

        {/* Score Card with Circular Progress - Fixed */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 p-8 mb-8 animate-fadeUp">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Circular Progress */}
            <div className="relative flex-shrink-0">
              <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke={getRingColor()}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${percentage * 2.827} 282.7`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl md:text-4xl font-bold ${getScoreColor()}`}>
                  {percentage}%
                </span>
                <span className="text-xs md:text-sm text-gray-500">Score</span>
              </div>
            </div>

            {/* Score Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="text-3xl">{performance.emoji}</span>
                <h2 className="text-2xl font-bold text-gray-800">
                  {performance.message}
                </h2>
              </div>
              
              <p className="text-gray-500 mb-4">
                You got <span className="font-bold text-gray-800">{score}</span> out of{" "}
                <span className="font-bold text-gray-800">{totalQuestions}</span> questions correct
              </p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200/50">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-gray-500">Correct</p>
                    <p className="font-bold text-emerald-600">{correctCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-200/50">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <div>
                    <p className="text-xs text-gray-500">Incorrect</p>
                    <p className="font-bold text-rose-600">{incorrectCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200/50">
                  <Target className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="font-bold text-amber-600">{percentage}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fadeUp">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-emerald-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Best Streak</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{bestStreak}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-amber-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Weak Topics</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{weak_topics?.length || 0}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-rose-200/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Recommendations</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{recommendations?.length || 0}</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <Lightbulb className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="mb-8 animate-fadeUp">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-400" />
              Question Review
            </h3>
            <span className="text-sm text-gray-400">{totalQuestions} questions</span>
          </div>
          
          <div className="space-y-4">
            {quizResults.map((item, index) => (
              <div key={index}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  item.is_correct
                    ? "bg-emerald-50/80 border-emerald-200/50 hover:shadow-md hover:shadow-emerald-100/20"
                    : "bg-rose-50/80 border-rose-200/50 hover:shadow-md hover:shadow-rose-100/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {item.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-lg mb-3">
                      Q{index + 1}: {item.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Your Answer:</span>
                        <span className={`font-medium ${
                          item.is_correct ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {item.your_answer}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Correct Answer:</span>
                        <span className="font-medium text-gray-700">{item.correct_answer}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        Topic: {item.topic}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {item.is_correct ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                        Correct
                      </span>
                    ) : (
                      <span className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium">
                        Incorrect
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm rounded-2xl border border-amber-200/30 p-6 mb-6 animate-fadeUp">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Weak Topics</h3>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">
              {weak_topics?.length || 0} topics
            </span>
          </div>
          
          {weak_topics && weak_topics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {weak_topics.map((topic, index) => (
                <span key={index}
                  className="bg-amber-200/50 text-amber-900 px-4 py-2 rounded-xl text-sm font-medium border border-amber-300/30 flex items-center gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {topic.topic}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/50">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">No weak topics detected! Great job! 🎉</span>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/30 p-6 mb-8 animate-fadeUp">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Revision Material</h3>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
              {recommendations?.length || 0} recommendations
            </span>
          </div>
          
          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-blue-200/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-700 mb-1">{rec.weak_topic}</p>
                      <p className="text-sm text-gray-600">{rec.revise_this}</p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {rec.source}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50/50 p-3 rounded-xl border border-blue-200/50">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">No recommendations needed. You're doing great!</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fadeUp">
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-rose-200/50 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Another Quiz
          </button>
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3.5 bg-white/80 backdrop-blur-sm border border-rose-200/30 text-gray-700 hover:bg-white/90 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

      </main>
    </div>
  )
}

export default ResultScreen
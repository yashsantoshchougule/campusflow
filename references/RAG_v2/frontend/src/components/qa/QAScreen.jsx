import { useState } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import { 
  ArrowLeft, 
  Send, 
  MessageCircle, 
  Sparkles, 
  BookOpen,
  User,
  Bot,
  AlertCircle,
  Loader
} from "lucide-react"
import ModuleNav from "../common/ModuleNav"

function QAScreen({ subject, onBack, onLogout, user }) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState([])

  const handleAsk = async () => {
    const token = localStorage.getItem("access_token")
    
    if (!question.trim()) return

    setLoading(true)
    setError("")

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + "/ask",
        { question },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setHistory(prev => [...prev, {
        question,
        answer: response.data.answer,
        sources: response.data.sources
      }])

      setQuestion("")

    } catch (error) {
      setError("Failed to get answer. Is backend running?")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40">
      
      {/* Decorative warm elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/10 rounded-full blur-3xl -z-10" />

      <ModuleNav
        active="qa"
        onDashboard={onBack}
        onUpload={() => {}}
        onNotes={() => {}}
        onQuiz={() => {}}
        onRoadmap={() => {}}
        onAnalytics={() => {}}
        onAnalyticsV2={() => {}}
        onLogout={onLogout}
        onStudy={() => {}}
        user={user}
      />

      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-10 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fadeUp">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl">
                <MessageCircle className="w-7 h-7 text-rose-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Ask AI
              </h1>
            </div>
            <p className="text-rose-500/80 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Get answers from your study notes
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-rose-200/30">
            <BookOpen className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-medium text-gray-700">Subject: <span className="text-rose-600">{subject}</span></span>
          </div>
        </div>

        {/* Question Input - Redesigned */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 p-4 mb-8 animate-fadeUp">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                Ask anything about your notes
              </label>
              <div className="relative">
                <textarea
                  placeholder="Type your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/50 border border-rose-200/50 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all duration-200 resize-none"
                />
                {loading && (
                  <div className="absolute bottom-3 right-3">
                    <Loader className="w-5 h-5 text-rose-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium transition-all duration-300 shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 min-h-[52px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Thinking...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ask
                </>
              )}
            </button>
          </div>
          
          {/* Character hint */}
          <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
            <span>Press Enter to ask</span>
            <span>{question.length} characters</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fadeUp">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Chat History */}
        {history.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-rose-200/30 animate-fadeUp">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-rose-50 rounded-full mb-4">
                <Sparkles className="w-10 h-10 text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Ask a Question</h3>
              <p className="text-gray-400 max-w-sm">
                Ask anything about your study notes and get AI-powered answers instantly.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeUp">
            {history.map((item, index) => (
              <div key={index} className="space-y-3">
                {/* Question bubble - User */}
                <div className="flex justify-end">
                  <div className="flex items-start gap-3 max-w-[80%]">
                    <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm shadow-lg shadow-rose-200/30">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="leading-relaxed" {...props} />
                        }}
                      >
                        {item.question}
                      </ReactMarkdown>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-rose-100 to-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-rose-600" />
                    </div>
                  </div>
                </div>

                {/* Answer bubble - AI */}
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-xl bg-white/80 backdrop-blur-sm border border-rose-200/30 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm px-5 py-4 rounded-2xl rounded-tl-sm shadow-lg shadow-rose-100/20 border border-rose-200/30">
                      <div className="text-sm text-gray-700 prose prose-rose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold text-gray-800 mb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold text-gray-800 mb-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-700 mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="text-gray-600 leading-relaxed mb-2" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-2" {...props} />,
                            li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline ? 
                                <code className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-xs" {...props} /> :
                                <code className="block bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-rose-300 pl-4 italic text-gray-600 my-2" {...props} />,
                            a: ({node, ...props}) => <a className="text-rose-600 hover:underline" {...props} />,
                          }}
                        >
                          {item.answer}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Sources */}
                      {item.sources && item.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-rose-200/20">
                          <p className="text-xs text-gray-400 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" />
                            Sources: {[...new Set(item.sources)].map(s => 
                              s.replace("data\\", "").replace("data/", "")
                            ).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer hint */}
        {history.length > 0 && (
          <div className="text-center mt-8 text-xs text-gray-400">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-rose-200/20">
              <Sparkles className="w-3 h-3 text-rose-400" />
              AI-powered answers from your notes
            </span>
          </div>
        )}
      </main>
    </div>
  )
}

export default QAScreen
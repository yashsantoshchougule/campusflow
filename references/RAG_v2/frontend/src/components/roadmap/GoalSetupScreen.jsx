import { useState, useEffect } from "react"
import axios from "axios"
import {
  ArrowLeft,
  Map,
  Calendar,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Sparkles,
  Loader,
  Layers,
  Zap,
  TrendingUp,
  FileText
} from "lucide-react"
import DashboardNav from "../dashboard/DashboardNav"
import Footer from "../common/Footer"
import ModuleNav from "../common/ModuleNav"

function GoalSetupScreen({ onBack, onViewRoadmap, onLogout, user }) {
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [existingRoadmap, setExistingRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState("")

  // Form fields
  const [scope, setScope] = useState("full")
  const [unitNumber, setUnitNumber] = useState(1)
  const [hoursPerDay, setHoursPerDay] = useState(2)
  const [targetDate, setTargetDate] = useState("")

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    const token = localStorage.getItem("access_token")
    const response = await axios.get(
      import.meta.env.VITE_API_URL + "/subjects"
    )
    setSubjects(response.data.subjects)
  }

  const handleSubjectChange = async (subject) => {
    const token = localStorage.getItem("access_token")
    setSelectedSubject(subject)
    setExistingRoadmap(null)
    setError("")

    if (!subject) {
      return
    }
    setChecking(true)

    try {
      const response = await axios.get(
        import.meta.env.VITE_API_URL + `/roadmap/${subject}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      console.log("GET roadmap:", response.data)
      if (!response.data.error) {
        setExistingRoadmap(response.data)
      }
      console.log(response.data)
      console.log(Array.isArray(response.data))
    } catch (error) {
      console.log(JSON.stringify(error.response?.data, null, 2))
      setExistingRoadmap(null)
    } finally {
      setChecking(false)
    }
  }

  const handleDelete = async () => {
    const token = localStorage.getItem("access_token")
    if (!confirm("Delete this roadmap?")) return
    await axios.delete(
      import.meta.env.VITE_API_URL + `/roadmap/${selectedSubject}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    setExistingRoadmap(null)
  }

  const handleGenerate = async () => {
    const token = localStorage.getItem("access_token")
    console.log("TOKEN:", token)
    if (!selectedSubject || !targetDate) {
      setError("Please select subject and target date!")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + "/roadmap",
        {
          subject: selectedSubject,
          hours_per_day: hoursPerDay,
          target_date: targetDate,
          scope: scope,
          unit_number: scope === "unit" ? unitNumber : null
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.error) {
        setError(response.data.error)
        return
      }

      const targetSubject = selectedSubject
      setExistingRoadmap(response.data)
      setError("")
      onViewRoadmap(targetSubject)

    } catch (error) {
      console.log(JSON.stringify(error.response?.data, null, 2))
      setError("Failed to generate roadmap")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40">
      
      {/* Decorative warm elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/10 rounded-full blur-3xl -z-10" />

      <ModuleNav
  active="notes" // or "study", "upload", "roadmap", "analytics-v2"
  onDashboard={onBack}
  onStudy={() => {}}
  onUpload={() => {}}
  onNotes={() => {}}
  onRoadmap={() => {}}
  onAnalyticsV2={() => {}}
  onLogout={onLogout}
  user={user}
/>

      <main className="max-w-3xl mx-auto px-6 lg:px-8 py-10 relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fadeUp">
          <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl">
            <Map className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Study Roadmap
            </h1>
            <p className="text-rose-500/80 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Plan your study journey
            </p>
          </div>
        </div>

        {/* Subject Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 p-6 mb-6 animate-fadeUp">
  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
    <BookOpen className="w-4 h-4 text-rose-400" />
    Select Subject
  </label>
  <div className="relative">
    <select
      value={selectedSubject}
      onChange={(e) => handleSubjectChange(e.target.value)}
      className="w-full appearance-none bg-white/80 border border-rose-200/50 rounded-xl py-3 px-4 pr-12 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-transparent transition-all duration-200 cursor-pointer hover:border-rose-300"
    >
      <option value="" className="text-gray-400">Choose subject...</option>
      {subjects.map(s => (
        <option key={s} value={s} className="text-gray-700">{s}</option>
      ))}
    </select>
    
    {/* Custom dropdown arrow */}
    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</div>

        {/* Checking State */}
        {checking && (
          <div className="flex items-center justify-center gap-3 py-6 animate-fadeUp">
            <Loader className="w-5 h-5 text-rose-500 animate-spin" />
            <p className="text-gray-500 font-medium">Checking existing roadmap...</p>
          </div>
        )}

        {/* Existing Roadmap Card */}
        {existingRoadmap && (
          <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 backdrop-blur-sm rounded-2xl border border-orange-200/30 p-6 mb-6 animate-fadeUp shadow-lg shadow-orange-100/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Map className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  Active Roadmap Found 🗺️
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-medium text-gray-700">{existingRoadmap.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-medium text-gray-700">{existingRoadmap.scope}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-medium text-gray-700">{existingRoadmap.target_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-medium text-gray-700">{formatDate(existingRoadmap.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <FileText className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-medium text-gray-700">{existingRoadmap.weeks?.length} weeks planned</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => onViewRoadmap(selectedSubject)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-orange-200/50 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Roadmap
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-red-200/50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create New Roadmap Form */}
        {selectedSubject && !existingRoadmap && !checking && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-amber-200/20 border border-amber-200/30 p-6 animate-fadeUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-800">
                Create New Roadmap
              </h3>
            </div>

            {/* Scope */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                Study Scope
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setScope("full")}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    scope === "full"
                      ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white border-rose-500 shadow-lg shadow-rose-200/50"
                      : "bg-white/50 text-gray-600 border-gray-200/50 hover:border-rose-300"
                  }`}
                >
                  Full Syllabus
                </button>
                <button
                  onClick={() => setScope("unit")}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    scope === "unit"
                      ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white border-rose-500 shadow-lg shadow-rose-200/50"
                      : "bg-white/50 text-gray-600 border-gray-200/50 hover:border-rose-300"
                  }`}
                >
                  Specific Unit
                </button>
              </div>
            </div>

            {/* Unit Number */}
            {scope === "unit" && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Unit Number
                </label>
                <select
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(parseInt(e.target.value))}
                  className="w-full border border-amber-200/50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all duration-200 bg-white/50"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>Unit {n}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Hours Per Day */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Hours Per Day: <span className="text-amber-600 font-bold">{hoursPerDay}h</span>
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                  className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1h</span>
                  <span>2h</span>
                  <span>4h</span>
                  <span>6h</span>
                  <span>8h</span>
                </div>
              </div>
            </div>

            {/* Target Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-amber-200/50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all duration-200 bg-white/50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-orange-200/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Roadmap
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty State - No Subject Selected */}
        {!selectedSubject && !checking && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-rose-200/30 animate-fadeUp">
            <div className="p-4 bg-rose-50 rounded-full mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <Map className="w-10 h-10 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Subject</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Choose a subject from the dropdown above to create or view your study roadmap
            </p>
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}

export default GoalSetupScreen
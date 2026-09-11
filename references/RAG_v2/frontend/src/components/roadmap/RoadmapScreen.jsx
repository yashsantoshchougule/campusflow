import { useState, useEffect } from "react"
import axios from "axios"
import Footer from "../common/Footer"
import {
    getRoadmap,
    completeTopic,
    extendRoadmap,
} from "../../api/roadmapApi";
import { getRoadmapStats } from "../../utils/roadmapStats";
import DashboardNav from "../dashboard/DashboardNav";
import {
    Map,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Target,
    BookOpen,
    TrendingUp,
    TrendingDown,
    Zap,
    Sparkles,
    ArrowLeft,
    CalendarDays,
    BarChart3,
    Loader,
    ChevronRight,
    Award,
    Flag,
    Plus,
    X
} from "lucide-react"

function RoadmapScreen({ subject, onBack, onLogout, user }) {
    const [roadmap, setRoadmap] = useState(null)
    const [loading, setLoading] = useState(true)
    const [extending, setExtending] = useState(false)
    const [newTargetDate, setNewTargetDate] = useState("")
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("info")

    useEffect(() => {
        fetchRoadmap()
    }, [])

    const fetchRoadmap = async () => {
        try {
            setLoading(true)
            const data = await getRoadmap(subject)
            setRoadmap(data)
        } catch (err) {
            console.error(err)
            setMessage("Failed to load roadmap")
            setMessageType("error")
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteTopic = async (week, topicName) => {
        try {
            await completeTopic(subject, week, topicName)
            await fetchRoadmap()
            setMessage(`✅ "${topicName}" marked complete!`)
            setMessageType("success")
            setTimeout(() => setMessage(""), 3000)
        } catch {
            setMessage("Failed to update topic")
            setMessageType("error")
        }
    }

    const handleExtendDate = async () => {
        const token = localStorage.getItem("access_token")
        if (!newTargetDate) return
        try {
            await extendRoadmap(subject, newTargetDate)
            setExtending(false)
            await fetchRoadmap()
            setMessage("✅ Target date extended!")
            setMessageType("success")
            setTimeout(() => setMessage(""), 3000)
        } catch {
            setMessage("Failed to extend date")
            setMessageType("error")
        }
    }

    // Calculate stats
    const stats = getRoadmapStats(roadmap)

    const paceConfig = {
        ahead: { label: "Ahead of schedule!", color: "text-emerald-600", icon: TrendingUp, bg: "bg-emerald-50" },
        on_track: { label: "On track!", color: "text-blue-600", icon: Target, bg: "bg-blue-50" },
        behind: { label: "Behind schedule", color: "text-rose-600", icon: TrendingDown, bg: "bg-rose-50" }
    }

    const pace = paceConfig[stats.pace] || paceConfig.on_track

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Map className="w-6 h-6 text-rose-500 animate-pulse" />
                    </div>
                </div>
                <p className="text-rose-600 font-medium">Loading your roadmap...</p>
            </div>
        </div>
    )

    if (!roadmap || roadmap.error) return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/40 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-rose-200/30 shadow-lg">
                <div className="p-4 bg-amber-100 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Roadmap Found</h3>
                <p className="text-gray-500 mb-4">No roadmap found for {subject}</p>
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                >
                    Go Back
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
                active="roadmap"
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

            <main className="max-w-5xl mx-auto px-6 lg:px-8 py-10 relative">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fadeUp">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl">
                                <Map className="w-7 h-7 text-rose-600" />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                                Study Roadmap
                            </h1>
                        </div>
                        <p className="text-rose-500/80 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            {subject} • {roadmap.scope === "full" ? "Full Syllabus" : `Unit ${roadmap.unit_number}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {message && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                                messageType === "success" 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                    : messageType === "error"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                                {messageType === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {message}
                            </div>
                        )}
                        
                        <button
                            onClick={() => setExtending(!extending)}
                            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-orange-200/50 flex items-center gap-2"
                        >
                            <Calendar className="w-4 h-4" />
                            Extend Date
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fadeUp">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-rose-200/30 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Progress</p>
                                <p className="text-2xl font-bold text-rose-600 mt-1">{stats.progress}%</p>
                            </div>
                            <div className="p-3 bg-rose-100 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-rose-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-amber-200/30 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Days Left</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.daysLeft}</p>
                            </div>
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-emerald-200/30 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Topics Done</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-orange-200/30 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Topics</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <BookOpen className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pace Indicator */}
                <div className={`${pace.bg} backdrop-blur-sm rounded-2xl border p-6 mb-8 animate-fadeUp ${
                    stats.pace === 'ahead' ? 'border-emerald-200/50' :
                    stats.pace === 'behind' ? 'border-rose-200/50' :
                    'border-blue-200/50'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                                stats.pace === 'ahead' ? 'bg-emerald-100' :
                                stats.pace === 'behind' ? 'bg-rose-100' :
                                'bg-blue-100'
                            }`}>
                                <pace.icon className={`w-5 h-5 ${
                                    stats.pace === 'ahead' ? 'text-emerald-600' :
                                    stats.pace === 'behind' ? 'text-rose-600' :
                                    'text-blue-600'
                                }`} />
                            </div>
                            <p className={`font-semibold ${pace.color}`}>
                                {pace.label}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400">
                            Target: {roadmap.target_date} • {roadmap.hours_per_day}h/day
                        </p>
                    </div>
                    <div className="w-full bg-gray-200/50 rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                                stats.pace === 'ahead' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                stats.pace === 'behind' ? 'bg-gradient-to-r from-rose-500 to-orange-500' :
                                'bg-gradient-to-r from-blue-500 to-cyan-500'
                            }`}
                            style={{ width: `${stats.progress}%` }}
                        />
                    </div>
                </div>

                {/* Extend Date Form */}
                {extending && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/30 p-6 mb-8 animate-fadeUp shadow-lg shadow-orange-100/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-100 rounded-xl">
                                <CalendarDays className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="font-bold text-gray-800">Extend Target Date</h3>
                            <button
                                onClick={() => setExtending(false)}
                                className="ml-auto p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Target Date
                                </label>
                                <input
                                    type="date"
                                    value={newTargetDate}
                                    onChange={(e) => setNewTargetDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="w-full border border-orange-200/50 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-transparent transition-all duration-200 bg-white/50"
                                />
                            </div>
                            <div className="flex gap-2 self-end">
                                <button
                                    onClick={handleExtendDate}
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-orange-200/50"
                                >
                                    Update
                                </button>
                                <button
                                    onClick={() => setExtending(false)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-medium transition-all duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weak Topics Banner */}
                {roadmap.weak_topics?.length > 0 && (
                    <div className="bg-gradient-to-r from-rose-50/80 to-orange-50/80 backdrop-blur-sm rounded-2xl border border-rose-200/30 p-6 mb-8 animate-fadeUp">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-rose-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-rose-600" />
                            </div>
                            <h3 className="font-bold text-gray-800">Focus Areas (Weak Topics)</h3>
                            <span className="ml-auto text-xs bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-medium">
                                {roadmap.weak_topics.length} topics
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {roadmap.weak_topics.map((topic, i) => (
                                <span key={i}
                                    className="bg-rose-200/50 text-rose-900 px-4 py-2 rounded-xl text-sm font-medium border border-rose-300/30 flex items-center gap-2"
                                >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weekly Plan */}
                <div className="animate-fadeUp">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                            <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Weekly Plan</h3>
                        <span className="ml-auto text-sm text-gray-400">{roadmap.weeks?.length} weeks</span>
                    </div>

                    <div className="space-y-4">
                        {roadmap.weeks.map((week, wi) => {
                            const completedTopics = week.topics.filter(t => t.topic.status === "completed").length
                            const totalTopics = week.topics.length
                            const weekProgress = Math.round((completedTopics / totalTopics) * 100)

                            return (
                                <div key={wi} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-200/20 border border-rose-200/30 overflow-hidden">
                                    {/* Week Header */}
                                    <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-white/20 rounded-lg">
                                                <Flag className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-lg">Week {week.week}</span>
                                            {weekProgress === 100 && (
                                                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                                                    Complete 🎉
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-white/80">
                                            <span>{week.start_date}</span>
                                            <ChevronRight className="w-4 h-4" />
                                            <span>{week.end_date}</span>
                                            <span className="ml-2 bg-white/20 px-2.5 py-0.5 rounded-full text-xs">
                                                {weekProgress}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Week Progress Bar */}
                                    <div className="px-6 pt-3">
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-amber-400 transition-all duration-500"
                                                style={{ width: `${weekProgress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Topics */}
                                    <div className="divide-y divide-rose-200/20">
                                        {week.topics.map((item, ti) => (
                                            <div key={ti}
                                                className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-200 ${
                                                    item.topic.status === "completed" 
                                                        ? "bg-emerald-50/50 hover:bg-emerald-50" 
                                                        : "hover:bg-rose-50/30"
                                                }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className={`font-medium ${
                                                            item.topic.status === "completed" 
                                                                ? "text-gray-500 line-through" 
                                                                : "text-gray-800"
                                                        }`}>
                                                            {item.topic.name}
                                                        </span>
                                                        {item.topic.is_weak && (
                                                            <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                weak
                                                            </span>
                                                        )}
                                                        {item.topic.status === "completed" && (
                                                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" />
                                                                done
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="w-3 h-3" />
                                                            {item.unit_name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {item.topic.hours}h
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {item.topic.days_needed} day(s)
                                                        </span>
                                                        {item.topic.completed_date && (
                                                            <span className="text-emerald-600 flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Completed: {item.topic.completed_date}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {item.topic.status !== "completed" && (
                                                    <button
                                                        onClick={() => handleCompleteTopic(
                                                            week.week, 
                                                            item.topic.name
                                                        )}
                                                        className="sm:ml-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-200/50 whitespace-nowrap flex items-center gap-1.5"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Mark Done
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fadeUp">
                    <button
                        onClick={onBack}
                        className="flex-1 px-6 py-3.5 bg-white/80 backdrop-blur-sm border border-rose-200/30 text-gray-700 hover:bg-white/90 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => setExtending(true)}
                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-orange-200/50 hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        Extend Target Date
                    </button>
                </div>

            </main>

            <Footer />
        </div>
    )
}

export default RoadmapScreen
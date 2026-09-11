import { motion } from "framer-motion";
import { 
    FileBarChart2, 
    Sparkles, 
    TrendingUp, 
    Calendar,
    Download,
    Share2
} from "lucide-react";
import OverallReport from "../widgets/OverallReport";
import LearningResources from "../widgets/LearningResources";
import QuizReport from "../widgets/QuizReport";
import ActivitySummary from "../widgets/ActivitySummary";

function Reports({ dashboard }) {
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    // Calculate some stats for the header
    const totalActivities = dashboard?.overview?.books + dashboard?.overview?.notes || 0;
    const totalQuizzes = dashboard?.quiz?.total_attempts || 0;

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Page Header */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2"
            >
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                        Reports & Analytics
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Comprehensive overview of your learning journey
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-700">Live</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/50">
                        <FileBarChart2 size={14} className="text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-700">Detailed</span>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Row */}
            <motion.div 
                variants={itemVariants}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
                {[
                    { label: "Total Resources", value: totalActivities, icon: FileBarChart2, color: "text-indigo-500" },
                    { label: "Quiz Attempts", value: totalQuizzes, icon: TrendingUp, color: "text-purple-500" },
                    { label: "Active Days", value: dashboard?.overview?.active_days || 0, icon: Calendar, color: "text-emerald-500" },
                    { label: "Overall Progress", value: `${dashboard?.overview?.overall_progress || 0}%`, icon: Sparkles, color: "text-amber-500" },
                ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div 
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-slate-200/50"
                        >
                            <div className={`p-2 rounded-lg bg-slate-50`}>
                                <Icon size={16} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                                <p className="text-sm font-bold text-slate-700">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </motion.div>

            {/* First Row: Overall Report + Quiz Report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="h-full">
                    <OverallReport dashboard={dashboard} />
                </motion.div>
                <motion.div variants={itemVariants} className="h-full">
                    <QuizReport dashboard={dashboard} />
                </motion.div>
            </div>

            {/* Second Row: Learning Resources + Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="h-full">
                    <LearningResources dashboard={dashboard} />
                </motion.div>
                <motion.div variants={itemVariants} className="h-full">
                    <ActivitySummary dashboard={dashboard} />
                </motion.div>
            </div>

            {/* Export Actions */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100"
            >
                <p className="text-xs text-slate-400">
                    Export your reports for offline viewing or sharing
                </p>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white/50 border border-slate-200/50 rounded-xl hover:bg-slate-50 transition-all duration-200">
                        <Download size={16} />
                        Download PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white/50 border border-slate-200/50 rounded-xl hover:bg-slate-50 transition-all duration-200">
                        <Share2 size={16} />
                        Share
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default Reports;
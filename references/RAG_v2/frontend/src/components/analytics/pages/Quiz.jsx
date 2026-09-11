import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, Target } from "lucide-react";
import QuizSummary from "../widgets/QuizSummary";
import RecentAttempts from "../widgets/RecentAttempts";
import WeakTopics from "../widgets/WeakTopics";
import QuizTrend from "../widgets/QuizTrend";

function Quiz({ dashboard }) {
    const { quiz } = dashboard;

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
                        Quiz Analytics
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Track your quiz performance and identify areas for improvement
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-700">Live Updates</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200/50">
                        <Brain size={14} className="text-purple-500" />
                        <span className="text-xs font-medium text-purple-700">{quiz.total_attempts || 0} Attempts</span>
                    </div>
                </div>
            </motion.div>

            {/* First Row: Summary + Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="h-full">
                    <QuizSummary quiz={quiz} />
                </motion.div>
                <motion.div variants={itemVariants} className="h-full">
                    <QuizTrend quiz={quiz} />
                </motion.div>
            </div>

            {/* Second Row: Recent Attempts + Weak Topics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="h-full">
                    <RecentAttempts quiz={quiz} />
                </motion.div>
                <motion.div variants={itemVariants} className="h-full">
                    <WeakTopics quiz={quiz} />
                </motion.div>
            </div>

            {/* Quick Stats Footer */}
            <motion.div 
                variants={itemVariants}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2"
            >
                {[
                    { label: "Total Quizzes", value: quiz.total_attempts || 0, icon: Brain, color: "text-purple-500" },
                    { label: "Avg Score", value: `${quiz.average_score || 0}%`, icon: TrendingUp, color: "text-emerald-500" },
                    { label: "Best Score", value: `${quiz.best_score || 0}%`, icon: Target, color: "text-amber-500" },
                    { label: "Weak Topics", value: quiz.weak_topics?.length || 0, icon: Sparkles, color: "text-rose-500" },
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
        </motion.div>
    );
}

export default Quiz;
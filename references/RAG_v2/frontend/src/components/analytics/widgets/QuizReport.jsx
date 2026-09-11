import { motion } from "framer-motion";
import { 
    Brain, 
    TrendingUp, 
    Award, 
    Target, 
    CheckCircle,
    Clock,
    TrendingDown,
    Minus,
    BarChart3,
    Sparkles
} from "lucide-react";

function QuizReport({ dashboard }) {
    const { quiz } = dashboard;

    // Calculate additional metrics
    const totalAttempts = quiz.total_attempts || 0;
    const passedAttempts = quiz.passed || 0;
    const failedAttempts = totalAttempts - passedAttempts;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const improvementRate = quiz.average_score > 0 ? Math.round(((quiz.latest_score || 0) / quiz.average_score) * 100) : 0;

    // Get trend
    const getTrend = (current, previous) => {
        if (!previous) return { value: 0, type: 'neutral' };
        const diff = ((current - previous) / previous * 100);
        if (diff > 0) return { value: Math.abs(diff).toFixed(1), type: 'up' };
        if (diff < 0) return { value: Math.abs(diff).toFixed(1), type: 'down' };
        return { value: 0, type: 'neutral' };
    };

    const trend = getTrend(quiz.latest_score, quiz.average_score);

    const stats = [
        {
            id: "average_score",
            label: "Average Score",
            value: `${quiz.average_score || 0}%`,
            icon: Brain,
            color: "from-indigo-500/10 to-indigo-600/5",
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
            borderColor: "border-indigo-200/50",
            description: "Overall performance",
            detail: `Based on ${totalAttempts} attempts`
        },
        {
            id: "best_score",
            label: "Best Score",
            value: `${quiz.best_score || 0}%`,
            icon: Award,
            color: "from-amber-500/10 to-amber-600/5",
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            borderColor: "border-amber-200/50",
            description: "Your highest achievement",
            detail: `⭐ Top performer`
        },
        {
            id: "latest_score",
            label: "Latest Score",
            value: `${quiz.latest_score || 0}%`,
            icon: Target,
            color: "from-emerald-500/10 to-emerald-600/5",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-200/50",
            description: "Most recent attempt",
            detail: trend.type === 'up' ? `📈 ${trend.value}% improvement` : 
                    trend.type === 'down' ? `📉 ${trend.value}% decline` : 
                    '➖ No change'
        },
        {
            id: "pass_rate",
            label: "Pass Rate",
            value: `${quiz.pass_rate || 0}%`,
            icon: CheckCircle,
            color: "from-purple-500/10 to-purple-600/5",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            borderColor: "border-purple-200/50",
            description: "Success rate",
            detail: `${passedAttempts} passed • ${failedAttempts} failed`
        },
        {
            id: "total_attempts",
            label: "Total Attempts",
            value: quiz.total_attempts || 0,
            icon: BarChart3,
            color: "from-rose-500/10 to-rose-600/5",
            iconBg: "bg-rose-100",
            iconColor: "text-rose-600",
            borderColor: "border-rose-200/50",
            description: "Quizzes taken",
            detail: `📊 ${passRate}% pass rate`
        },
        {
            id: "improvement",
            label: "Improvement",
            value: `${improvementRate}%`,
            icon: TrendingUp,
            color: "from-cyan-500/10 to-cyan-600/5",
            iconBg: "bg-cyan-100",
            iconColor: "text-cyan-600",
            borderColor: "border-cyan-200/50",
            description: "Progress trend",
            detail: `Latest is ${improvementRate >= 100 ? '✅' : '📈'} ${improvementRate >= 100 ? 'maintaining' : 'improving'}`
        },
    ];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    // Get color for progress bar
    const getProgressColor = (value) => {
        const num = parseInt(value);
        if (num >= 80) return "from-emerald-400 to-emerald-600";
        if (num >= 60) return "from-amber-400 to-amber-600";
        if (num >= 40) return "from-orange-400 to-orange-600";
        return "from-rose-400 to-rose-600";
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                        <Sparkles size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Quiz Statistics
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Comprehensive performance analysis
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">{totalAttempts} total</span>
                </div>
            </div>

            {/* Stats Grid - 3 columns */}
            <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const isPercentage = typeof stat.value === 'string' && stat.value.includes('%');
                    const numericValue = parseInt(stat.value) || 0;

                    return (
                        <motion.div
                            key={stat.id}
                            variants={itemVariants}
                            whileHover={{ 
                                y: -2,
                                transition: { duration: 0.2 }
                            }}
                            className={`
                                group p-4 rounded-xl 
                                bg-gradient-to-br ${stat.color}
                                border ${stat.borderColor}
                                transition-all duration-300
                                hover:shadow-md
                            `}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`
                                    p-2 rounded-lg ${stat.iconBg}
                                    transition-all duration-300 group-hover:scale-110
                                `}>
                                    <Icon size={16} className={stat.iconColor} />
                                </div>
                                {stat.id === 'latest_score' && trend.type !== 'neutral' && (
                                    <div className={`
                                        flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
                                        ${trend.type === 'up' ? 'bg-emerald-50' : 'bg-rose-50'}
                                    `}>
                                        {trend.type === 'up' ? 
                                            <TrendingUp size={10} className="text-emerald-500" /> : 
                                            <TrendingDown size={10} className="text-rose-500" />
                                        }
                                        <span className={`text-[8px] font-semibold ${trend.type === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {trend.value}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3">
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {stat.value}
                                </h3>
                            </div>

                            <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                {stat.label}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                                {stat.description}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1 border-t border-slate-200/50 pt-1">
                                {stat.detail}
                            </p>

                            {/* Progress Bar for percentages */}
                            {isPercentage && (
                                <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(numericValue, 100)}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className={`
                                            h-full rounded-full bg-gradient-to-r 
                                            ${getProgressColor(numericValue)}
                                        `}
                                    />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Quick summary footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock size={12} className="text-slate-400" />
                    <span>Last quiz: {quiz.last_attempt_date ? new Date(quiz.last_attempt_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className={`inline-block w-2 h-2 rounded-full ${quiz.latest_score >= 70 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span>{quiz.latest_score >= 70 ? '✅ On track' : '📈 Needs improvement'}</span>
                </div>
            </div>
        </motion.div>
    );
}

export default QuizReport;
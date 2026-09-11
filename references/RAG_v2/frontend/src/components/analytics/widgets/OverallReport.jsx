import { motion } from "framer-motion";
import { 
    BookOpen, 
    StickyNote, 
    Brain, 
    TrendingUp, 
    Map,
    Target,
    Award,
    Clock,
    Calendar,
    ChevronRight
} from "lucide-react";

function OverallReport({ dashboard }) {
    const { overview, roadmap, quiz } = dashboard;

    // Calculate additional metrics
    const totalResources = (overview.books || 0) + (overview.notes || 0);
    const completionRate = overview.books > 0 ? Math.round((overview.books_completed || 0) / overview.books * 100) : 0;
    const averagePerDay = overview.active_days > 0 ? Math.round(totalResources / overview.active_days) : 0;
    const quizPassRate = quiz?.total_attempts > 0 ? Math.round((quiz.passed || 0) / quiz.total_attempts * 100) : 0;

    const stats = [
        {
            id: "total_resources",
            label: "Total Resources",
            value: totalResources,
            icon: BookOpen,
            color: "from-indigo-500/10 to-indigo-600/5",
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
            borderColor: "border-indigo-200/50",
            description: "Books & notes combined",
            detail: `${overview.books || 0} books • ${overview.notes || 0} notes`
        },
        {
            id: "quiz_attempts",
            label: "Quiz Attempts",
            value: overview.quiz_attempts || 0,
            icon: Brain,
            color: "from-purple-500/10 to-purple-600/5",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            borderColor: "border-purple-200/50",
            description: "Total quizzes taken",
            detail: `Passed: ${quiz?.passed || 0} • Failed: ${(overview.quiz_attempts || 0) - (quiz?.passed || 0)}`
        },
        {
            id: "average_score",
            label: "Average Score",
            value: `${overview.average_score || 0}%`,
            icon: TrendingUp,
            color: "from-emerald-500/10 to-emerald-600/5",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-200/50",
            description: "Overall performance",
            detail: `Best: ${quiz?.best_score || 0}% • ${quizPassRate}% pass rate`
        },
        {
            id: "active_roadmaps",
            label: "Active Roadmaps",
            value: roadmap.active || 0,
            icon: Map,
            color: "from-rose-500/10 to-rose-600/5",
            iconBg: "bg-rose-100",
            iconColor: "text-rose-600",
            borderColor: "border-rose-200/50",
            description: "Learning paths in progress",
            detail: `Completed: ${roadmap.completed || 0} • Behind: ${roadmap.behind || 0}`
        },
        {
            id: "completion_rate",
            label: "Completion Rate",
            value: `${completionRate}%`,
            icon: Target,
            color: "from-amber-500/10 to-amber-600/5",
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            borderColor: "border-amber-200/50",
            description: "Books completed",
            detail: `${overview.books_completed || 0} of ${overview.books || 0} books`
        },
        {
            id: "active_days",
            label: "Active Days",
            value: overview.active_days || 0,
            icon: Calendar,
            color: "from-cyan-500/10 to-cyan-600/5",
            iconBg: "bg-cyan-100",
            iconColor: "text-cyan-600",
            borderColor: "border-cyan-200/50",
            description: "Days with activity",
            detail: `${averagePerDay} resources per day • ${overview.current_streak || 0}d streak`
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
                        <Award size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Overall Summary
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Comprehensive overview of your progress
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">Updated</span>
                </div>
            </div>

            {/* Stats Grid */}
            <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {stats.map((stat) => {
                    const Icon = stat.icon;

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

                            {/* Progress Bar */}
                            {typeof stat.value === 'string' && stat.value.includes('%') ? (
                                <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: stat.value }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className={`
                                            h-full rounded-full bg-gradient-to-r 
                                            ${stat.id === 'completion_rate' ? 'from-amber-400 to-amber-600' :
                                              'from-emerald-400 to-emerald-600'}
                                        `}
                                    />
                                </div>
                            ) : stat.id === 'total_resources' || stat.id === 'quiz_attempts' ? (
                                <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((stat.value / 50) * 100, 100)}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className={`
                                            h-full rounded-full bg-gradient-to-r 
                                            ${stat.id === 'total_resources' ? 'from-indigo-400 to-indigo-600' :
                                              'from-purple-400 to-purple-600'}
                                        `}
                                    />
                                </div>
                            ) : null}
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}

export default OverallReport;
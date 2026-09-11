import { motion } from "framer-motion";
import { 
    Clock, 
    ChevronRight, 
    CheckCircle, 
    XCircle,
    TrendingUp,
    TrendingDown
} from "lucide-react";

function RecentAttempts({ quiz }) {
    const attempts = quiz.recent_attempts || [];
    
    // Show only first 4 attempts initially
    const visibleAttempts = attempts.slice(0, 4);
    const hasMoreAttempts = attempts.length > 4;

    // Get time ago
    const getTimeAgo = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // Get status based on score
    const getStatus = (score) => {
        if (score >= 70) {
            return { label: "Passed", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" };
        } else if (score >= 50) {
            return { label: "Needs Work", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" };
        } else {
            return { label: "Failed", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" };
        }
    };

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
        hidden: { opacity: 0, x: -20 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: { duration: 0.3 }
        }
    };

    if (!attempts || attempts.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex items-center justify-center min-h-[200px]"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 mb-4">
                        <Clock size={40} className="text-indigo-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">No Attempts Yet</h3>
                    <p className="text-xs text-slate-400 mt-1">Start taking quizzes to see your progress</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-[420px] flex flex-col"
        >
            {/* Header - Fixed */}
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                            <Clock size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Recent Attempts
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">
                                Your latest quiz results
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-slate-400">{attempts.length} attempts</span>
                    </div>
                </div>
            </div>

            {/* Attempts List - Scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-hide -mx-2 px-2">
                <motion.div 
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {visibleAttempts.map((attempt, index) => {
                        const status = getStatus(attempt.percentage);
                        const StatusIcon = status.icon;

                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={{ 
                                    x: 4,
                                    transition: { duration: 0.2 }
                                }}
                                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-all duration-200 border border-transparent hover:border-slate-200/50"
                            >
                                {/* Date */}
                                <div className="flex-shrink-0 min-w-[80px]">
                                    <p className="text-sm font-medium text-slate-700">
                                        {new Date(attempt.date).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {getTimeAgo(attempt.date)}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${attempt.percentage}%` }}
                                                transition={{ duration: 0.8, delay: 0.1 }}
                                                className={`
                                                    h-full rounded-full 
                                                    ${attempt.percentage >= 70 ? 'bg-emerald-500' :
                                                      attempt.percentage >= 50 ? 'bg-amber-500' :
                                                      'bg-rose-500'}
                                                `}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Score & Status */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-sm font-bold text-slate-800 min-w-[40px] text-right">
                                        {attempt.percentage}%
                                    </span>
                                    <div className={`
                                        flex items-center gap-1 px-2 py-1 rounded-full
                                        ${status.bg}
                                    `}>
                                        <StatusIcon size={11} className={status.color} />
                                        <span className={`text-[9px] font-medium ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Show more indicator if there are more attempts */}
                    {hasMoreAttempts && (
                        <div className="text-center py-3">
                            <p className="text-xs text-slate-400">
                                + {attempts.length - 4} more attempts
                            </p>
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            </div>
                            <p className="text-[10px] text-slate-300 mt-1">
                                Scroll for more
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}

export default RecentAttempts;
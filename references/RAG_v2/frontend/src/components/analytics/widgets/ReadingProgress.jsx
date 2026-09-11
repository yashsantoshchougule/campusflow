import { motion } from "framer-motion";
import { BookOpen, Calendar, TrendingUp, Award } from "lucide-react";

function ReadingProgress({ study }) {
    const progress = study.reading_progress || 0;
    
    // Calculate circle circumference
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    // Get progress color based on percentage
    const getProgressColor = () => {
        if (progress < 30) return "#818cf8";
        if (progress < 60) return "#34d399";
        if (progress < 80) return "#fbbf24";
        return "#f472b6";
    };

    // Get progress emoji
    const getEmoji = () => {
        if (progress < 25) return "🌱";
        if (progress < 50) return "📖";
        if (progress < 75) return "💪";
        if (progress < 90) return "🔥";
        return "🏆";
    };

    // Get message based on progress
    const getMessage = () => {
        if (progress < 25) return "Great start!";
        if (progress < 50) return "Keep going!";
        if (progress < 75) return "Almost there!";
        if (progress < 90) return "You're on fire!";
        return "Reading champion!";
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
                        <BookOpen size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Reading Progress
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Your reading journey
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">Active</span>
                </div>
            </div>

            {/* Progress Circle */}
            <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-48 h-48">
                    {/* Background Circle */}
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            stroke="#f1f5f9"
                            strokeWidth="8"
                            fill="none"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            stroke={getProgressColor()}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform="rotate(-90 60 60)"
                        >
                            <animate
                                attributeName="stroke-dashoffset"
                                from={circumference}
                                to={offset}
                                dur="1.5s"
                                fill="freeze"
                            />
                        </circle>
                    </svg>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-slate-800">
                            {progress}%
                        </span>
                        <span className="text-sm text-slate-500 font-medium">
                            {getMessage()}
                        </span>
                        <span className="text-2xl mt-1">
                            {getEmoji()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/50">
                    <div className="flex items-center justify-center gap-1.5">
                        <BookOpen size={14} className="text-indigo-500" />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
                        Pages Read
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        {study.pages_read || 0}
                    </p>
                </div>
                <div className="text-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/50">
                    <div className="flex items-center justify-center gap-1.5">
                        <Calendar size={14} className="text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
                        Days Active
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        {study.days_active || 0}
                    </p>
                </div>
                <div className="text-center p-2 rounded-xl bg-slate-50/80 border border-slate-200/50">
                    <div className="flex items-center justify-center gap-1.5">
                        <Award size={14} className="text-amber-500" />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
                        Streak
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        {study.streak || 0}d
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default ReadingProgress;
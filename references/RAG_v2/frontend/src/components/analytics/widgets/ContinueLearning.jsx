import { motion } from "framer-motion";
import { 
    BookOpen, 
    TrendingUp, 
    Clock, 
    ChevronRight,
    Calendar,
    Target,
    Award,
    Play,
    Bookmark
} from "lucide-react";

function ContinueLearning({ study }) {
    const book = study?.currently_reading;

    if (!book) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center"
            >
                <div className="flex flex-col items-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 mb-4">
                        <BookOpen size={40} className="text-indigo-300" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-700 mb-2">
                        Continue Learning
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                        No books uploaded yet
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                        Start your learning journey today
                    </p>
                </div>
            </motion.div>
        );
    }

    const progress = Math.round(
        (book.current_page / book.total_pages) * 100
    );

    // Get progress color based on percentage
    const getProgressColor = () => {
        if (progress < 30) return "from-emerald-400 to-emerald-600";
        if (progress < 60) return "from-indigo-400 to-indigo-600";
        if (progress < 80) return "from-purple-400 to-purple-600";
        return "from-rose-400 to-rose-600";
    };

    // Get progress emoji
    const getProgressEmoji = () => {
        if (progress < 25) return "🌱";
        if (progress < 50) return "📖";
        if (progress < 75) return "💪";
        if (progress < 90) return "🔥";
        return "🏆";
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                        <BookOpen size={20} className="text-indigo-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-slate-800">
                            Continue Learning
                        </h2>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                            <span>{getProgressEmoji()}</span>
                            <span>{getMotivationalMessage(progress)}</span>
                        </p>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <Bookmark size={16} className="text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                {/* Book Title */}
                <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                        {book.title}
                    </h3>
                    {book.author && (
                        <p className="text-sm text-slate-500 mt-0.5">
                            {book.author}
                        </p>
                    )}
                </div>

                {/* Progress Section */}
                <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Target size={14} className="text-slate-400" />
                                <span className="text-sm text-slate-600">
                                    Page <span className="font-semibold text-slate-800">{book.current_page}</span> of <span className="font-semibold text-slate-800">{book.total_pages}</span>
                                </span>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                            {progress}%
                        </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`
                                h-full rounded-full bg-gradient-to-r ${getProgressColor()}
                                transition-all duration-500
                            `}
                        />
                    </div>
                </div>

                {/* Stats Grid - Matching other cards style */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/50">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            Pages Read
                        </p>
                        <p className="text-base font-bold text-slate-700 mt-0.5">
                            {book.current_page}
                        </p>
                    </div>
                    <div className="text-center p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/50">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            Remaining
                        </p>
                        <p className="text-base font-bold text-slate-700 mt-0.5">
                            {book.total_pages - book.current_page}
                        </p>
                    </div>
                    <div className="text-center p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/50">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            Streak
                        </p>
                        <p className="text-base font-bold text-slate-700 mt-0.5">
                            {book.streak || 3}d
                        </p>
                    </div>
                </div>

                {/* Continue Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full group flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                    <Play size={16} className="fill-white" />
                    <span>Continue Reading</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                </motion.button>

                {/* Last Read */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={12} className="text-slate-400" />
                        <span>Last read: {book.last_read || 'Today'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Award size={12} className="text-slate-400" />
                        <span>{getAchievementMessage(progress)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Helper functions
function getMotivationalMessage(progress) {
    if (progress < 25) return "Great start! Keep going";
    if (progress < 50) return "You're making progress";
    if (progress < 75) return "Halfway there! Keep going";
    if (progress < 90) return "Almost finished!";
    return "You're almost done!";
}

function getAchievementMessage(progress) {
    if (progress < 25) return "Beginner";
    if (progress < 50) return "Growing";
    if (progress < 75) return "Dedicated";
    if (progress < 90) return "Committed";
    return "Champion! 🏆";
}

export default ContinueLearning;
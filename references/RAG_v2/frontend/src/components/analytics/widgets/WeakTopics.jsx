import { motion } from "framer-motion";
import { 
    AlertTriangle, 
    TrendingDown, 
    BookOpen,
    ChevronRight,
    Target
} from "lucide-react";

function WeakTopics({ quiz }) {
    const topics = quiz.weak_topics || [];
    
    // Show all topics, but with scroll indicator
    const hasMoreTopics = topics.length > 4;

    // Get color based on count
    const getColor = (count) => {
        if (count >= 4) return "from-rose-500 to-rose-600";
        if (count >= 3) return "from-orange-500 to-orange-600";
        if (count >= 2) return "from-amber-500 to-amber-600";
        return "from-yellow-500 to-yellow-600";
    };

    // Get severity label
    const getSeverity = (count) => {
        if (count >= 4) return { label: "Critical", color: "text-rose-600", bg: "bg-rose-50" };
        if (count >= 3) return { label: "High", color: "text-orange-600", bg: "bg-orange-50" };
        if (count >= 2) return { label: "Medium", color: "text-amber-600", bg: "bg-amber-50" };
        return { label: "Low", color: "text-yellow-600", bg: "bg-yellow-50" };
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
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

    if (!topics || topics.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex items-center justify-center min-h-[200px]"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-200/30 mb-4">
                        <Target size={40} className="text-emerald-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">No Weak Topics</h3>
                    <p className="text-xs text-slate-400 mt-1">You're doing great! Keep it up! 🎉</p>
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
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-200/30">
                            <AlertTriangle size={20} className="text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Weak Topics
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">
                                Areas that need improvement
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                        <span className="text-slate-400">{topics.length} topics</span>
                    </div>
                </div>
            </div>

            {/* Topics List - Scrollable with all data */}
            <div className="flex-1 overflow-y-auto scrollbar-hide -mx-2 px-2">
                <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {topics.map((topic) => {
                        const severity = getSeverity(topic.count);
                        const progress = Math.min(topic.count * 20, 100);

                        return (
                            <motion.div
                                key={topic.topic}
                                variants={itemVariants}
                                whileHover={{ 
                                    x: 4,
                                    transition: { duration: 0.2 }
                                }}
                                className="group p-4 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50 transition-all duration-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        {/* Topic Name */}
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-slate-800 truncate">
                                                {topic.topic}
                                            </h3>
                                            <span className={`
                                                text-[9px] font-medium px-2 py-0.5 rounded-full
                                                ${severity.bg} ${severity.color}
                                            `}>
                                                {severity.label}
                                            </span>
                                        </div>
                                        
                                        {/* Progress Info */}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen size={12} className="text-slate-400" />
                                                <span className="text-xs text-slate-500">
                                                    {topic.count} incorrect attempts
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                                className={`
                                                    h-full rounded-full bg-gradient-to-r 
                                                    ${getColor(topic.count)}
                                                `}
                                            />
                                        </div>
                                    </div>

                                    {/* Percentage */}
                                    <div className="flex-shrink-0 text-right">
                                        <span className="text-sm font-bold text-slate-700">
                                            {progress}%
                                        </span>
                                        <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1 inline" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Scroll indicator - shows when there are more than 4 topics */}
                    {hasMoreTopics && (
                        <div className="text-center py-4">
                            <p className="text-xs text-slate-400 font-medium">
                                + {topics.length - 4} more topics
                            </p>
                            <div className="flex items-center justify-center gap-1.5 mt-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">
                                Scroll for more
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Footer Tip - Fixed */}
            <div className="flex-shrink-0 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <TrendingDown size={14} className="text-slate-400" />
                    <span>Focus on these topics to improve your scores</span>
                </div>
            </div>
        </motion.div>
    );
}

export default WeakTopics;
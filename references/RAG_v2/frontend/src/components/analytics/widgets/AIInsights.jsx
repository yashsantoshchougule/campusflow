import {
    TrendingUp,
    Target,
    BookOpen,
    AlertTriangle,
    Lightbulb,
    Sparkles,
    Zap,
    Clock,
    ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

function AIInsights({ dashboard }) {
    const { overview, quiz, roadmap } = dashboard;

    const insights = [];

    // Performance Insight
    insights.push({
        icon: TrendingUp,
        title: "Average Performance",
        message: `Your average quiz score is ${overview.average_score}%.`,
        color: "text-indigo-500",
        bg: "bg-indigo-100",
        border: "border-indigo-200/50",
        gradient: "from-indigo-500/10 to-indigo-600/5",
        type: "performance"
    });

    // Learning Progress Insight
    insights.push({
        icon: BookOpen,
        title: "Learning Progress",
        message: `You currently have ${overview.books} books and ${overview.notes} notes available.`,
        color: "text-emerald-500",
        bg: "bg-emerald-100",
        border: "border-emerald-200/50",
        gradient: "from-emerald-500/10 to-emerald-600/5",
        type: "progress"
    });

    // Weak Topic Insight
    if (quiz.weak_topics.length > 0) {
        insights.push({
            icon: AlertTriangle,
            title: "Weakest Topic",
            message: `Focus on "${quiz.weak_topics[0].topic}".`,
            color: "text-amber-500",
            bg: "bg-amber-100",
            border: "border-amber-200/50",
            gradient: "from-amber-500/10 to-amber-600/5",
            type: "warning"
        });
    }

    // Roadmap Insight
    if (roadmap.active > 0) {
        insights.push({
            icon: Target,
            title: "Roadmap Progress",
            message: `Your next roadmap deadline is ${roadmap.next_deadline}.`,
            color: "text-purple-500",
            bg: "bg-purple-100",
            border: "border-purple-200/50",
            gradient: "from-purple-500/10 to-purple-600/5",
            type: "roadmap"
        });
    }

    // Additional Insight: Study Streak
    if (overview.current_streak > 0) {
        insights.push({
            icon: Zap,
            title: "Current Streak",
            message: `You're on a ${overview.current_streak} day learning streak! Keep it up! 🔥`,
            color: "text-orange-500",
            bg: "bg-orange-100",
            border: "border-orange-200/50",
            gradient: "from-orange-500/10 to-orange-600/5",
            type: "streak"
        });
    }

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

    // Get priority badge
    const getPriority = (type) => {
        const priorities = {
            warning: { label: "Action Needed", color: "text-amber-600", bg: "bg-amber-50" },
            performance: { label: "Analysis", color: "text-indigo-600", bg: "bg-indigo-50" },
            progress: { label: "Progress", color: "text-emerald-600", bg: "bg-emerald-50" },
            roadmap: { label: "Plan", color: "text-purple-600", bg: "bg-purple-50" },
            streak: { label: "Achievement", color: "text-orange-600", bg: "bg-orange-50" }
        };
        return priorities[type] || priorities.progress;
    };

    if (insights.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 h-[400px] flex items-center justify-center"
            >
                <div className="flex flex-col items-center p-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 mb-4">
                        <Lightbulb size={40} className="text-indigo-300" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-700 mb-2">
                        AI Insights
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                        No insights available yet
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                        Continue learning to get personalized insights
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 h-[480px] flex flex-col overflow-hidden"
        >
            {/* Header - Fixed */}
            <div className="p-6 pb-0 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                            <Sparkles size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                AI Insights
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">
                                Personalized learning recommendations
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-slate-400">AI Powered</span>
                    </div>
                </div>
            </div>

            {/* Insights List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 scrollbar-hide">
                <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {insights.map((item, index) => {
                        const Icon = item.icon;
                        const priority = getPriority(item.type);

                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                whileHover={{ 
                                    x: 4,
                                    transition: { duration: 0.2 }
                                }}
                                className={`
                                    group relative p-4 rounded-xl 
                                    bg-gradient-to-br ${item.gradient}
                                    border ${item.border}
                                    transition-all duration-300
                                    hover:shadow-md
                                `}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`
                                        flex-shrink-0 p-2.5 rounded-xl ${item.bg}
                                        transition-all duration-300 group-hover:scale-110
                                    `}>
                                        <Icon size={18} className={item.color} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-slate-800">
                                                        {item.title}
                                                    </h3>
                                                    <span className={`
                                                        text-[9px] font-medium px-2 py-0.5 rounded-full
                                                        ${priority.bg} ${priority.color}
                                                    `}>
                                                        {priority.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                                    {item.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chevron on hover */}
                                    <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 mt-1" />
                                </div>

                                {/* Decorative gradient line */}
                                <div className={`
                                    absolute bottom-0 left-0 right-0 h-0.5 
                                    bg-gradient-to-r ${item.gradient}
                                    opacity-0 group-hover:opacity-100
                                    transition-opacity duration-300
                                `} />
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </motion.div>
    );
}

export default AIInsights;
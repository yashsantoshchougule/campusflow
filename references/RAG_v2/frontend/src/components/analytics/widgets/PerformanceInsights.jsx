import { motion } from "framer-motion";
import { 
    TrendingUp, 
    BookOpen, 
    Layers, 
    Award,
    Target,
    Sparkles,
    ChevronRight
} from "lucide-react";

function PerformanceInsights({ dashboard }) {
    const { quiz, overview, study } = dashboard;

    const insights = [
        {
            id: "average_score",
            title: "Average Quiz Score",
            value: `${quiz.average_score || 0}%`,
            icon: TrendingUp,
            color: "from-indigo-500/10 to-indigo-600/5",
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
            borderColor: "border-indigo-200/50",
            subtitle: "Overall performance",
            progress: quiz.average_score || 0
        },
        {
            id: "reading_progress",
            title: "Reading Progress",
            value: `${study.reading_progress || 0}%`,
            icon: BookOpen,
            color: "from-emerald-500/10 to-emerald-600/5",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-200/50",
            subtitle: "Books completed",
            progress: study.reading_progress || 0
        },
        {
            id: "total_resources",
            title: "Total Learning Resources",
            value: (overview.books || 0) + (overview.notes || 0),
            icon: Layers,
            color: "from-purple-500/10 to-purple-600/5",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            borderColor: "border-purple-200/50",
            subtitle: "Books & Notes combined",
            progress: Math.min(((overview.books || 0) + (overview.notes || 0)) / 20 * 100, 100)
        },
    ];

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

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-[420px] flex flex-col"
        >
            {/* Header */}
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                            <Sparkles size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Performance Insights
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">
                                Key metrics at a glance
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-slate-400">Updated</span>
                    </div>
                </div>
            </div>

            {/* Insights List - Scrollable if needed */}
            <div className="flex-1 overflow-y-auto scrollbar-hide -mx-2 px-2">
                <motion.div 
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {insights.map((item) => {
                        const Icon = item.icon;

                        return (
                            <motion.div
                                key={item.id}
                                variants={itemVariants}
                                whileHover={{ 
                                    x: 4,
                                    transition: { duration: 0.2 }
                                }}
                                className={`
                                    group p-4 rounded-xl 
                                    bg-gradient-to-br ${item.color}
                                    border ${item.borderColor}
                                    transition-all duration-300
                                    hover:shadow-md
                                `}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                p-2 rounded-lg ${item.iconBg}
                                                transition-all duration-300 group-hover:scale-110
                                            `}>
                                                <Icon size={16} className={item.iconColor} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {item.title}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-slate-800">
                                            {item.value}
                                        </span>
                                        <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(item.progress, 100)}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className={`
                                            h-full rounded-full bg-gradient-to-r 
                                            ${item.id === 'average_score' ? 'from-indigo-400 to-indigo-600' :
                                              item.id === 'reading_progress' ? 'from-emerald-400 to-emerald-600' :
                                              'from-purple-400 to-purple-600'}
                                        `}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </motion.div>
    );
}

export default PerformanceInsights;
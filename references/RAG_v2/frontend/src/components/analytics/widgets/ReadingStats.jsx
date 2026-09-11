import { motion } from "framer-motion";
import { 
    BookOpen, 
    TrendingUp, 
    Clock, 
    Award,
    ChevronRight,
    Calendar,
    Target
} from "lucide-react";

function ReadingStats({ study }) {
    const stats = [
        {
            id: "books_read",
            title: "Books Read Recently",
            value: study.recent_books?.length || 0,
            icon: BookOpen,
            color: "from-indigo-500/10 to-indigo-600/5",
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
            borderColor: "border-indigo-200/50",
            subtitle: "Total books",
            progress: Math.min((study.recent_books?.length || 0) / 10 * 100, 100)
        },
        {
            id: "overall_progress",
            title: "Overall Progress",
            value: `${study.reading_progress || 0}%`,
            icon: TrendingUp,
            color: "from-emerald-500/10 to-emerald-600/5",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-200/50",
            subtitle: "Reading completion",
            progress: study.reading_progress || 0
        },
        {
            id: "pages_read",
            title: "Pages Read",
            value: study.pages_read || 0,
            icon: Target,
            color: "from-purple-500/10 to-purple-600/5",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            borderColor: "border-purple-200/50",
            subtitle: "Total pages",
            progress: Math.min((study.pages_read || 0) / 500 * 100, 100)
        },
        {
            id: "streak",
            title: "Reading Streak",
            value: `${study.streak || 0}d`,
            icon: Award,
            color: "from-amber-500/10 to-amber-600/5",
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            borderColor: "border-amber-200/50",
            subtitle: "Current streak",
            progress: Math.min((study.streak || 0) / 30 * 100, 100)
        },
    ];

    // Current book info
    const currentBook = study.currently_reading;

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
        hidden: { opacity: 0, scale: 0.9 },
        visible: { 
            opacity: 1, 
            scale: 1,
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
                        <BookOpen size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Reading Statistics
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Your reading overview
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
                className="grid grid-cols-2 gap-4"
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
                                {stat.value > 0 && (
                                    <span className="text-[10px] font-medium text-slate-400">
                                        {stat.subtitle}
                                    </span>
                                )}
                            </div>

                            <div className="mt-3">
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {stat.value}
                                </h3>
                            </div>

                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                                {stat.title}
                            </p>

                            {/* Progress Bar */}
                            <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(stat.progress, 100)}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className={`
                                        h-full rounded-full bg-gradient-to-r 
                                        ${stat.id === 'books_read' ? 'from-indigo-400 to-indigo-600' :
                                          stat.id === 'overall_progress' ? 'from-emerald-400 to-emerald-600' :
                                          stat.id === 'pages_read' ? 'from-purple-400 to-purple-600' :
                                          'from-amber-400 to-amber-600'}
                                    `}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Current Book Section */}
            {currentBook && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between group p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50 transition-all duration-300 hover:shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-100">
                                <BookOpen size={16} className="text-rose-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                    Currently Reading
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {currentBook.title}
                                </p>
                                {currentBook.author && (
                                    <p className="text-xs text-slate-500">
                                        by {currentBook.author}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400">Progress</p>
                                <p className="text-xs font-bold text-slate-700">
                                    {Math.round((currentBook.current_page / currentBook.total_pages) * 100)}%
                                </p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default ReadingStats;
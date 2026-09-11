import { 
    TrendingUp, 
    Award, 
    Target, 
    BookOpen,
    TrendingDown,
    Minus
} from "lucide-react";
import { motion } from "framer-motion";

function PerformanceSummary({ dashboard }) {
    const { overview, quiz } = dashboard;

    // Calculate trend (example - replace with actual data)
    const getTrend = (current, previous) => {
        if (!previous) return { value: 0, type: 'neutral' };
        const diff = ((current - previous) / previous * 100);
        if (diff > 0) return { value: Math.abs(diff).toFixed(1), type: 'up' };
        if (diff < 0) return { value: Math.abs(diff).toFixed(1), type: 'down' };
        return { value: 0, type: 'neutral' };
    };

    const cards = [
        {
            id: "average_score",
            title: "Average Score",
            value: `${quiz.average_score || 0}%`,
            icon: TrendingUp,
            color: "from-indigo-500/10 to-indigo-600/5",
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
            borderColor: "border-indigo-200/50",
            trend: getTrend(quiz.average_score, quiz.previous_average_score),
            subtitle: "Overall performance"
        },
        {
            id: "best_score",
            title: "Best Score",
            value: `${quiz.best_score || 0}%`,
            icon: Award,
            color: "from-amber-500/10 to-amber-600/5",
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            borderColor: "border-amber-200/50",
            trend: getTrend(quiz.best_score, quiz.previous_best_score),
            subtitle: "Your highest achievement"
        },
        {
            id: "total_attempts",
            title: "Total Attempts",
            value: quiz.total_attempts || 0,
            icon: Target,
            color: "from-purple-500/10 to-purple-600/5",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            borderColor: "border-purple-200/50",
            trend: getTrend(quiz.total_attempts, quiz.previous_total_attempts),
            subtitle: "Total quizzes taken"
        },
        {
            id: "books",
            title: "Books",
            value: overview.books || 0,
            icon: BookOpen,
            color: "from-emerald-500/10 to-emerald-600/5",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-200/50",
            trend: getTrend(overview.books, overview.previous_books),
            subtitle: "Total resources"
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

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.3 }
        }
    };

    const TrendIcon = ({ type }) => {
        if (type === 'up') return <TrendingUp size={12} className="text-emerald-500" />;
        if (type === 'down') return <TrendingDown size={12} className="text-rose-500" />;
        return <Minus size={12} className="text-slate-400" />;
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
                        <TrendingUp size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Performance Summary
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

            {/* Cards Grid */}
            <motion.div 
                className="grid grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <motion.div
                            key={card.id}
                            variants={cardVariants}
                            whileHover={{ 
                                y: -2,
                                transition: { duration: 0.2 }
                            }}
                            className={`
                                group relative p-4 rounded-xl 
                                bg-gradient-to-br ${card.color}
                                border ${card.borderColor}
                                transition-all duration-300
                                hover:shadow-md
                            `}
                        >
                            {/* Icon */}
                            <div className={`
                                inline-flex p-2 rounded-lg ${card.iconBg}
                                transition-all duration-300 group-hover:scale-110
                            `}>
                                <Icon size={16} className={card.iconColor} />
                            </div>

                            {/* Value */}
                            <div className="mt-3">
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {card.value}
                                </h3>
                            </div>

                            {/* Title */}
                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                                {card.title}
                            </p>

                            {/* Subtitle */}
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                {card.subtitle}
                            </p>

                            {/* Trend Indicator */}
                            {card.trend && card.trend.type !== 'neutral' && (
                                <div className={`
                                    absolute top-4 right-4 flex items-center gap-1 px-1.5 py-0.5 rounded-full
                                    ${card.trend.type === 'up' ? 'bg-emerald-50' : 'bg-rose-50'}
                                `}>
                                    <TrendIcon type={card.trend.type} />
                                    <span className={`
                                        text-[9px] font-semibold
                                        ${card.trend.type === 'up' ? 'text-emerald-600' : 'text-rose-600'}
                                    `}>
                                        {card.trend.value}%
                                    </span>
                                </div>
                            )}

                            {/* Progress Bar */}
                            <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: typeof card.value === 'string' ? 
                                        parseInt(card.value) || 70 : 
                                        Math.min((card.value / 100) * 100, 100) || 70 
                                    }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className={`
                                        h-full rounded-full bg-gradient-to-r 
                                        ${card.id === 'average_score' ? 'from-indigo-400 to-indigo-600' :
                                          card.id === 'best_score' ? 'from-amber-400 to-amber-600' :
                                          card.id === 'total_attempts' ? 'from-purple-400 to-purple-600' :
                                          'from-emerald-400 to-emerald-600'}
                                    `}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}

export default PerformanceSummary;
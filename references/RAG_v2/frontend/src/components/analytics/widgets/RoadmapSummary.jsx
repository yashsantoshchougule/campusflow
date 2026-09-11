import { 
    Map, 
    Target, 
    Clock, 
    TrendingUp,
    TrendingDown,
    Minus
} from "lucide-react";
import { motion } from "framer-motion";

function RoadmapSummary({ roadmap }) {
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
            id: "active",
            title: "Active",
            value: roadmap.active || 0,
            icon: Map,
            color: "from-indigo-500/10 to-indigo-600/5",
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-600",
            borderColor: "border-indigo-200/50",
            subtitle: "Currently in progress",
            trend: getTrend(roadmap.active, roadmap.previous_active)
        },
        {
            id: "completed",
            title: "Completed",
            value: roadmap.completed || 0,
            icon: Target,
            color: "from-emerald-500/10 to-emerald-600/5",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-200/50",
            subtitle: "Successfully finished",
            trend: getTrend(roadmap.completed, roadmap.previous_completed)
        },
        {
            id: "behind",
            title: "Behind",
            value: roadmap.behind || 0,
            icon: Clock,
            color: "from-rose-500/10 to-rose-600/5",
            iconBg: "bg-rose-100",
            iconColor: "text-rose-600",
            borderColor: "border-rose-200/50",
            subtitle: "Need more focus",
            trend: getTrend(roadmap.behind, roadmap.previous_behind)
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
                        <Map size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Roadmap Summary
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Your learning journey at a glance
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
                className="grid grid-cols-3 gap-4"
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
                                text-center
                            `}
                        >
                            <div className="flex items-center justify-between">
                                <div className={`
                                    p-2 rounded-lg ${card.iconBg}
                                    transition-all duration-300 group-hover:scale-110
                                    mx-auto
                                `}>
                                    <Icon size={16} className={card.iconColor} />
                                </div>
                                {card.trend && card.trend.type !== 'neutral' && (
                                    <div className={`
                                        flex items-center gap-1 px-1.5 py-0.5 rounded-full
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
                            </div>

                            <div className="mt-3">
                                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                                    {card.value}
                                </h3>
                            </div>

                            <p className="text-sm font-medium text-slate-500 mt-1">
                                {card.title}
                            </p>

                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                {card.subtitle}
                            </p>

                            {/* Progress Bar */}
                            <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: Math.min((card.value / 10) * 100, 100) }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className={`
                                        h-full rounded-full bg-gradient-to-r 
                                        ${card.id === 'active' ? 'from-indigo-400 to-indigo-600' :
                                          card.id === 'completed' ? 'from-emerald-400 to-emerald-600' :
                                          'from-rose-400 to-rose-600'}
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

export default RoadmapSummary;
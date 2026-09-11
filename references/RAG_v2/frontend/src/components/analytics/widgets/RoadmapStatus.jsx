import { motion } from "framer-motion";
import { Map, Target, Clock, TrendingUp } from "lucide-react";

function RoadmapStatus({ roadmap }) {
    const data = [
        {
            name: "Active",
            value: roadmap.active || 0,
            icon: Map,
            color: "#818cf8",
            bg: "bg-indigo-50",
            textColor: "text-indigo-600",
            barColor: "from-indigo-400 to-indigo-600"
        },
        {
            name: "Completed",
            value: roadmap.completed || 0,
            icon: Target,
            color: "#34d399",
            bg: "bg-emerald-50",
            textColor: "text-emerald-600",
            barColor: "from-emerald-400 to-emerald-600"
        },
        {
            name: "Behind",
            value: roadmap.behind || 0,
            icon: Clock,
            color: "#f87171",
            bg: "bg-rose-50",
            textColor: "text-rose-600",
            barColor: "from-rose-400 to-rose-600"
        },
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex items-center justify-center h-[180px]"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="p-2 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/30 mb-2">
                        <Map size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-700">No Roadmaps</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Start your journey</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                        <TrendingUp size={14} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-slate-800">Roadmap Status</h2>
                        <p className="text-[8px] text-slate-400 font-medium">Overview of your paths</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[9px]">
                    <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">{total} total</span>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2.5">
                {data.map((item, index) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded ${item.bg}`}>
                                    <Icon size={10} className={item.textColor} />
                                </div>
                                <span className="text-[10px] font-medium text-slate-600 flex-1">
                                    {item.name}
                                </span>
                                <span className="text-[10px] font-bold text-slate-700">
                                    {item.value}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                    ({percentage.toFixed(0)}%)
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className={`h-full rounded-full bg-gradient-to-r ${item.barColor}`}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

export default RoadmapStatus;
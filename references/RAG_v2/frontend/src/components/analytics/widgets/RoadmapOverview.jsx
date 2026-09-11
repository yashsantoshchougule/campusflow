import { motion } from "framer-motion";
import { 
    Map, 
    Calendar, 
    TrendingUp, 
    Target,
    Clock,
    ChevronRight
} from "lucide-react";

function RoadmapOverview({ roadmap }) {
    const hasData = roadmap.nearest_subject || roadmap.next_deadline || roadmap.active > 0;

    // Get status color for active roadmaps
    const getStatusColor = (active) => {
        if (active >= 5) return "text-emerald-500";
        if (active >= 3) return "text-indigo-500";
        if (active >= 1) return "text-amber-500";
        return "text-slate-400";
    };

    const getStatusBg = (active) => {
        if (active >= 5) return "bg-emerald-50 border-emerald-200/50";
        if (active >= 3) return "bg-indigo-50 border-indigo-200/50";
        if (active >= 1) return "bg-amber-50 border-amber-200/50";
        return "bg-slate-50 border-slate-200/50";
    };

    const getStatusLabel = (active) => {
        if (active >= 5) return "Excellent";
        if (active >= 3) return "Good";
        if (active >= 1) return "Active";
        return "No active";
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-5"
        >
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                        <Map size={16} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">
                            Current Roadmap
                        </h2>
                        <p className="text-[9px] text-slate-400 font-medium">
                            Your active learning path
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400">Live</span>
                </div>
            </div>

            {hasData ? (
                <div className="space-y-3">
                    {/* Current Subject */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50">
                        <div className="p-2 rounded-lg bg-indigo-100">
                            <Map size={14} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                Current Subject
                            </p>
                            <p className="text-sm font-semibold text-slate-800 truncate">
                                {roadmap.nearest_subject || "Not assigned"}
                            </p>
                        </div>
                    </div>

                    {/* Next Deadline */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50">
                        <div className="p-2 rounded-lg bg-amber-100">
                            <Calendar size={14} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                Next Deadline
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                                {roadmap.next_deadline ? 
                                    new Date(roadmap.next_deadline).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                    }) : 
                                    "No deadline"
                                }
                            </p>
                        </div>
                    </div>

                    {/* Active Roadmaps with Status */}
                    <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br ${getStatusBg(roadmap.active)} border`}>
                        <div className="p-2 rounded-lg bg-white/50">
                            <TrendingUp size={14} className={getStatusColor(roadmap.active)} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                Active Roadmaps
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">
                                    {roadmap.active || 0}
                                </span>
                                <span className={`text-[10px] font-medium ${getStatusColor(roadmap.active)}`}>
                                    • {getStatusLabel(roadmap.active)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(roadmap.active || 0, 5))].map((_, i) => (
                                <span 
                                    key={i}
                                    className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // Compact Empty State
                <div className="flex flex-col items-center justify-center py-6">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/30 mb-3">
                        <Map size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">No Active Roadmap</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Start a new learning path</p>
                </div>
            )}
        </motion.div>
    );
}

export default RoadmapOverview;
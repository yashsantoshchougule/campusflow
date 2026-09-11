import { motion } from "framer-motion";
import { Map, Sparkles, Calendar, Target, TrendingUp } from "lucide-react";
import RoadmapSummary from "../widgets/RoadmapSummary";
import RoadmapStatus from "../widgets/RoadmapStatus";
import UpcomingDeadline from "../widgets/UpcomingDeadline";
import RoadmapOverview from "../widgets/RoadmapOverview";

function Roadmaps({ dashboard }) {
    const { roadmap } = dashboard;

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

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Page Header */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2"
            >
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                        Learning Roadmaps
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Track your learning paths and achieve your goals
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-700">Active</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/50">
                        <Map size={14} className="text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-700">{roadmap.active || 0} Active</span>
                    </div>
                </div>
            </motion.div>

            {/* First Row: Summary + Upcoming Deadline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="h-full">
                    <RoadmapSummary roadmap={roadmap} />
                </motion.div>
                <motion.div variants={itemVariants} className="h-full">
                    <UpcomingDeadline roadmap={roadmap} />
                </motion.div>
            </div>

            {/* Second Row: Status + Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="h-full">
                    <RoadmapStatus roadmap={roadmap} />
                </motion.div>
                <motion.div variants={itemVariants} className="h-full">
                    <RoadmapOverview roadmap={roadmap} />
                </motion.div>
            </div>

            {/* Quick Stats Footer */}
            <motion.div 
                variants={itemVariants}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2"
            >
                {[
                    { label: "Active Roadmaps", value: roadmap.active || 0, icon: Map, color: "text-indigo-500" },
                    { label: "Completed", value: roadmap.completed || 0, icon: Target, color: "text-emerald-500" },
                    { label: "Upcoming Deadlines", value: roadmap.upcoming_deadlines?.length || 0, icon: Calendar, color: "text-amber-500" },
                    { label: "Progress", value: `${roadmap.progress || 0}%`, icon: TrendingUp, color: "text-purple-500" },
                ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div 
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-slate-200/50"
                        >
                            <div className={`p-2 rounded-lg bg-slate-50`}>
                                <Icon size={16} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                                <p className="text-sm font-bold text-slate-700">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}

export default Roadmaps;
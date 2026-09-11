import { 
    BookOpen,
    Brain,
    FileText,
    Map,
    Clock,
    ChevronRight,
    TrendingUp,
    Play,
    CheckCircle,
    Calendar,
    Target,
    Award,
    Activity
} from "lucide-react";
import { motion } from "framer-motion";

function ActivitySummary({ dashboard }) {
    const { activity } = dashboard;

    // Get icon with colored background
    const getIcon = (type) => {
        const icons = {
            book: { 
                icon: BookOpen, 
                bg: "bg-indigo-100", 
                color: "text-indigo-600",
                label: "Book"
            },
            quiz: { 
                icon: Brain, 
                bg: "bg-purple-100", 
                color: "text-purple-600",
                label: "Quiz"
            },
            note: { 
                icon: FileText, 
                bg: "bg-emerald-100", 
                color: "text-emerald-600",
                label: "Note"
            },
            roadmap: { 
                icon: Map, 
                bg: "bg-rose-100", 
                color: "text-rose-600",
                label: "Roadmap"
            },
        };
        return icons[type] || icons.note;
    };

    // Get time ago string
    const getTimeAgo = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // Get status for each activity
    const getStatus = (index) => {
        const statuses = [
            { label: "Completed", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "In Progress", icon: Play, color: "text-indigo-500", bg: "bg-indigo-50" },
            { label: "New", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
        ];
        return statuses[index % statuses.length];
    };

    // Calculate summary stats
    const totalActivities = activity?.length || 0;
    const completedActivities = activity?.filter((_, i) => i % 3 === 0).length || 0;
    const inProgressActivities = activity?.filter((_, i) => i % 3 === 1).length || 0;
    const newActivities = activity?.filter((_, i) => i % 3 === 2).length || 0;

    // Show first 6 items
    const visibleActivity = activity?.slice(0, 6) || [];
    const hasMoreActivity = activity?.length > 6;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
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

    if (!activity || activity.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex items-center justify-center min-h-[300px]"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 mb-4">
                        <Clock size={40} className="text-indigo-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">No Activity Yet</h3>
                    <p className="text-xs text-slate-400 mt-1">Start learning to see your progress</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                        <Activity size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Recent Activity
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Your latest learning actions
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">{totalActivities} total</span>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/50 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-medium text-emerald-600">Completed</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{completedActivities}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/50 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                        <Play size={12} className="text-indigo-500" />
                        <span className="text-[10px] font-medium text-indigo-600">In Progress</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{inProgressActivities}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200/50 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                        <TrendingUp size={12} className="text-purple-500" />
                        <span className="text-[10px] font-medium text-purple-600">New</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{newActivities}</p>
                </div>
            </div>

            {/* Activity List */}
            <motion.div 
                className="space-y-2.5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {visibleActivity.map((item, index) => {
                    const IconData = getIcon(item.type);
                    const Icon = IconData.icon;
                    const status = getStatus(index);
                    const StatusIcon = status.icon;

                    return (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ 
                                x: 4,
                                transition: { duration: 0.2 }
                            }}
                            className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50 transition-all duration-300 hover:shadow-md"
                        >
                            {/* Icon */}
                            <div className={`
                                flex-shrink-0 p-2 rounded-xl ${IconData.bg}
                                transition-all duration-300 group-hover:scale-110
                            `}>
                                <Icon size={16} className={IconData.color} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {item.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {IconData.label}
                                            </span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                            <span className="text-[10px] text-slate-400">
                                                {getTimeAgo(item.time)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className={`
                                        flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full
                                        ${status.bg}
                                    `}>
                                        <StatusIcon size={10} className={status.color} />
                                        <span className={`text-[8px] font-medium ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Chevron on hover */}
                            <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                        </motion.div>
                    );
                })}

                {/* Show more indicator if there are more activities */}
                {hasMoreActivity && (
                    <div className="text-center py-3">
                        <p className="text-xs text-slate-400 font-medium">
                            + {activity.length - 6} more activities
                        </p>
                        <div className="flex items-center justify-center gap-1.5 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">
                            Scroll for more
                        </p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export default ActivitySummary;
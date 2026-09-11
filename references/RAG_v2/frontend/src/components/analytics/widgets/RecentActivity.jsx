import { 
    BookOpen,
    Brain,
    FileText,
    Map,
    Clock,
    ChevronRight,
    TrendingUp,
    Play,
    CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

function RecentActivity({ activity }) {
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
        // Use deterministic status based on index for consistency
        const statuses = [
            { label: "Completed", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "In Progress", icon: Play, color: "text-indigo-500", bg: "bg-indigo-50" },
            { label: "New", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
        ];
        return statuses[index % statuses.length];
    };

    // Show only first 4 items initially
    const visibleActivity = activity?.slice(0, 4) || [];
    const hasMoreActivity = activity?.length > 4;

    if (!activity || activity.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 h-[480px] flex items-center justify-center"
            >
                <div className="flex flex-col items-center p-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 mb-4">
                        <Clock size={40} className="text-indigo-300" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-700 mb-2">
                        Recent Activity
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                        No recent activity
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                        Start learning to see your progress
                    </p>
                </div>
            </motion.div>
        );
    }

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

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 h-[480px] flex flex-col overflow-hidden"
        >
            <div className="p-6 pb-0 flex-shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                            <Clock size={20} className="text-indigo-500" />
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
                        <span className="text-slate-400">Live</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Activity List - Hidden Scrollbar */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 scrollbar-hide">
                <motion.div 
                    className="space-y-3"
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
                                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-all duration-200 border border-transparent hover:border-slate-200/50"
                            >
                                {/* Icon */}
                                <div className={`
                                    flex-shrink-0 p-2.5 rounded-xl ${IconData.bg}
                                    transition-all duration-300 group-hover:scale-110
                                `}>
                                    <Icon size={18} className={IconData.color} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {item.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-xs font-medium text-slate-400">
                                                    {IconData.label}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-xs text-slate-400">
                                                    {getTimeAgo(item.time)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Status Badge */}
                                        <div className={`
                                            flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full
                                            ${status.bg}
                                        `}>
                                            <StatusIcon size={12} className={status.color} />
                                            <span className={`text-[10px] font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chevron on hover */}
                                <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                            </motion.div>
                        );
                    })}

                    {/* Show more indicator if there are more activities */}
                    {hasMoreActivity && (
                        <div className="text-center py-3">
                            <p className="text-xs text-slate-400">
                                + {activity.length - 4} more activities
                            </p>
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            </div>
                            <p className="text-[10px] text-slate-300 mt-1">
                                Scroll for more
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}

export default RecentActivity;
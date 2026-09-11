import { motion } from "framer-motion";
import { 
    Calendar, 
    Clock, 
    AlertCircle, 
    Target,
    Map,
    TrendingUp
} from "lucide-react";

function UpcomingDeadline({ roadmap }) {
    const hasDeadline = roadmap.next_deadline && roadmap.nearest_subject;

    // Calculate days remaining
    const getDaysRemaining = (deadline) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const daysRemaining = hasDeadline ? getDaysRemaining(roadmap.next_deadline) : null;

    // Get urgency color based on days remaining
    const getUrgencyColor = (days) => {
        if (days === null) return "text-slate-400";
        if (days <= 2) return "text-rose-500";
        if (days <= 5) return "text-orange-500";
        if (days <= 10) return "text-amber-500";
        return "text-emerald-500";
    };

    const getUrgencyBg = (days) => {
        if (days === null) return "bg-slate-50";
        if (days <= 2) return "bg-rose-50";
        if (days <= 5) return "bg-orange-50";
        if (days <= 10) return "bg-amber-50";
        return "bg-emerald-50";
    };

    const getUrgencyLabel = (days) => {
        if (days === null) return "No deadline";
        if (days <= 2) return "Urgent!";
        if (days <= 5) return "Soon";
        if (days <= 10) return "Coming up";
        return "On track";
    };

    // Get urgency icon
    const getUrgencyIcon = (days) => {
        if (days === null) return Clock;
        if (days <= 2) return AlertCircle;
        if (days <= 5) return Clock;
        return Calendar;
    };

    const UrgencyIcon = hasDeadline ? getUrgencyIcon(daysRemaining) : Clock;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-[355px]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/30">
                        <Calendar size={18} className="text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800">
                            Upcoming Deadline
                        </h2>
                        <p className="text-[10px] text-slate-400 font-medium">
                            Your next learning milestone
                        </p>
                    </div>
                </div>
                {hasDeadline && (
                    <div className={`
                        flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        ${getUrgencyBg(daysRemaining)}
                    `}>
                        <UrgencyIcon size={12} className={getUrgencyColor(daysRemaining)} />
                        <span className={`text-[10px] font-semibold ${getUrgencyColor(daysRemaining)}`}>
                            {getUrgencyLabel(daysRemaining)}
                        </span>
                    </div>
                )}
            </div>

            {hasDeadline ? (
                <div className="space-y-3">
                    {/* Subject & Deadline in a single row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50">
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                                <Map size={12} className="text-slate-400" />
                                <span>Subject</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-800 truncate">
                                {roadmap.nearest_subject}
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50">
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                                <Calendar size={12} className="text-slate-400" />
                                <span>Date</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-800">
                                {new Date(roadmap.next_deadline).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Days Remaining with progress bar */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-200/30">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <Target size={14} className="text-indigo-500" />
                                <span className="text-xs font-medium text-slate-600">Days Remaining</span>
                            </div>
                            <span className={`text-lg font-bold ${getUrgencyColor(daysRemaining)}`}>
                                {daysRemaining}
                            </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((daysRemaining / 30) * 100, 100)}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`
                                    h-full rounded-full 
                                    ${daysRemaining <= 2 ? 'bg-rose-500' :
                                      daysRemaining <= 5 ? 'bg-orange-500' :
                                      daysRemaining <= 10 ? 'bg-amber-500' :
                                      'bg-emerald-500'}
                                `}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                // Compact Empty State
                <div className="flex flex-col items-center justify-center py-6">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/30 mb-3">
                        <Calendar size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">All Caught Up! 🎉</h3>
                    <p className="text-xs text-slate-400 mt-0.5">No upcoming deadlines</p>
                </div>
            )}
        </motion.div>
    );
}

export default UpcomingDeadline;
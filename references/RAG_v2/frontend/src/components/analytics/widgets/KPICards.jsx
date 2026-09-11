import { 
  BookOpen, 
  StickyNote, 
  HelpCircle, 
  TrendingUp, 
  Map, 
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  Target,
  Award,
  Calendar,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

function KPICards({ overview }) {
  // Calculate trend indicators (example logic - replace with actual data)
  const getTrend = (value, previousValue) => {
    if (!previousValue) return { icon: Minus, color: "text-slate-400" };
    if (value > previousValue) return { icon: ArrowUp, color: "text-emerald-500" };
    if (value < previousValue) return { icon: ArrowDown, color: "text-rose-500" };
    return { icon: Minus, color: "text-slate-400" };
  };

  const cards = [
    {
      id: "books",
      title: "Books",
      value: overview.books || 0,
      icon: BookOpen,
      color: "from-indigo-500/10 to-indigo-600/5",
      iconColor: "text-indigo-500",
      borderColor: "border-indigo-200/50",
      trend: "+12%",
      trendColor: "text-emerald-500",
      subtitle: "Total resources",
      additionalInfo: {
        label: "Completed",
        value: `${Math.round((overview.books_completed || 0) / (overview.books || 1) * 100)}%`,
        icon: CheckCircle,
        color: "text-indigo-500"
      }
    },
    {
      id: "notes",
      title: "Notes",
      value: overview.notes || 0,
      icon: StickyNote,
      color: "from-emerald-500/10 to-emerald-600/5",
      iconColor: "text-emerald-500",
      borderColor: "border-emerald-200/50",
      trend: "+8%",
      trendColor: "text-emerald-500",
      subtitle: "Active notes",
      additionalInfo: {
        label: "This week",
        value: `+${overview.notes_recent || 0}`,
        icon: Calendar,
        color: "text-emerald-500"
      }
    },
    {
      id: "quiz_attempts",
      title: "Quiz Attempts",
      value: overview.quiz_attempts || 0,
      icon: HelpCircle,
      color: "from-purple-500/10 to-purple-600/5",
      iconColor: "text-purple-500",
      borderColor: "border-purple-200/50",
      trend: "+23%",
      trendColor: "text-emerald-500",
      subtitle: "Total attempts",
      additionalInfo: {
        label: "Accuracy",
        value: `${overview.quiz_accuracy || 0}%`,
        icon: Target,
        color: "text-purple-500"
      }
    },
    {
      id: "average_score",
      title: "Average Score",
      value: `${overview.average_score || 0}%`,
      icon: TrendingUp,
      color: "from-orange-500/10 to-orange-600/5",
      iconColor: "text-orange-500",
      borderColor: "border-orange-200/50",
      trend: "+5%",
      trendColor: "text-emerald-500",
      subtitle: "Overall performance",
      additionalInfo: {
        label: "Best score",
        value: `${overview.best_score || 0}%`,
        icon: Award,
        color: "text-orange-500"
      }
    },
    {
      id: "active_roadmaps",
      title: "Active Roadmaps",
      value: overview.active_roadmaps || 0,
      icon: Map,
      color: "from-rose-500/10 to-rose-600/5",
      iconColor: "text-rose-500",
      borderColor: "border-rose-200/50",
      trend: "2 new",
      trendColor: "text-emerald-500",
      subtitle: "Learning paths",
      additionalInfo: {
        label: "Progress",
        value: `${overview.roadmap_progress || 0}%`,
        icon: Target,
        color: "text-rose-500"
      }
    },
    {
      id: "current_streak",
      title: "Current Streak",
      value: `${overview.current_streak || 0}d`,
      icon: Flame,
      color: "from-red-500/10 to-red-600/5",
      iconColor: "text-red-500",
      borderColor: "border-red-200/50",
      trend: "🔥",
      trendColor: "text-orange-500",
      subtitle: "Daily consistency",
      additionalInfo: {
        label: "Best streak",
        value: `${overview.best_streak || 0}d`,
        icon: Award,
        color: "text-red-500"
      }
    },
  ];

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const AdditionalIcon = card.additionalInfo.icon;

        return (
          <motion.div
            key={card.id}
            variants={cardVariants}
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
            className={`
              group relative bg-white/90 backdrop-blur-sm rounded-2xl 
              border ${card.borderColor} shadow-sm hover:shadow-lg 
              transition-all duration-300 overflow-hidden
            `}
          >
            {/* Decorative gradient background */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${card.color} 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300
            `} />

            {/* Content */}
            <div className="relative p-6">
              {/* Header with Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2.5 rounded-xl bg-gradient-to-br ${card.color} 
                    border ${card.borderColor} transition-all duration-300
                    group-hover:scale-110
                  `}>
                    <Icon size={20} className={card.iconColor} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
                
                {/* Trend Indicator */}
                {card.trend && (
                  <div className={`
                    flex items-center gap-1 px-2 py-1 rounded-full 
                    bg-emerald-50 border border-emerald-200/50
                  `}>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {card.trend}
                    </span>
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="flex items-end gap-3">
                <h3 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
                  {card.value}
                </h3>
                
                {/* Progress Bar */}
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className={`
                      h-full rounded-full bg-gradient-to-r 
                      ${card.id === 'books' ? 'from-indigo-400 to-indigo-600' :
                        card.id === 'notes' ? 'from-emerald-400 to-emerald-600' :
                        card.id === 'quiz_attempts' ? 'from-purple-400 to-purple-600' :
                        card.id === 'average_score' ? 'from-orange-400 to-orange-600' :
                        card.id === 'active_roadmaps' ? 'from-rose-400 to-rose-600' :
                        'from-red-400 to-red-600'}
                    `}
                  />
                </div>
              </div>

              {/* Additional Info - Replaces "View Details" */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AdditionalIcon size={14} className={card.additionalInfo.color} />
                    <span className="text-xs text-slate-500 font-medium">
                      {card.additionalInfo.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {card.additionalInfo.value}
                  </span>
                </div>
              </div>
            </div>

            {/* Hover glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 pointer-events-none" />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default KPICards;
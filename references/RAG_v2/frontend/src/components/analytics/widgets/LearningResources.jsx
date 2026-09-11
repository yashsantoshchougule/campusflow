import { motion } from "framer-motion";
import { 
    BookOpen, 
    Clock, 
    TrendingUp,
    Target,
    Calendar,
    FileText,
    CheckCircle,
    Clock as ClockIcon
} from "lucide-react";

function LearningResources({ dashboard }) {
    const { study, overview } = dashboard;
    const books = study?.recent_books || [];

    // Calculate stats
    const totalBooks = overview?.books || 0;
    const totalNotes = overview?.notes || 0;
    const totalResources = totalBooks + totalNotes;
    const completedBooks = books.filter(b => b.current_page === b.total_pages).length;
    const inProgressBooks = books.filter(b => b.current_page < b.total_pages).length;
    const totalPages = books.reduce((sum, b) => sum + b.total_pages, 0);
    const pagesRead = books.reduce((sum, b) => sum + b.current_page, 0);
    const overallProgress = totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;

    // Get progress color
    const getProgressColor = (progress) => {
        if (progress < 30) return "from-indigo-400 to-indigo-600";
        if (progress < 60) return "from-emerald-400 to-emerald-600";
        if (progress < 80) return "from-amber-400 to-amber-600";
        return "from-rose-400 to-rose-600";
    };

    // Get time ago
    const getTimeAgo = (date) => {
        if (!date) return "Recently";
        const now = new Date();
        const diff = now - new Date(date);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

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

    // Stats cards
    const stats = [
        {
            id: "total",
            label: "Total Resources",
            value: totalResources,
            icon: BookOpen,
            color: "text-indigo-500",
            bg: "bg-indigo-100",
            detail: `${totalBooks} books • ${totalNotes} notes`
        },
        {
            id: "reading",
            label: "Reading Progress",
            value: `${overallProgress}%`,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-100",
            detail: `${pagesRead} / ${totalPages} pages`
        },
        {
            id: "status",
            label: "Book Status",
            value: `${completedBooks}/${books.length}`,
            icon: Target,
            color: "text-amber-500",
            bg: "bg-amber-100",
            detail: `${inProgressBooks} in progress`
        },
    ];

    if (!books || books.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex items-center justify-center min-h-[300px]"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 mb-4">
                        <BookOpen size={40} className="text-indigo-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">No Learning Resources</h3>
                    <p className="text-xs text-slate-400 mt-1">Start adding books and notes to your library</p>
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
                        <FileText size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Learning Resources
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Your books and reading progress
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">{books.length} books</span>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/50 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                                <div className={`p-1 rounded-lg ${stat.bg}`}>
                                    <Icon size={12} className={stat.color} />
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">{stat.label}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-700 mt-0.5">{stat.value}</p>
                            <p className="text-[8px] text-slate-400">{stat.detail}</p>
                        </div>
                    );
                })}
            </div>

            {/* All Books List - No Scroll */}
            <motion.div 
                className="space-y-2.5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {books.map((book) => {
                    const progress = Math.round((book.current_page / book.total_pages) * 100);
                    
                    return (
                        <motion.div
                            key={book.id}
                            variants={itemVariants}
                            whileHover={{ 
                                x: 4,
                                transition: { duration: 0.2 }
                            }}
                            className="group p-3 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50 transition-all duration-300 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Book Title & Status */}
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={13} className="text-indigo-500 flex-shrink-0" />
                                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                                            {book.title}
                                        </h3>
                                        {book.current_page === book.total_pages ? (
                                            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex-shrink-0">
                                                ✓ Done
                                            </span>
                                        ) : (
                                            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/50 flex-shrink-0">
                                                Reading
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Progress Info */}
                                    <div className="flex items-center gap-3 mt-1 ml-6">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={10} className="text-slate-400" />
                                            <span className="text-[10px] text-slate-500">
                                                {book.current_page} / {book.total_pages} pgs
                                            </span>
                                        </div>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={10} className="text-slate-400" />
                                            <span className="text-[10px] text-slate-500">
                                                {getTimeAgo(book.last_read)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden ml-6">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                            className={`
                                                h-full rounded-full bg-gradient-to-r 
                                                ${getProgressColor(progress)}
                                            `}
                                        />
                                    </div>
                                </div>

                                {/* Progress Percentage */}
                                <div className="flex-shrink-0 text-right">
                                    <span className="text-xs font-bold text-slate-700">
                                        {progress}%
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}

export default LearningResources;
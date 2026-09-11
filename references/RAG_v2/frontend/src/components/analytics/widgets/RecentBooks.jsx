import { motion } from "framer-motion";
import { BookOpen, Clock, ChevronRight } from "lucide-react";

function RecentBooks({ study }) {
    const books = study.recent_books || [];
    
    // Show only the most recent 4 books
    const visibleBooks = books.slice(-4);

    // Calculate reading progress for a book
    const getProgress = (currentPage, totalPages) => {
        return Math.round((currentPage / totalPages) * 100);
    };

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
                staggerChildren: 0.08
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

    if (!books || books.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex items-center justify-center min-h-[200px]"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 mb-4">
                        <BookOpen size={40} className="text-indigo-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">No Books Yet</h3>
                    <p className="text-xs text-slate-400 mt-1">Start your reading journey today</p>
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
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                        <BookOpen size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Recent Books
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Currently reading
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">{books.length} books</span>
                </div>
            </div>

            {/* Books List - No Scroll */}
            <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {visibleBooks.map((book) => {
                    const progress = getProgress(book.current_page, book.total_pages);
                    
                    return (
                        <motion.div
                            key={book.id}
                            variants={itemVariants}
                            whileHover={{ 
                                x: 4,
                                transition: { duration: 0.2 }
                            }}
                            className="group p-4 rounded-xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/50 transition-all duration-300 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Book Title */}
                                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                                        {book.title}
                                    </h3>
                                    
                                    {/* Author if available */}
                                    {book.author && (
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {book.author}
                                        </p>
                                    )}
                                    
                                    {/* Progress Info */}
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen size={12} className="text-slate-400" />
                                            <span className="text-xs text-slate-500">
                                                {book.current_page} / {book.total_pages} pages
                                            </span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-slate-400" />
                                            <span className="text-xs text-slate-500">
                                                {getTimeAgo(book.last_read)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                                    <span className="text-sm font-bold text-slate-700">
                                        {progress}%
                                    </span>
                                    <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1 inline" />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}

export default RecentBooks;
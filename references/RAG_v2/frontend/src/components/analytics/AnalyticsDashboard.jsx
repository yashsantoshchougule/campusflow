import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import AnalyticsNavbar from "./components/AnalyticsNavbar";
import AnalyticsSidebar from "./components/AnalyticsSidebar";

import Overview from "./pages/Overview";
import Performance from "./pages/Performance";
import Study from "./pages/Study";
import Quiz from "./pages/Quiz";
import Roadmaps from "./pages/Roadmaps";
import Reports from "./pages/Reports";

import { getDashboard } from "../../api/analyticsApi";

const pages = {
    overview: Overview,
    performance: Performance,
    study: Study,
    quiz: Quiz,
    roadmaps: Roadmaps,
    reports: Reports,
};

function AnalyticsDashboard({ onBack }) {
    const [page, setPage] = useState("overview");
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboard();
    }, []);

    async function fetchDashboard() {
        setLoading(true);
        try {
            const data = await getDashboard();
            setDashboard(data);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load analytics dashboard.");
        } finally {
            setLoading(false);
        }
    }

    const CurrentPage = pages[page] || Overview;

    // Page transition variants
    const pageVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/80 flex flex-col">
            <AnalyticsNavbar onBack={onBack} />

            <div className="flex flex-1 relative">
                <AnalyticsSidebar page={page} setPage={setPage} />

                <main className="flex-1 overflow-y-auto p-6 lg:p-8 h-[calc(100vh-4rem)]">
                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full"
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-slate-100 border-t-purple-400 rounded-full animate-spin animation-delay-150" />
                                    </div>
                                </div>
                                <p className="mt-6 text-sm font-medium text-slate-500 animate-pulse">
                                    Loading Analytics...
                                </p>
                            </motion.div>
                        )}

                        {!loading && error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center h-full"
                            >
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full shadow-xl border border-red-100">
                                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-50">
                                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-center text-red-600 mb-6 font-medium">
                                        {error}
                                    </p>
                                    <button
                                        onClick={fetchDashboard}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/25"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {!loading && !error && dashboard && (
                            <motion.div
                                key="dashboard"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ 
                                    duration: 0.3, 
                                    ease: "easeOut" 
                                }}
                                className="h-full"
                            >
                                <CurrentPage
                                    dashboard={dashboard}
                                    refreshDashboard={fetchDashboard}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;
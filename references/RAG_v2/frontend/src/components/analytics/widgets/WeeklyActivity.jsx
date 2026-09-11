import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Activity } from "lucide-react";

function WeeklyActivity({ weekly }) {
    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                            <span 
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-600">{entry.name}:</span>
                            <span className="font-semibold text-slate-800">
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom legend
    const CustomLegend = ({ payload }) => {
        return (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span 
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs font-medium text-slate-600">
                            {entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // Calculate total activity
    const totalActivity = weekly?.reduce((sum, day) => {
        return sum + (day.quiz || 0) + (day.books || 0) + (day.notes || 0);
    }, 0) || 0;

    const averageActivity = weekly?.length ? Math.round(totalActivity / weekly.length) : 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-shadow duration-300 p-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                        <Activity size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Weekly Activity
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Your learning progress this week
                        </p>
                    </div>
                </div>
                
                {/* Stats Summary */}
                <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-50/80 border border-slate-200/50">
                    <div className="text-center">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            Total
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                            {totalActivity}
                        </p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            Daily Avg
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                            {averageActivity}
                        </p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={weekly}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#e2e8f0"
                            vertical={false}
                        />
                        
                        <XAxis 
                            dataKey="day" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ 
                                fill: '#94a3b8', 
                                fontSize: 12,
                                fontWeight: 500
                            }}
                            dy={10}
                        />
                        
                        <YAxis 
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ 
                                fill: '#94a3b8', 
                                fontSize: 12,
                                fontWeight: 500
                            }}
                            dx={-10}
                        />
                        
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                        
                        <Legend content={<CustomLegend />} />
                        
                        <Bar
                            dataKey="quiz"
                            fill="#818cf8"
                            name="Quiz"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        />
                        
                        <Bar
                            dataKey="books"
                            fill="#34d399"
                            name="Books"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        />
                        
                        <Bar
                            dataKey="notes"
                            fill="#fbbf24"
                            name="Notes"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Last 7 days</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span className="text-emerald-600 font-medium">+12%</span>
                    </span>
                    <span className="text-slate-400">vs last week</span>
                </div>
            </div>
        </motion.div>
    );
}

export default WeeklyActivity;
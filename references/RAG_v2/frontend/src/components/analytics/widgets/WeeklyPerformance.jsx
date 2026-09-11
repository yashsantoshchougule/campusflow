import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Cell,
} from "recharts";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, BookOpen, Brain, FileText } from "lucide-react";

function WeeklyPerformance({ dashboard }) {
    const data = dashboard.weekly_progress || [];

    // Calculate totals
    const totals = data.reduce((acc, day) => ({
        quiz: acc.quiz + (day.quiz || 0),
        books: acc.books + (day.books || 0),
        notes: acc.notes + (day.notes || 0),
    }), { quiz: 0, books: 0, notes: 0 });

    const totalActivities = totals.quiz + totals.books + totals.notes;
    const averagePerDay = Math.round(totalActivities / (data.length || 1));

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 p-4 min-w-[150px]">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span 
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-600">{entry.name}</span>
                            </div>
                            <span className="font-semibold text-slate-800">
                                {entry.value}
                            </span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400">
                            Total: {payload.reduce((sum, entry) => sum + entry.value, 0)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom Legend
    const CustomLegend = ({ payload }) => {
        return (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                {payload.map((entry, index) => {
                    const icons = {
                        'Quiz': Brain,
                        'Books': BookOpen,
                        'Notes': FileText
                    };
                    const Icon = icons[entry.value] || BookOpen;
                    
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <Icon size={14} className="text-slate-400" />
                            <span 
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs font-medium text-slate-600">
                                {entry.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Get bar color based on value
    const getBarColor = (value, type) => {
        if (value === 0) return '#e2e8f0';
        const colors = {
            quiz: ['#818cf8', '#6366f1', '#4f46e5'],
            books: ['#34d399', '#10b981', '#059669'],
            notes: ['#fbbf24', '#f59e0b', '#d97706']
        };
        const colorSet = colors[type] || colors.quiz;
        if (value <= 2) return colorSet[0];
        if (value <= 4) return colorSet[1];
        return colorSet[2];
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-[420px]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30">
                        <Calendar size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Weekly Activity
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Your learning activity this week
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50/80 border border-slate-200/50">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span className="text-xs font-medium text-slate-600">
                            {averagePerDay}/day
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[calc(100%-80px)] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="quizGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.3}/>
                            </linearGradient>
                            <linearGradient id="booksGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0.3}/>
                            </linearGradient>
                            <linearGradient id="notesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.3}/>
                            </linearGradient>
                        </defs>

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
                            axisLine={false}
                            tickLine={false}
                            tick={{ 
                                fill: '#94a3b8', 
                                fontSize: 12,
                                fontWeight: 500
                            }}
                            dx={-10}
                            allowDecimals={false}
                        />
                        
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                        
                        <Legend content={<CustomLegend />} />
                        
                        <Bar
                            dataKey="quiz"
                            fill="url(#quizGradient)"
                            name="Quiz"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={35}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`quiz-${index}`}
                                    fill={getBarColor(entry.quiz, 'quiz')}
                                />
                            ))}
                        </Bar>
                        
                        <Bar
                            dataKey="books"
                            fill="url(#booksGradient)"
                            name="Books"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={35}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`books-${index}`}
                                    fill={getBarColor(entry.books, 'books')}
                                />
                            ))}
                        </Bar>
                        
                        <Bar
                            dataKey="notes"
                            fill="url(#notesGradient)"
                            name="Notes"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={35}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`notes-${index}`}
                                    fill={getBarColor(entry.notes, 'notes')}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export default WeeklyPerformance;
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
    ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";

function PerformanceTrend({ dashboard }) {
    const data = dashboard.quiz.recent_attempts.map((item, index) => ({
        attempt: index + 1,
        score: item.percentage,
        label: `Quiz ${index + 1}`
    }));

    // Calculate statistics
    const scores = data.map(d => d.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const latestScore = scores[scores.length - 1] || 0;
    const firstScore = scores[0] || 0;
    const trend = latestScore - firstScore;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                        {payload[0].payload.label}
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-sm text-slate-600">Score:</span>
                        <span className="text-sm font-bold text-slate-800">
                            {payload[0].value}%
                        </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-400">
                            {payload[0].value >= 70 ? '✅ Good performance' : 
                             payload[0].value >= 50 ? '📈 Keep improving' : 
                             '🎯 Focus needed'}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Get trend icon and color
    const getTrendInfo = () => {
        if (trend > 0) {
            return { icon: TrendingUp, color: "text-emerald-500", label: "Improving" };
        } else if (trend < 0) {
            return { icon: TrendingDown, color: "text-rose-500", label: "Declining" };
        }
        return { icon: Minus, color: "text-slate-400", label: "Stable" };
    };

    const TrendIcon = getTrendInfo().icon;

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
                        <TrendingUp size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Score Trend
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Your performance over time
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Trend Badge */}
                    <div className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        ${getTrendInfo().color === 'text-emerald-500' ? 'bg-emerald-50 border border-emerald-200/50' :
                          getTrendInfo().color === 'text-rose-500' ? 'bg-rose-50 border border-rose-200/50' :
                          'bg-slate-50 border border-slate-200/50'}
                    `}>
                        <TrendIcon size={14} className={getTrendInfo().color} />
                        <span className={`text-xs font-medium ${getTrendInfo().color}`}>
                            {getTrendInfo().label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#e2e8f0"
                            vertical={false}
                        />
                        
                        <XAxis 
                            dataKey="attempt"
                            axisLine={false}
                            tickLine={false}
                            tick={{ 
                                fill: '#94a3b8', 
                                fontSize: 11,
                                fontWeight: 500
                            }}
                            dy={10}
                            label={{ 
                                value: 'Attempts', 
                                position: 'insideBottom', 
                                offset: -5,
                                style: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 }
                            }}
                        />
                        
                        <YAxis 
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ 
                                fill: '#94a3b8', 
                                fontSize: 11,
                                fontWeight: 500
                            }}
                            dx={-10}
                            label={{ 
                                value: 'Score %', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 }
                            }}
                        />
                        
                        <Tooltip content={<CustomTooltip />} />
                        
                        <ReferenceLine 
                            y={70} 
                            stroke="#fbbf24" 
                            strokeDasharray="5 5"
                            label={{ 
                                value: 'Target: 70%', 
                                position: 'insideRight',
                                style: { fill: '#fbbf24', fontSize: 10, fontWeight: 600 }
                            }}
                        />
                        
                        <Area
                            dataKey="score"
                            stroke="#818cf8"
                            strokeWidth={2.5}
                            fill="url(#scoreGradient)"
                            activeDot={{ 
                                r: 6, 
                                stroke: '#818cf8',
                                strokeWidth: 2,
                                fill: '#fff'
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Stats Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-3">
                <div className="text-center">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Average
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                        {averageScore.toFixed(1)}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Best
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                        {highestScore}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Lowest
                    </p>
                    <p className="text-sm font-bold text-rose-600">
                        {lowestScore}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Latest
                    </p>
                    <p className={`text-sm font-bold ${latestScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {latestScore}%
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default PerformanceTrend;
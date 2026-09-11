import {
  ArrowLeft,
  Bell,
  Download,
  UserCircle2,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";

function AnalyticsNavbar({ onBack }) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
      <div className="h-16 px-6 lg:px-8 flex items-center justify-between">

        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-100/80 transition-all duration-200 hover:shadow-sm"
          >
            <ArrowLeft 
              size={18} 
              className="text-slate-500 group-hover:text-slate-700 transition-colors" 
            />
            <span className="font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
              Dashboard
            </span>
          </button>

          <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />

          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Student Performance & Insights
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Live Status */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/50">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">Live</span>
            </div>
            <div className="w-px h-4 bg-emerald-200/50" />
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Clock size={12} className="opacity-70" />
              <span className="text-xs font-mono font-medium tabular-nums">
                {currentTime}
              </span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="hidden lg:block text-right">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Last Updated
            </p>
            <p className="text-sm font-semibold text-slate-700">
              Just now
            </p>
          </div>

          {/* Export Button */}
          <button
            className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/80 bg-white/50 hover:bg-slate-50/80 transition-all duration-200 hover:shadow-sm hover:border-slate-300"
          >
            <Download 
              size={18} 
              className="text-slate-500 group-hover:text-slate-700 transition-colors" 
            />
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors hidden sm:inline">
              Export
            </span>
          </button>

          {/* Notifications */}
          <button
            className="relative w-10 h-10 rounded-xl hover:bg-slate-100/80 flex items-center justify-center transition-all duration-200 hover:shadow-sm"
          >
            <Bell size={20} className="text-slate-500 hover:text-slate-700 transition-colors" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* User Profile */}
          <button
            className="group w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
          >
            <UserCircle2 size={22} className="text-white" />
          </button>
        </div>

      </div>
    </header>
  );
}

export default AnalyticsNavbar;
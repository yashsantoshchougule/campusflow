import { useEffect, useState } from "react";
import { Sparkles, Zap, Cpu, Database, Brain, Rocket } from "lucide-react";

function LeftVisual() {
  const messages = [
    "Analyzing your study patterns...",
    "Indexing your notes into vectors...",
    "Building semantic understanding...",
    "Preparing AI responses...",
    "Optimizing retrieval layers...",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex w-1/2 relative overflow-hidden min-h-screen">

      {/* background image */}
      <img
        src="https://images.unsplash.com/photo-1677442136019-21780ecad995"
        className="absolute inset-0 w-full h-full object-cover opacity-30 scale-110"
        alt="AI Background"
      />

      {/* warm overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-50/95 via-amber-50/80 to-transparent" />

      {/* floating warm glows */}
      <div className="absolute w-[450px] h-[450px] bg-rose-200/30 blur-[140px] rounded-full bottom-[-120px] left-[-120px]" />
      <div className="absolute w-[350px] h-[350px] bg-amber-200/20 blur-[120px] rounded-full top-[-80px] right-[-80px]" />
      <div className="absolute w-[250px] h-[250px] bg-orange-200/15 blur-[100px] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />

      {/* CONTENT */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center px-16">

        {/* BADGE */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-rose-200/30 text-rose-700 text-xs font-medium w-fit shadow-sm">
          <Rocket className="w-3.5 h-3.5" />
          AI System Active
        </div>

        {/* TITLE */}
        <h1 className="text-4xl font-bold leading-tight mt-4 text-gray-800">
          AI System <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">Active</span>
        </h1>

        <p className="mt-3 text-gray-500 max-w-md">
          RAG_V2 is currently processing and structuring your knowledge base in real time.
        </p>

        {/* LIVE STATUS */}
        <div className="mt-6 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-600 text-sm font-medium">
            Live Processing
          </span>
        </div>

        {/* dynamic message box */}
        <div className="
          mt-6
          bg-white/80 backdrop-blur-sm
          border border-rose-200/30
          px-5 py-4 rounded-2xl
          w-fit
          transition-all duration-500
          shadow-sm
        ">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-sm text-gray-700 font-medium">
              {messages[index]}
            </p>
          </div>

          {/* animated bar */}
          <div className="mt-3 h-1.5 w-48 bg-rose-100/50 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* mini insights - warm colors */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-rose-200/20 w-fit">
            <span className="text-rose-500 font-bold">▸</span>
            <span>Chunking documents into semantic blocks</span>
            <Database className="w-3.5 h-3.5 text-rose-400 ml-1" />
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-200/20 w-fit">
            <span className="text-amber-500 font-bold">▸</span>
            <span>Creating vector embeddings</span>
            <Zap className="w-3.5 h-3.5 text-amber-400 ml-1" />
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-orange-200/20 w-fit">
            <span className="text-orange-500 font-bold">▸</span>
            <span>Enabling contextual retrieval</span>
            <Cpu className="w-3.5 h-3.5 text-orange-400 ml-1" />
          </div>
        </div>

        {/* Decorative gradient line */}
        <div className="mt-10 flex items-center gap-3">
          <div className="w-12 h-0.5 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full" />
          <span className="text-xs text-gray-400">Powered by RAG</span>
          <div className="w-12 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default LeftVisual;
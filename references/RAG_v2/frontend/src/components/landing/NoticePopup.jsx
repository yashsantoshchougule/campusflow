import { useEffect, useState } from "react";
import { Sparkles, X, Rocket, AlertCircle, Smile, ThumbsUp } from "lucide-react";

function NoticePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4 animate-fadeUp">
      <div
        className="
          relative w-full max-w-xl
          rounded-3xl
          bg-white/95
          backdrop-blur-xl
          border border-rose-200/30
          shadow-2xl shadow-rose-200/20
          p-8
        "
      >
        {/* Glow - warm colors */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-100/20 via-amber-100/20 to-orange-100/20 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-rose-50 transition-colors duration-200 text-gray-400 hover:text-rose-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-100/80 to-amber-100/80 border border-rose-200/30 px-4 py-1.5 text-rose-700 text-sm font-medium">
            <Rocket className="w-4 h-4" />
            🚧 Development Notice
          </div>

          <h2 className="mt-5 text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500" />
            Welcome!
          </h2>

          <p className="mt-4 text-gray-600 leading-8">
            This project is still <span className="font-semibold text-rose-600">actively under development</span>.
            New features, UI improvements, and plenty of questionable late-night ideas are being added regularly.
            I'm currently working on data migration and changing projects folder structure because it's getting way too large to manage for me.
          </p>

          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-200/30">
            <p className="text-gray-600 leading-7">
              Also... yes, it's still called <span className="text-amber-600 font-semibold">RAG_V2</span>.
              Naming things is apparently harder than building AI. 😅
            </p>
            <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              A better name is definitely on the roadmap.
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setOpen(false)}
              className="
                flex-1 py-3 rounded-xl
                bg-gradient-to-r from-rose-500 to-amber-500
                hover:from-rose-600 hover:to-amber-600
                text-white font-medium
                transition-all duration-300
                shadow-lg shadow-rose-200/50
                hover:shadow-xl hover:shadow-rose-300/50
                hover:scale-[1.02]
                flex items-center justify-center gap-2
              "
            >
              <ThumbsUp className="w-4 h-4" />
              Got it
            </button>

            <button
              onClick={() => setOpen(false)}
              className="
                flex-1 py-3 rounded-xl
                bg-white/80 border border-rose-200/30
                hover:bg-rose-50 hover:border-rose-200
                text-gray-600 hover:text-rose-600
                transition-all duration-200
                flex items-center justify-center gap-2
                font-medium
              "
            >
              <Smile className="w-4 h-4" />
              Us Broo! 😭
            </button>
          </div>

          {/* Decorative dots */}
          <div className="absolute bottom-6 right-6 flex gap-1.5 opacity-20">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoticePopup;
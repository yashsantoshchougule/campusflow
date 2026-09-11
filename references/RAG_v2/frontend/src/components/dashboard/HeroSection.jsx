function HeroSection({ user, subject, onUpload }) {
  return (
    <section className="bg-gradient-to-br from-rose-50/90 via-amber-50/70 to-orange-50/50 rounded-2xl shadow-lg shadow-rose-200/30 border border-rose-200/40 p-8 relative overflow-hidden animate-fadeUp">
      
      {/* Decorative warm elements with modern colors */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/10 rounded-full blur-3xl" />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative z-10">

        {/* Left side - Welcome and Subject */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">👋</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Welcome back, {user?.email?.split("@")[0]}
            </h1>
          </div>

          <p className="text-rose-500/80 mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {subject ? 'Continue learning where you left off' : 'Select a subject to begin your journey'}
          </p>

          <div className="mt-8 p-5 bg-white/50 backdrop-blur-sm rounded-xl border border-rose-200/30 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-rose-500 font-semibold flex items-center gap-2">
              <span>📖</span> Current Subject
            </p>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {subject ? (
                <>
                  <span className="text-3xl">📘</span>
                  <span className="text-xl font-bold text-rose-700">
                    {subject}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full flex items-center gap-1 border border-emerald-200/30">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Active
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl">✨</span>
                  <span className="text-xl font-semibold text-amber-500">
                    No Subject Selected
                  </span>
                </>
              )}

              <button
                onClick={onUpload}
                className="ml-auto text-sm bg-gradient-to-r from-rose-100 to-amber-100 text-rose-700 px-5 py-2 rounded-full hover:from-rose-200 hover:to-amber-200 transition-all duration-300 font-medium shadow-sm hover:shadow-md border border-rose-200/30 flex items-center gap-2"
              >
                {subject ? '🔄 Change Subject' : '✨ Select Subject'}
              </button>
            </div>
          </div>
        </div>

        {/* Right side - Empty for balance */}
        <div className="hidden md:block min-w-[40px]">
          {/* Maintains layout balance */}
        </div>

      </div>
    </section>
  );
}

export default HeroSection;
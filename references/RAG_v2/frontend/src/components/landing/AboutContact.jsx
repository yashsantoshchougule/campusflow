function AboutContact() {
  return (
    <section className="relative z-10 px-6 py-24 max-w-6xl mx-auto">

      {/* background glow - warm colors */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-200/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-200/20 blur-[140px] rounded-full" />
      </div>

      {/* heading */}
      <div className="relative text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100/80 to-amber-100/80 backdrop-blur-sm border border-rose-200/30 text-rose-700 text-sm font-medium mb-4">
          <span>❤️</span>
          About the Creator
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
          Built with{' '}
          <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            Passion
          </span>{' '}
          for AI-driven Learning
        </h2>
        <p className="text-gray-500 mt-3">AI Engineer & Full Stack Developer</p>
      </div>

      {/* main card */}
      <div className="relative grid md:grid-cols-2 gap-6 items-center">

        {/* PROFILE CARD */}
        <div className="
          group relative rounded-3xl p-8
          bg-white/80 backdrop-blur-sm border border-rose-200/30
          transition-all duration-500
          hover:-translate-y-2 hover:shadow-xl hover:shadow-rose-100/30
        ">

          {/* glow */}
          <div className="
            absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100
            bg-gradient-to-br from-rose-100/30 via-amber-100/30 to-orange-100/30
            blur-2xl transition duration-500
          " />

          <div className="relative z-10 text-center md:text-left">

            {/* avatar */}
            <div className="
              relative w-24 h-24 mx-auto md:mx-0 mb-5
              rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500
              flex items-center justify-center text-2xl font-bold text-white
              shadow-lg shadow-rose-200/50
              group-hover:scale-105 transition-transform duration-300
            ">
              PS
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                <span className="text-[8px] text-white">✓</span>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-gray-800">
              Prateek Saha
            </h3>

            <p className="text-rose-600 font-medium mt-1">
              AI Engineer & Full Stack Developer
            </p>

            <p className="text-gray-600 mt-4 leading-relaxed text-sm">
              Passionate about building intelligent systems that enhance human learning.
              Currently working on RAG-based AI applications and scalable web platforms.
            </p>

            {/* tech tags */}
            <div className="flex flex-wrap gap-1.5 mt-4 justify-center md:justify-start">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200/50">AI/ML</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200/50">RAG</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200/50">Full Stack</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/50">Python</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-200/50">React</span>
            </div>

            {/* socials */}
            <div className="flex gap-3 mt-5 justify-center md:justify-start">
              <a href="https://github.com/prateEKsaha07" className="p-2 rounded-lg bg-gray-100 border border-gray-200/50 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.62.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              </a>
              <a href="https://www.linkedin.com/in/prateeksaha" className="p-2 rounded-lg bg-gray-100 border border-gray-200/50 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://www.instagram.com/sketchy.prate_ek" className="p-2 rounded-lg bg-gray-100 border border-gray-200/50 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="mailto:prateeksaha963@gmail.com" className="p-2 rounded-lg bg-gray-100 border border-gray-200/50 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </a>
            </div>
          </div>
        </div>

        {/* CONTACT CARD */}
        <div className="
          group relative rounded-3xl p-8
          bg-white/80 backdrop-blur-sm border border-amber-200/30
          transition-all duration-500
          hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-100/30
        ">

          {/* glow */}
          <div className="
            absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100
            bg-gradient-to-br from-amber-100/30 via-orange-100/30 to-rose-100/30
            blur-2xl transition duration-500
          " />

          <div className="relative z-10">

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800">
                Contact Me
              </h3>
            </div>

            <p className="text-gray-500 text-sm mb-8">
              Feel free to reach out for collaborations, projects, or just a chat.
            </p>

            {/* contact items */}
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-200/30 hover:border-rose-200/60 transition-all duration-200">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-800 font-medium">prateeksaha963@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/30 hover:border-amber-200/60 transition-all duration-200">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-gray-800 font-medium">Chhattisgarh, INDIA</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/30 hover:border-emerald-200/60 transition-all duration-200">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-emerald-600 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Available for Freelance
                  </p>
                </div>
              </div>
            </div>

            {/* button */}
            <button className="
              mt-8 w-full py-3.5 rounded-xl
              bg-gradient-to-r from-rose-500 to-amber-500
              hover:from-rose-600 hover:to-amber-600
              text-white font-medium
              transition-all duration-300
              shadow-lg shadow-rose-200/50
              hover:shadow-xl hover:shadow-rose-300/50
              flex items-center justify-center gap-2
            ">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              Send Message
            </button>

          </div>
        </div>

      </div>

      {/* bottom decorative line */}
      <div className="mt-16 flex justify-center gap-4 opacity-30">
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-rose-300 to-transparent rounded-full" />
        <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full" />
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-orange-300 to-transparent rounded-full" />
      </div>
    </section>
  );
}

export default AboutContact;
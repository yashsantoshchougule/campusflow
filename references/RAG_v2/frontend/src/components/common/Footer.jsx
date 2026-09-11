import logo from "../../../public/logo.svg";

function Footer() {
  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');
          * {
            font-family: "Geist", sans-serif;
          }
        `}
      </style>

      <div className="bg-[#050816] pt-24 px-4 text-white relative overflow-hidden">

        {/* background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-500/10 blur-[140px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[140px] rounded-full" />
        </div>

        <footer className="relative z-10 w-full max-w-[1350px] mx-auto pt-12 px-6 sm:px-10 md:px-16 lg:px-24">

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-6 gap-12">

            {/* LEFT SECTION */}
            <div className="lg:col-span-3 space-y-6">

              <a href="https://github.com/prateEKsaha07/RAG_v2" className="block">
                <img
                  src={logo}
                  alt="Logo"
                  className="max-w-[75px] opacity-90 hover:opacity-100 transition"
                />
              </a>

              <p className="text-sm text-gray-400 max-w-md leading-relaxed">
                Thanks for stopping by! Explore this AI-powered RAG system designed to
                transform studying into a personalized, intelligent experience.
              </p>

              {/* SOCIALS */}
              <div className="flex gap-5">

                <a className="text-gray-400 hover:text-white transition" href="https://x.com/Prate_ek7">
                  {/* X */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.6-6.64 7.6H.47l8.6-9.83L0 1.15h7.59l5.24 6.93z"/>
                  </svg>
                </a>

                <a className="text-gray-400 hover:text-white transition" href="https://github.com/prateEKsaha07">
                  {/* GitHub */}
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .5C5.73.5.75 5.62.75 12c0 5.1 3.29 9.43 7.86 10.96.57.1.78-.25.78-.55v-2c-3.2.7-3.88-1.38-3.88-1.38-.52-1.35-1.28-1.71-1.28-1.71-1.05-.73.08-.72.08-.72 1.16.08 1.77 1.22 1.77 1.22 1.04 1.82 2.73 1.29 3.4.99.1-.77.4-1.29.73-1.59-2.56-.3-5.25-1.32-5.25-5.88 0-1.3.45-2.37 1.18-3.21-.12-.3-.51-1.52.11-3.17 0 0 .97-.32 3.18 1.23a10.8 10.8 0 0 1 5.8 0c2.21-1.55 3.18-1.23 3.18-1.23.62 1.65.23 2.87.11 3.17.73.84 1.18 1.91 1.18 3.21 0 4.57-2.69 5.57-5.26 5.87.41.37.78 1.1.78 2.22v3.29c0 .3.21.65.79.54A10.75 10.75 0 0 0 23.25 12C23.25 5.62 18.27.5 12 .5z"/>
                  </svg>
                </a>

                <a className="text-gray-400 hover:text-white transition" href="https://www.linkedin.com">
                  {/* LinkedIn */}
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.67H9.33V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z"/>
                  </svg>
                </a>

              </div>
            </div>

            {/* RIGHT LINKS */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-10">

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Projects</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><a className="hover:text-white transition" href="#">Data Engineering</a></li>
                  <li><a className="hover:text-white transition" href="#">Machine Learning</a></li>
                  <li><a className="hover:text-white transition" href="#">Computer Vision</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Resources</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><a className="hover:text-white transition" href="#">Help Center</a></li>
                  <li><a className="hover:text-white transition" href="#">Blogs</a></li>
                  <li><a className="hover:text-white transition" href="#">Store</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><a className="hover:text-white transition" href="#">About</a></li>
                  <li><a className="hover:text-white transition" href="#">Vision</a></li>
                  <li>
                    <a className="hover:text-white transition" href="#">Careers</a>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                      HIRING
                    </span>
                  </li>
                  <li><a className="hover:text-white transition" href="#">Contact</a></li>
                </ul>
              </div>

            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="max-w-7xl mx-auto mt-16 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">

            <p className="text-gray-500 text-sm">© 2026 RAG_v2</p>
            <p className="text-gray-500 text-sm">All rights reserved.</p>

          </div>

          {/* BACKGROUND BRAND TEXT */}
          <div className="relative mt-10">
            <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl h-40 bg-blue-500/10 blur-[140px] rounded-full" />

            <h1 className="text-center font-extrabold text-transparent text-[clamp(3rem,12vw,12rem)] [-webkit-text-stroke:1px_rgba(255,255,255,0.08)]">
              RAG_v2
            </h1>
          </div>

        </footer>
      </div>
    </>
  );
}

export default Footer;
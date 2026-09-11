import { useEffect, useState } from "react";
import { Menu, X, Sparkles, LogOut, ChevronRight } from "lucide-react";

function Navbar({ onGetStarted, showGetStarted = true, onHome, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { label: "Home", id: "home" },
    { label: "Features", id: "features" },
    { label: "About", id: "about" },
    { label: "Contact", id: "contact" },
  ];

  // smooth Apple-style scroll
  const smoothScrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const target = el.getBoundingClientRect().top + window.pageYOffset;
    const start = window.pageYOffset;
    const distance = target - start;
    const duration = 900;

    let startTime = null;

    const ease = (t) =>
      t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;

      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      window.scrollTo(0, start + distance * ease(progress));

      if (timeElapsed < duration) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // scroll spy (active section detection)
  useEffect(() => {
    const sections = navItems.map((i) => i.id);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // navbar blur on scroll
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-50">

      {/* glass background - warm colors */}
      <div
        className={`
          absolute inset-0 transition-all duration-500
          ${
            scrolled
              ? "bg-white/80 backdrop-blur-2xl border-b border-rose-200/30 shadow-sm"
              : "bg-white/40 backdrop-blur-md"
          }
        `}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-3 flex justify-between items-center">

        {/* LOGO */}
        <button
          onClick={onHome}
          className="flex items-center gap-2 hover:scale-105 transition duration-300"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            RAG_V2
          </span>
        </button>

        {/* DESKTOP NAV */}
        <ul className="hidden md:flex items-center gap-8 text-sm">

          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => smoothScrollTo(item.id)}
                className={`
                  relative transition-all duration-300 font-medium
                  ${
                    activeSection === item.id
                      ? "text-rose-600"
                      : "text-gray-500 hover:text-rose-600"
                  }
                `}
              >
                {item.label}

                {/* active underline */}
                <span
                  className={`
                    absolute left-0 -bottom-1 h-[2px] rounded-full
                    bg-gradient-to-r from-rose-500 to-amber-500
                    transition-transform duration-300 origin-left
                    ${
                      activeSection === item.id
                        ? "scale-x-100"
                        : "scale-x-0"
                    }
                  `}
                />
              </button>
            </li>
          ))}

        </ul>

        {/* RIGHT ACTIONS */}
        <div className="hidden md:flex items-center gap-3">

          {showGetStarted && (
            <button
              onClick={onGetStarted}
              className="
                px-5 py-2 rounded-xl text-sm font-medium
                bg-gradient-to-r from-rose-500 to-amber-500
                hover:from-rose-600 hover:to-amber-600
                text-white
                shadow-lg shadow-rose-200/50
                hover:shadow-xl hover:shadow-rose-300/50
                transition-all duration-300
                hover:scale-[1.02]
                flex items-center gap-1.5
              "
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="
                px-4 py-2 rounded-xl text-sm font-medium
                bg-white/80 text-gray-600 border border-rose-200/30
                hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200
                transition-all duration-200
                flex items-center gap-1.5
              "
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}

        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-white/50 transition-colors duration-200"
        >
          {menuOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-t border-rose-200/30 shadow-lg py-6 flex flex-col items-center gap-4">

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                smoothScrollTo(item.id);
                setMenuOpen(false);
              }}
              className={`
                text-sm font-medium transition-colors duration-200
                ${
                  activeSection === item.id
                    ? "text-rose-600"
                    : "text-gray-500 hover:text-rose-600"
                }
              `}
            >
              {item.label}
            </button>
          ))}

          {showGetStarted && (
            <button
              onClick={() => {
                onGetStarted();
                setMenuOpen(false);
              }}
              className="
                mt-2 px-6 py-2 rounded-xl text-sm font-medium
                bg-gradient-to-r from-rose-500 to-amber-500
                text-white
                shadow-lg shadow-rose-200/50
                transition-all duration-300
                hover:scale-[1.02]
              "
            >
              Get Started
            </button>
          )}

          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                setMenuOpen(false);
              }}
              className="
                px-6 py-2 rounded-xl text-sm font-medium
                text-gray-600 hover:text-rose-600
                transition-colors duration-200
                flex items-center gap-1.5
              "
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}

        </div>
      )}
    </nav>
  );
}

export default Navbar;
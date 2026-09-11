import { useEffect, useState, useRef } from "react";
import { Sparkles, ChevronLeft, ChevronRight, Quote } from "lucide-react";

function FeatureCarousel() {
  const slides = [
    {
      title: "AI Chat with Your Notes",
      desc: "Ask questions and get grounded answers directly from your study material using RAG-based retrieval.",
      icon: "💬",
      gradient: "from-rose-500 to-amber-500",
      bgGradient: "from-rose-50/50 to-amber-50/30",
      color: "text-rose-600"
    },
    {
      title: "Smart Quiz Generator",
      desc: "Automatically generate MCQs from your notes and test your understanding instantly.",
      icon: "🧠",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50/50 to-cyan-50/30",
      color: "text-blue-600"
    },
    {
      title: "Performance Analytics",
      desc: "Track weak topics and improve your learning efficiency with AI insights.",
      icon: "📊",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50/50 to-pink-50/30",
      color: "text-purple-600"
    },
    {
      title: "Upload & Index Notes",
      desc: "Upload markdown notes and let AI structure and index them instantly.",
      icon: "📚",
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50/50 to-teal-50/30",
      color: "text-emerald-600"
    },
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef(null);
  const wheelTimeoutRef = useRef(null);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // AUTO ROTATION
  useEffect(() => {
    if (paused) return;
    
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [paused]);

  // KEYBOARD SUPPORT
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // MOUSE WHEEL SUPPORT - WITH DEBOUNCING
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleWheel = (e) => {
      e.preventDefault();
      
      // Clear any pending timeout
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = null;
      }

      // Debounce: Only trigger after scrolling stops
      wheelTimeoutRef.current = setTimeout(() => {
        // Detect scroll direction with threshold to avoid accidental triggers
        const threshold = 30;
        if (e.deltaY > threshold) {
          // Scrolling down - next slide
          nextSlide();
        } else if (e.deltaY < -threshold) {
          // Scrolling up - previous slide
          prevSlide();
        }
        wheelTimeoutRef.current = null;
      }, 150); // 150ms delay for smooth experience
    };

    carousel.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      carousel.removeEventListener("wheel", handleWheel);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, []);

  const currentSlide = slides[index];

  return (
    <div
      className="w-full py-24 relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 bg-rose-200/20 rounded-full blur-3xl top-20 left-10" />
        <div className="absolute w-80 h-80 bg-amber-200/20 rounded-full blur-3xl bottom-20 right-10" />
      </div>

      {/* HEADING */}
      <div className="text-center mb-12 px-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100/80 to-amber-100/80 backdrop-blur-sm border border-rose-200/30 text-rose-700 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Features
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
          Powerful Features Built for{' '}
          <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            Students
          </span>
        </h2>
        <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
          Everything you need to learn faster with AI assistance
        </p>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full max-w-5xl mx-auto px-6 mb-8 relative z-10">
        <div className="h-1.5 w-full bg-rose-100/50 overflow-hidden rounded-full">
          <div
            className={`h-full bg-gradient-to-r ${currentSlide.gradient} transition-all duration-700 rounded-full`}
            style={{
              width: `${((index + 1) / slides.length) * 100}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5 px-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* CAROUSEL */}
      <div 
        ref={carouselRef}
        className="relative w-full max-w-5xl mx-auto px-6 z-10"
      >
        {/* Scroll indicator hint */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
          <p className="text-xs text-gray-400/70 flex items-center gap-1">
            <span className="animate-bounce-slow">↕</span>
            Scroll to navigate
          </p>
        </div>

        {/* LEFT ARROW */}
        <button
          onClick={prevSlide}
          className="
            absolute left-2 md:-left-5 top-1/2 -translate-y-1/2
            z-20 w-12 h-12 rounded-2xl
            bg-white/80 backdrop-blur-sm hover:bg-white
            border border-rose-200/30
            text-gray-600 hover:text-rose-600
            shadow-lg shadow-rose-100/20
            transition-all duration-300 hover:scale-105
            flex items-center justify-center
          "
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* RIGHT ARROW */}
        <button
          onClick={nextSlide}
          className="
            absolute right-2 md:-right-5 top-1/2 -translate-y-1/2
            z-20 w-12 h-12 rounded-2xl
            bg-white/80 backdrop-blur-sm hover:bg-white
            border border-rose-200/30
            text-gray-600 hover:text-rose-600
            shadow-lg shadow-rose-100/20
            transition-all duration-300 hover:scale-105
            flex items-center justify-center
          "
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* SLIDES */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-rose-100/20 border border-rose-200/30 bg-white/80 backdrop-blur-sm">

          <div
            className="flex transition-all duration-700 ease-in-out"
            style={{
              transform: `translateX(-${index * 100}%)`,
            }}
          >
            {slides.map((item, i) => (
              <div
                key={i}
                className="min-w-full flex flex-col md:flex-row items-stretch relative"
              >
                {/* LEFT CONTENT */}
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10">
                  <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${item.bgGradient} items-center justify-center text-3xl mb-4 shadow-sm border border-rose-200/20`}>
                    {item.icon}
                  </div>
                  
                  <h3 className={`text-2xl md:text-3xl font-bold text-gray-800 mb-3`}>
                    {item.title}
                  </h3>

                  <p className="text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="flex items-center gap-2 mt-6">
                    <Quote className={`w-4 h-4 ${item.color} opacity-50`} />
                    <div className={`w-12 h-0.5 rounded-full bg-gradient-to-r ${item.gradient}`} />
                    <span className={`text-xs ${item.color} font-medium`}>
                      Feature #{i + 1}
                    </span>
                  </div>
                </div>

                {/* RIGHT IMAGE - Decorative gradient card */}
                <div className="md:w-1/2 p-6 md:p-8 flex items-center justify-center">
                  <div className={`w-full h-64 md:h-[340px] rounded-2xl bg-gradient-to-br ${item.bgGradient} border border-rose-200/20 flex items-center justify-center relative overflow-hidden shadow-inner`}>
                    <div className="text-center">
                      <div className="text-7xl mb-4 animate-bounce-slow">{item.icon}</div>
                      <p className={`text-sm font-medium ${item.color}`}>
                        {item.title.split(" ").slice(0, 3).join(" ")}
                      </p>
                      <div className={`w-12 h-0.5 mx-auto mt-3 rounded-full bg-gradient-to-r ${item.gradient}`} />
                    </div>
                    {/* Decorative dots */}
                    <div className="absolute bottom-4 right-4 flex gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${item.color} opacity-20`} />
                      <div className={`w-2 h-2 rounded-full ${item.color} opacity-40`} />
                      <div className={`w-2 h-2 rounded-full ${item.color} opacity-60`} />
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-4 left-4 flex gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.color} opacity-30`} />
                      <div className={`w-1.5 h-1.5 rounded-full ${item.color} opacity-50`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? `w-8 bg-gradient-to-r ${slides[i].gradient}`
                  : 'w-2 bg-rose-200/50 hover:bg-rose-300'
              }`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="text-center mt-4">
          <span className="text-xs text-gray-400 font-medium">
            {index + 1} / {slides.length}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FeatureCarousel;
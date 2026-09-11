import AboutContact from "./AboutContact";
import Footer from "../common/Footer";
import Navbar from "../common/Navbar";
import FeatureCarousel from "./FeatureCarousel";
import About from "./About";
import NoticePopup from "./NoticePopup";
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  MessageCircle, 
  Brain, 
  BarChart3, 
  Zap, 
  Rocket, 
  GraduationCap,
  Upload,
  Target,
  TrendingUp,
  Award,
  Clock
} from "lucide-react";

function LandingPage({ onGetStarted, onHome }) {
  const features = [
    {
      icon: Upload,
      title: "Smart Notes Upload",
      desc: "Upload markdown notes and turn them into AI searchable knowledge.",
      color: "from-rose-500 to-amber-500",
      iconBg: "from-rose-100 to-amber-100",
      iconColor: "text-rose-600"
    },
    {
      icon: MessageCircle,
      title: "AI Chat Assistant",
      desc: "Ask anything from your notes and get instant answers.",
      color: "from-blue-500 to-cyan-500",
      iconBg: "from-blue-100 to-cyan-100",
      iconColor: "text-blue-600"
    },
    {
      icon: Brain,
      title: "Quiz Generator",
      desc: "Auto-generate MCQs from your study topics.",
      color: "from-purple-500 to-pink-500",
      iconBg: "from-purple-100 to-pink-100",
      iconColor: "text-purple-600"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      desc: "Identify weak areas with AI-powered insights.",
      color: "from-orange-500 to-rose-500",
      iconBg: "from-orange-100 to-rose-100",
      iconColor: "text-orange-600"
    },
    {
      icon: Target,
      title: "Smart Roadmaps",
      desc: "Get personalized study roadmaps for your goals.",
      color: "from-emerald-500 to-teal-500",
      iconBg: "from-emerald-100 to-teal-100",
      iconColor: "text-emerald-600"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      desc: "Track your learning with detailed analytics.",
      color: "from-indigo-500 to-purple-500",
      iconBg: "from-indigo-100 to-purple-100",
      iconColor: "text-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/90 via-amber-50/70 to-orange-50/50 text-gray-800 overflow-hidden relative">

      {/* Decorative warm glow elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-rose-300/20 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
        <div className="absolute w-[500px] h-[500px] bg-amber-300/20 blur-[120px] rounded-full bottom-[-120px] right-[-100px]" />
        <div className="absolute w-[400px] h-[400px] bg-orange-200/15 blur-[100px] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* NAVBAR */}
      <Navbar
        onHome={onHome}
        onGetStarted={onGetStarted}
        showGetStarted={true}
      />
      <NoticePopup />

      {/* ================= HERO ================= */}
      <section
        id="home"
        className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-16 animate-fadeUp"
      >
        <div className="px-6 py-2 rounded-full bg-gradient-to-r from-rose-100/80 to-amber-100/80 backdrop-blur-sm border border-rose-200/30 text-sm mb-6 text-rose-700 font-medium shadow-sm">
          <Sparkles className="inline w-4 h-4 mr-2" />
          AI Powered Study Assistant
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight text-gray-800">
          Learn Smarter with{' '}
          <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            RAG_V2
          </span>
        </h1>

        <p className="mt-6 text-gray-500 max-w-2xl text-lg">
          Upload your notes, ask questions, generate quizzes, and track your learning —
          all powered by Retrieval-Augmented AI.
        </p>

        <div className="flex flex-wrap gap-4 mt-10">
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium transition-all duration-300 shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-[1.02] flex items-center gap-2"
          >
            Start Learning
            <ArrowRight className="w-4 h-4" />
          </button>

          <button 
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3.5 rounded-xl border border-rose-200/50 text-gray-600 hover:bg-white/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] backdrop-blur-sm"
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* ================= CAROUSEL ================= */}
      <section id="features" className="relative z-10">
        <FeatureCarousel />
      </section>

      {/* ================= FEATURES GRID - COMPACT ================= */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100/80 to-amber-100/80 backdrop-blur-sm border border-rose-200/30 text-rose-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Study Smarter
            </span>
          </h2>
          <p className="text-gray-500 mt-2 text-sm max-w-2xl mx-auto">
            AI-powered tools designed to enhance your learning experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-xl p-5 bg-white/70 backdrop-blur-sm border border-rose-200/20 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-rose-100/20"
            >
              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-br ${feature.color.replace('from-', 'from-').replace('to-', 'to-')}/10 blur-xl transition-all duration-500`} />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                
                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                  {feature.title}
                </h3>
                
                <p className="text-xs text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom feature badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-rose-200/30 text-gray-600 text-xs">
            <Award className="w-3.5 h-3.5 text-rose-500" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-amber-200/30 text-gray-600 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Real-time</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-emerald-200/30 text-gray-600 text-xs">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Student-Friendly</span>
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section id="about" className="relative z-10">
        <About />
      </section>

      {/* ================= CONTACT ================= */}
      <section id="contact" className="relative z-10">
        <AboutContact />
      </section>

      {/* ================= CTA ================= */}
      <section className="relative z-10 text-center py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100/80 to-amber-100/80 backdrop-blur-sm border border-rose-200/30 text-rose-700 text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
            Get Started Today
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Start Your{' '}
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              AI Learning
            </span>{' '}
            Journey
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            Smarter learning starts here. Join thousands of students using RAG_V2.
          </p>

          <button
            onClick={onGetStarted}
            className="mt-8 px-10 py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/50 hover:scale-[1.02] flex items-center gap-2 mx-auto"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-gray-400 mt-4">
            <GraduationCap className="inline w-3 h-3 mr-1" />
            Trusted by students worldwide
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default LandingPage;
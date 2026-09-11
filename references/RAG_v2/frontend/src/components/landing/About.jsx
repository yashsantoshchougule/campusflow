import { 
  Sparkles, 
  Zap, 
  Brain, 
  BookOpen, 
  Target, 
  TrendingUp,
  Rocket,
  Shield,
  Users,
  ArrowRight,
  Lightbulb,
  GraduationCap
} from "lucide-react";

function About() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      desc: "Retrieval-Augmented Generation provides accurate answers from your own study materials.",
      color: "from-rose-500 to-amber-500",
      bgColor: "bg-rose-50/50",
      iconColor: "text-rose-600"
    },
    {
      icon: Target,
      title: "Personalized Insights",
      desc: "Identify weak topics and get tailored recommendations to improve your understanding.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50/50",
      iconColor: "text-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      desc: "Track your progress with detailed analytics and measure your learning efficiency.",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50/50",
      iconColor: "text-emerald-600"
    },
    {
      icon: BookOpen,
      title: "Smart Quiz Generation",
      desc: "Auto-generate MCQs from your notes and test your knowledge instantly.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50/50",
      iconColor: "text-purple-600"
    }
  ];

  const stats = [
    { value: "100K+", label: "Questions Answered", icon: Zap },
    { value: "50K+", label: "Students Active", icon: Users },
    { value: "95%", label: "Accuracy Rate", icon: Shield },
    { value: "4.9", label: "User Rating", icon: Sparkles }
  ];

  return (
    <section id="about" className="relative z-10 max-w-7xl mx-auto px-6 py-28">
      
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 bg-rose-200/10 rounded-full blur-3xl top-20 right-20" />
        <div className="absolute w-80 h-80 bg-amber-200/10 rounded-full blur-3xl bottom-20 left-20" />
      </div>

      <div className="grid lg:grid-cols-2 gap-14 items-center relative">
        
        {/* LEFT - Image with minimal overlay */}
        <div className="relative group">
          <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-sm border border-rose-200/30 shadow-2xl shadow-rose-100/20">
            <img
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80"
              alt="Student studying with books and laptop"
              className="w-full h-[420px] object-cover transition duration-500 group-hover:scale-105"
            />
            
            {/* Simple gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent" />
            
            {/* Simple floating badge - AI Powered */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-rose-200/30 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center">
                  <Rocket className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">AI Powered</p>
                  <p className="text-[8px] text-gray-400">RAG_V2</p>
                </div>
              </div>
            </div>

            {/* Simple floating badge - Rating */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-amber-200/30 shadow-lg">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-gray-800">4.9 ★</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - Content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100/80 to-amber-100/80 backdrop-blur-sm border border-rose-200/30 text-rose-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            About RAG_V2
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
            Building a{' '}
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Smarter Way
            </span>{' '}
            to Learn with AI
          </h2>

          <p className="mt-6 text-gray-500 leading-8">
            RAG_V2 is an AI-powered learning platform designed to make studying
            more interactive, personalized, and efficient. Instead of relying on
            generic AI responses, it uses Retrieval-Augmented Generation (RAG)
            to answer questions directly from your own study notes, providing
            accurate and context-aware assistance.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {features.map((feature, idx) => (
              <div key={idx} className={`${feature.bgColor} backdrop-blur-sm rounded-xl p-3 border border-rose-200/20 group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
                <div className="flex items-start gap-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${feature.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-4 h-4 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{feature.title}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-2">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vision Card */}
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-rose-50/80 to-amber-50/80 backdrop-blur-sm border border-rose-200/30 p-6 shadow-lg shadow-rose-100/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-amber-100 rounded-xl flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  🚀 Vision
                </h3>
                <p className="text-gray-500 leading-7 text-sm">
                  The long-term vision is to build an intelligent study companion
                  that adapts to every learner. By combining AI, personalized
                  knowledge retrieval, and performance analytics, RAG_V2 aims to
                  transform static notes into an interactive learning ecosystem.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Link */}
          <button className="mt-6 text-rose-600 hover:text-rose-700 font-medium flex items-center gap-2 group transition-all duration-200">
            Learn more about RAG_V2
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-100/20 to-amber-100/20 rounded-3xl blur-2xl" />
        
        {stats.map((stat, idx) => (
          <div key={idx} className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-rose-200/30 shadow-lg shadow-rose-100/10 hover:shadow-xl hover:shadow-rose-100/20 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <stat.icon className="w-5 h-5 text-rose-500" />
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                {stat.value}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom decorative line */}
      <div className="mt-16 flex justify-center gap-4 opacity-30">
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-rose-300 to-transparent rounded-full" />
        <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full" />
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-orange-300 to-transparent rounded-full" />
      </div>
    </section>
  );
}

export default About;
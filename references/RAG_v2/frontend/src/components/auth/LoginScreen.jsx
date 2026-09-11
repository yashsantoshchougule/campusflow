import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { 
  ArrowLeft, 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ChevronRight,
  BookOpen,
  Brain,
  BarChart3
} from "lucide-react";

function LoginScreen({ onLogin, onSignup, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      console.log("USER:", data.user);
      console.log("SESSION:", data.session);
      console.log("ACCESS TOKEN:", data.session?.access_token);

      localStorage.setItem("access_token", data.session.access_token);
      onLogin(data.user);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex">
      
      {/* LEFT PANEL - Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50">
        
        {/* Decorative glows */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                RAG_V2
              </span>
              <p className="text-[10px] text-gray-400 leading-none">Study Smarter</p>
            </div>
          </div>

          {/* Center Content */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-800 leading-tight">
                Welcome back to<br />
                <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                  Smarter Learning
                </span>
              </h1>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                Continue your AI-powered learning journey with RAG_V2.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm border border-rose-200/30 px-4 py-3 rounded-xl hover:shadow-sm transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">AI-powered answers</p>
                  <p className="text-xs text-gray-400">From your own notes</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm border border-amber-200/30 px-4 py-3 rounded-xl hover:shadow-sm transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Smart quizzes</p>
                  <p className="text-xs text-gray-400">Track your performance</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm border border-orange-200/30 px-4 py-3 rounded-xl hover:shadow-sm transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Personalized roadmaps</p>
                  <p className="text-xs text-gray-400">Adapted to your goals</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400">© 2026 RAG_V2. All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-96 h-96 bg-rose-200/10 blur-3xl rounded-full top-1/3 left-1/2 -translate-x-1/2" />
        </div>

        <div className="w-full max-w-sm space-y-6 relative z-10">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold text-gray-800">Sign In</h2>
            <p className="text-sm text-gray-500">Enter your credentials to access your account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-600 text-sm flex items-center gap-2.5">
              <span className="text-red-400">⚠</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="space-y-3.5">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">Password</label>
                  <button type="button" className="text-xs text-gray-400 hover:text-rose-600 transition-colors duration-200">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Buttons */}
          <div className="flex justify-center gap-3">
            <button className="w-10 h-10 rounded-xl border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-all duration-200 hover:shadow-sm group">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.62.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </button>
            <button className="w-10 h-10 rounded-xl border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-all duration-200 hover:shadow-sm group">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
          </div>

          {/* Signup */}
          <p className="text-center text-xs text-gray-500">
            Don't have an account?{" "}
            <button
              onClick={onSignup}
              className="text-rose-600 hover:text-rose-700 font-medium transition-colors duration-200"
            >
              Create one
            </button>
          </p>

          {/* Demo Credentials */}
          <div className="bg-gray-50/80 rounded-xl px-4 py-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">Demo: demo@ragv2.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
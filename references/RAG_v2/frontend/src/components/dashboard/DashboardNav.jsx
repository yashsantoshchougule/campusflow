import { useState, useEffect } from "react";
import {
  Home,
  BookOpen,
  FileText,
  Brain,
  Map,
  BarChart3,
  User,
  Upload,
  Bell,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  LogOut,
  GraduationCap,
  AlertCircle
} from "lucide-react";

function DashboardNav({
  active = "dashboard",
  onDashboard,
  onStudy,
  onUpload,
  onNotes,
  onQuiz,
  onRoadmap,
  onAnalyticsV2,
  onLogout,
  subject = null,
  user
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuizPopup, setShowQuizPopup] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Quiz logic: Only show on dashboard, disable if no subject
  const shouldShowQuiz = active === "dashboard";
  
  // Check if subject exists and is not empty string
  const isQuizDisabled = !subject || subject.trim() === "";

  // Debug log to check subject value
  console.log("DashboardNav - subject:", subject);
  console.log("DashboardNav - isQuizDisabled:", isQuizDisabled);

  // Base nav items - always shown
  const baseNavItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      action: onDashboard,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "study",
      label: "Study",
      icon: BookOpen,
      action: onStudy,
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      id: "upload",
      label: "Upload",
      icon: Upload,
      action: onUpload,
      gradient: "from-orange-500 to-amber-500"
    },
    {
      id: "notes",
      label: "Notes",
      icon: FileText,
      action: onNotes,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: "roadmap",
      label: "Roadmap",
      icon: Map,
      action: onRoadmap,
      gradient: "from-amber-500 to-orange-500"
    },
    {
      id: "analytics-v2",
      label: "Analytics",
      icon: BarChart3,
      action: onAnalyticsV2,
      gradient: "from-cyan-500 to-blue-500"
    }
  ];

  // Quiz item - only added if shouldShowQuiz is true
  const quizItem = {
    id: "quiz",
    label: "Quiz",
    icon: Brain,
    action: onQuiz,
    gradient: "from-rose-500 to-pink-500",
    disabled: isQuizDisabled
  };

  // Build final nav items
  let navItems = [...baseNavItems];
  
  // Only add quiz if on dashboard
  if (shouldShowQuiz) {
    navItems.splice(3, 0, quizItem); // Insert after Notes
  }

  const getInitials = (email) => {
    if (!email) return "U";
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const handleQuizClick = () => {
    if (isQuizDisabled) {
      setShowQuizPopup(true);
      setTimeout(() => setShowQuizPopup(false), 3000);
    } else {
      onQuiz?.();
    }
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-rose-200/30' 
        : 'bg-white/80 backdrop-blur-sm border-b border-rose-200/20'
    }`}>
      
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-8 flex items-center justify-between">

        {/* Logo with Animation */}
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-amber-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-200/50 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="hidden sm:block">
            <h1 className="font-bold text-lg bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              RAG_v2
            </h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Student Assistant
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const isDisabled = item.disabled;

            if (item.id === "quiz") {
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={handleQuizClick}
                    className={`relative group px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                      isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split(' ')[1]}/30`
                        : isDisabled
                        ? 'text-gray-300 cursor-pointer opacity-50 hover:opacity-70'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:scale-[1.02]'
                    }`}
                  >
                    <Icon size={18} className={`transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                    
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white rounded-full animate-pulse" />
                    )}

                    {isDisabled && (
                      <span className="absolute -top-1 -right-1 text-[8px] bg-gray-200 text-gray-500 px-1 rounded-full">
                        🔒
                      </span>
                    )}
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`relative group px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split(' ')[1]}/30`
                    : 'text-gray-600 hover:bg-gray-100/80 hover:scale-[1.02]'
                }`}
              >
                <Icon size={18} className={`transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                }`} />
                <span className="font-medium">{item.label}</span>
                
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Right */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Notification Bell with Badge */}
          <button className="relative w-10 h-10 rounded-xl hover:bg-rose-50 transition-all duration-200 flex items-center justify-center group">
            <Bell size={20} className="text-gray-500 group-hover:text-rose-500 transition-colors duration-200" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl hover:bg-rose-50 transition-all duration-200 border border-rose-200/30 hover:border-rose-200"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {getInitials(user?.email)}
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${
                showUserMenu ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-rose-200/30 overflow-hidden animate-fadeUp">
                <div className="p-4 border-b border-rose-200/20">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 transition-all duration-200 text-gray-600 hover:text-rose-600 group">
                    <GraduationCap size={18} className="group-hover:scale-110 transition-transform duration-200" />
                    <span>Profile</span>
                  </button>
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200 text-gray-600 hover:text-red-600 group"
                  >
                    <LogOut size={18} className="group-hover:scale-110 transition-transform duration-200" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-xl hover:bg-rose-50 transition-all duration-200"
        >
          {mobileOpen ? (
            <X size={24} className="text-rose-500" />
          ) : (
            <Menu size={24} className="text-gray-500" />
          )}
        </button>

      </div>

      {/* Quiz Disabled Popup */}
      {showQuizPopup && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-fadeUp">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-200/50 p-4 max-w-sm flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Quiz Locked</p>
              <p className="text-gray-500 text-sm mt-0.5">
                Please select a subject from the dashboard to unlock the quiz section.
              </p>
              <button
                onClick={() => setShowQuizPopup(false)}
                className="mt-2 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-rose-200/20 bg-white/95 backdrop-blur-md animate-fadeUp">
          <div className="flex flex-col p-4 gap-1 max-h-[80vh] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              const isDisabled = item.disabled;

              if (item.id === "quiz") {
                return (
                  <button
                    key={item.id}
                    onClick={handleQuizClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                        : isDisabled
                        ? 'text-gray-300 cursor-pointer opacity-50 hover:opacity-70'
                        : 'text-gray-700 hover:bg-rose-50 hover:scale-[1.01]'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'scale-110' : ''} />
                    <span className="font-medium">{item.label}</span>
                    {isDisabled && (
                      <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                        🔒 Select Subject
                      </span>
                    )}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action?.();
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                      : 'text-gray-700 hover:bg-rose-50 hover:scale-[1.01]'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'scale-110' : ''} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}

            <hr className="my-2 border-rose-200/20" />

            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-rose-50 transition-all duration-200">
              <Bell size={20} />
              <span>Notifications</span>
              <span className="ml-auto w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            </button>

            <button
              onClick={() => {
                onLogout?.();
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <User size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default DashboardNav;
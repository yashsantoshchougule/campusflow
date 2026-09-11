import {
  FileText,
  Brain,
  MessageCircle,
  Upload,
  BarChart3,
  Map,
  Lock
} from "lucide-react";

function QuickActions({
  onNotes,
  onQA,
  onQuiz,
  onUpload,
  onAnalytics,
  onRoadmap,
  isDisabled = false
}) {

  const actions = [
    {
      title: "My Notes",
      description: "Create and manage notes",
      icon: FileText,
      color: "bg-purple-100 text-purple-600",
      hoverColor: "hover:bg-purple-50",
      action: onNotes,
    },
    {
      title: "Ask AI",
      description: "Ask questions from your study material",
      icon: MessageCircle,
      color: "bg-green-100 text-green-600",
      hoverColor: "hover:bg-green-50",
      action: onQA,
    },
    {
      title: "Take Quiz",
      description: "Generate an AI quiz",
      icon: Brain,
      color: "bg-blue-100 text-blue-600",
      hoverColor: "hover:bg-blue-50",
      action: onQuiz,
    },
    {
      title: "Study Material",
      description: "Upload or switch subjects",
      icon: Upload,
      color: "bg-orange-100 text-orange-600",
      hoverColor: "hover:bg-orange-50",
      action: onUpload,
    },
    {
      title: "Analytics",
      description: "Track your progress",
      icon: BarChart3,
      color: "bg-pink-100 text-pink-600",
      hoverColor: "hover:bg-pink-50",
      action: onAnalytics,
    },
    {
      title: "Roadmap",
      description: "Manage your study plan",
      icon: Map,
      color: "bg-cyan-100 text-cyan-600",
      hoverColor: "hover:bg-cyan-50",
      action: onRoadmap,
    },
  ];

  return (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <span>⚡</span>
          Quick Actions
          {isDisabled && (
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full flex items-center gap-1 ml-2">
              <Lock size={12} />
              Select subject to unlock
            </span>
          )}
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              onClick={isDisabled ? undefined : item.action}
              disabled={isDisabled}
              className={`
                relative bg-white rounded-2xl border shadow-sm p-6 text-left
                transition-all duration-300
                ${isDisabled 
                  ? 'opacity-60 cursor-not-allowed border-gray-200' 
                  : `${item.hoverColor} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border-gray-100/80`
                }
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center mb-5
                  transition-all duration-300
                  ${isDisabled ? 'opacity-50' : item.color}
                  ${!isDisabled && 'group-hover:scale-110'}
                `}
              >
                <Icon size={28} />
              </div>

              {/* Title */}
              <h3 className={`font-bold text-lg transition-colors duration-300 ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>
                {item.title}
              </h3>

              {/* Description */}
              <p className={`mt-2 text-sm transition-colors duration-300 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.description}
              </p>

              {/* Lock overlay - only when disabled */}
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-2xl">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg border border-amber-200">
                    <Lock size={24} className="text-amber-500" />
                  </div>
                </div>
              )}

              {/* Lock label at bottom */}
              {isDisabled && (
                <div className="absolute bottom-3 right-4">
                  <span className="text-[10px] font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={10} />
                    Locked
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Optional: Show a message when disabled */}
      {isDisabled && (
        <div className="mt-4 p-4 bg-amber-50/80 rounded-xl border border-amber-200/50 text-center">
          <p className="text-sm text-amber-700">
            💡 Select a subject from the hero section above to unlock all quick actions
          </p>
        </div>
      )}
    </section>
  );
}

export default QuickActions;
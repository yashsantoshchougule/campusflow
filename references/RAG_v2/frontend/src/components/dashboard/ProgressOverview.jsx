import {
  Flame,
  BookOpen,
  Brain,
  TrendingUp
} from "lucide-react";

// future plans
// Card	Future Data
// Study Streak	Login history + completed roadmap days
// Notes	GET /notes count
// Quiz Average	Quiz history
// Progress	Completed roadmap topics

function ProgressOverview() {
  const stats = [
    {
      title: "Study Streak",
      value: "0 Days",
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-100",
    },
    {
      title: "Notes",
      value: "--",
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Quiz Average",
      value: "--%",
      icon: Brain,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Progress",
      value: "--%",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-800">
          Progress Overview
        </h2>

        <button className="text-blue-600 hover:text-blue-700 font-medium">
          View Analytics →
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">

                <div>
                  <p className="text-sm text-gray-500">
                    {item.title}
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    {item.value}
                  </h3>
                </div>

                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.bg}`}
                >
                  <Icon
                    size={28}
                    className={item.color}
                  />
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProgressOverview;
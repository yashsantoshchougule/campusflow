import {
  Trophy,
  Medal,
  Star,
  Flame,
  BookOpen,
  Brain,
  Lock
} from "lucide-react";

function Achievements() {

  // Dummy achievements
  const achievements = [
    {
      title: "First Quiz",
      description: "Complete your first quiz.",
      icon: Brain,
      unlocked: true,
      color: "text-blue-600"
    },
    {
      title: "7 Day Streak",
      description: "Study for 7 consecutive days.",
      icon: Flame,
      unlocked: true,
      color: "text-orange-500"
    },
    {
      title: "Roadmap Explorer",
      description: "Complete your first roadmap.",
      icon: BookOpen,
      unlocked: false,
      color: "text-green-600"
    },
    {
      title: "Quiz Master",
      description: "Score above 90% five times.",
      icon: Trophy,
      unlocked: false,
      color: "text-yellow-500"
    },
    {
      title: "Top Performer",
      description: "Complete 100 quizzes.",
      icon: Medal,
      unlocked: false,
      color: "text-purple-600"
    },
    {
      title: "Knowledge Star",
      description: "Create 50 study notes.",
      icon: Star,
      unlocked: true,
      color: "text-pink-500"
    }
  ];

  return (
    <section className="mt-8">

      <div className="bg-white rounded-2xl border shadow-sm p-8">

        <div className="flex justify-between items-center mb-8">

          <div>

            <h2 className="text-2xl font-bold">
              Achievements
            </h2>

            <p className="text-gray-500 mt-1">
              Unlock badges as you continue learning.
            </p>

          </div>

          <Trophy
            size={34}
            className="text-yellow-500"
          />

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

          {achievements.map((badge) => {

            const Icon = badge.icon;

            return (

              <div
                key={badge.title}
                className={`rounded-xl border p-5 transition hover:shadow-md ${
                  badge.unlocked
                    ? "bg-white"
                    : "bg-gray-100 opacity-70"
                }`}
              >

                <div className="flex justify-between items-start">

                  <Icon
                    size={34}
                    className={
                      badge.unlocked
                        ? badge.color
                        : "text-gray-400"
                    }
                  />

                  {!badge.unlocked && (
                    <Lock
                      size={18}
                      className="text-gray-400"
                    />
                  )}

                </div>

                <h3 className="font-bold text-lg mt-5">
                  {badge.title}
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  {badge.description}
                </p>

              </div>

            );

          })}

        </div>

      </div>

    </section>
  );
}

export default Achievements;
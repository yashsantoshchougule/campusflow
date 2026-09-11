import {
  TrendingUp,
  Clock3,
  Brain,
  CheckCircle2
} from "lucide-react";

function WeeklyProgress() {
  // Dummy data for now
  const weekly = [
    { day: "Mon", value: 65 },
    { day: "Tue", value: 90 },
    { day: "Wed", value: 45 },
    { day: "Thu", value: 80 },
    { day: "Fri", value: 55 },
    { day: "Sat", value: 30 },
    { day: "Sun", value: 75 },
  ];

  return (
    <section className="mt-8">

      <div className="bg-white rounded-2xl border shadow-sm p-8">

        <div className="flex items-center justify-between mb-8">

          <div>
            <h2 className="text-2xl font-bold">
              Weekly Progress
            </h2>

            <p className="text-gray-500 mt-1">
              Your learning activity this week
            </p>
          </div>

          <TrendingUp className="text-blue-600" size={32} />

        </div>

        {/* Chart */}
        <div className="flex items-end justify-between gap-4 h-56">

          {weekly.map((item) => (

            <div
              key={item.day}
              className="flex flex-col items-center flex-1"
            >

              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:scale-105"
                style={{
                  height: `${item.value}%`
                }}
              />

              <p className="text-sm mt-3 text-gray-500">
                {item.day}
              </p>

            </div>

          ))}

        </div>

        {/* Stats */}

        <div className="grid md:grid-cols-3 gap-5 mt-10">

          <div className="bg-gray-50 rounded-xl p-5">

            <div className="flex items-center gap-3">

              <Clock3 className="text-blue-600" />

              <div>

                <p className="text-sm text-gray-500">
                  Study Time
                </p>

                <h3 className="text-xl font-bold">
                  6h 45m
                </h3>

              </div>

            </div>

          </div>

          <div className="bg-gray-50 rounded-xl p-5">

            <div className="flex items-center gap-3">

              <Brain className="text-green-600" />

              <div>

                <p className="text-sm text-gray-500">
                  Quizzes
                </p>

                <h3 className="text-xl font-bold">
                  8 Completed
                </h3>

              </div>

            </div>

          </div>

          <div className="bg-gray-50 rounded-xl p-5">

            <div className="flex items-center gap-3">

              <CheckCircle2 className="text-purple-600" />

              <div>

                <p className="text-sm text-gray-500">
                  Topics Finished
                </p>

                <h3 className="text-xl font-bold">
                  12
                </h3>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default WeeklyProgress;
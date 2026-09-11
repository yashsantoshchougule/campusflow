import { Bot, Lightbulb, ArrowRight } from "lucide-react";

function CoachWidget() {
  return (
    <section className="mt-8">

      <div className="bg-white rounded-3xl border shadow-sm p-8">

        <div className="flex items-start gap-5">

          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Bot className="text-blue-600" size={32} />
          </div>

          <div className="flex-1">

            <p className="text-sm uppercase tracking-widest text-gray-400">
              AI Coach
            </p>

            <h2 className="text-2xl font-bold mt-1">
              You're just getting started.
            </h2>

            <p className="text-gray-500 mt-3 leading-7">
              Complete quizzes and roadmaps to unlock personalized study
              recommendations, revision reminders and adaptive coaching.
            </p>

            <div className="mt-6 bg-blue-50 rounded-xl p-5">

              <div className="flex gap-3">

                <Lightbulb className="text-blue-600 mt-1" />

                <div>

                  <p className="font-semibold">
                    Coach Tip
                  </p>

                  <p className="text-gray-600 mt-1">
                    Small daily study sessions are much more effective than
                    one long session before exams.
                  </p>

                </div>

              </div>

            </div>

            <button
              disabled
              className="mt-6 flex items-center gap-2 text-blue-600 font-semibold cursor-not-allowed opacity-60"
            >
              Personalized coaching coming soon
              <ArrowRight size={18} />
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}

export default CoachWidget;
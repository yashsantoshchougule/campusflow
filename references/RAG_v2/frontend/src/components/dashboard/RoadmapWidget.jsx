import { CalendarDays, ArrowRight } from "lucide-react";

function RoadmapWidget({ onRoadmap }) {
  return (
    <section className="mt-8">

      <div className="bg-white rounded-2xl shadow-sm border p-8">

        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Current Roadmap
            </h2>

            <p className="text-gray-500 mt-1">
              Continue your learning journey.
            </p>
          </div>

          <CalendarDays className="text-blue-600" size={30} />

        </div>

        {/* Progress */}

        <div className="mb-6">

          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">
              Overall Progress
            </span>

            <span className="font-semibold">
              0%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">

            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: "0%" }}
            />

          </div>

        </div>

        {/* Next Topic */}

        <div className="bg-blue-50 rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Next Topic
          </p>

          <h3 className="text-xl font-bold mt-1">
            No roadmap yet
          </h3>

          <p className="text-gray-500 mt-2">
            Create a roadmap to begin tracking your progress.
          </p>

        </div>

        {/* Footer */}

        <div className="flex justify-end mt-6">

          <button
            onClick={onRoadmap}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
          >
            Open Roadmap
            <ArrowRight size={18} />
          </button>

        </div>

      </div>

    </section>
  );
}

export default RoadmapWidget;
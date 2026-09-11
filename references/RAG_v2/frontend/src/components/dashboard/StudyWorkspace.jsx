import { Clock3, Target, BookOpen, PlayCircle } from "lucide-react";

function StudyWorkspace({ subject, onQA }) {
  return (
    <section className="mt-8">

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg">

        <p className="uppercase tracking-wider text-blue-100 text-sm">
          Today's Study
        </p>

        <h2 className="text-3xl font-bold mt-2">
          Continue Learning
        </h2>

        <p className="mt-2 text-blue-100">
          Stay consistent. Even 30 minutes every day makes a difference.
        </p>

        <div className="grid md:grid-cols-3 gap-5 mt-8">

          <div className="bg-white/10 rounded-xl p-5 backdrop-blur">

            <BookOpen size={22} />

            <p className="text-sm mt-3 text-blue-100">
              Current Subject
            </p>

            <h3 className="text-xl font-semibold mt-1">
              {subject || "None Selected"}
            </h3>

          </div>

          <div className="bg-white/10 rounded-xl p-5 backdrop-blur">

            <Clock3 size={22} />

            <p className="text-sm mt-3 text-blue-100">
              Estimated Study
            </p>

            <h3 className="text-xl font-semibold mt-1">
              45 mins
            </h3>

          </div>

          <div className="bg-white/10 rounded-xl p-5 backdrop-blur">

            <Target size={22} />

            <p className="text-sm mt-3 text-blue-100">
              Today's Goal
            </p>

            <h3 className="text-xl font-semibold mt-1">
              Complete Next Topic
            </h3>

          </div>

        </div>

        <button
          onClick={onQA}
          className="mt-8 bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold flex items-center gap-3 hover:bg-blue-50 transition"
        >
          <PlayCircle size={22} />
          Resume Studying
        </button>

      </div>

    </section>
  );
}

export default StudyWorkspace;
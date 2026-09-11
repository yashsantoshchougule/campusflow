import { Flame, Trophy } from "lucide-react";

function StudyStreak() {

  // Dummy activity
  const activity = [
    1,1,0,2,1,1,2,
    2,1,1,0,1,2,2,
    1,0,0,1,2,1,1,
    2,2,1,1,0,1,2
  ];

  const getColor = (level) => {
    switch(level){
      case 0:
        return "bg-gray-200";
      case 1:
        return "bg-green-300";
      case 2:
        return "bg-green-600";
      default:
        return "bg-gray-200";
    }
  }

  return (

    <section className="mt-8">

      <div className="bg-white rounded-2xl border shadow-sm p-8">

        <div className="flex justify-between items-center mb-8">

          <div>

            <h2 className="text-2xl font-bold">
              Study Streak
            </h2>

            <p className="text-gray-500 mt-1">
              Stay consistent every day.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <Flame
              className="text-orange-500"
              size={34}
            />

            <div>

              <p className="text-sm text-gray-500">
                Current Streak
              </p>

              <h3 className="font-bold text-2xl">
                8 Days
              </h3>

            </div>

          </div>

        </div>

        {/* Heatmap */}

        <div className="grid grid-cols-7 gap-3">

          {activity.map((item,index)=>(
            <div
              key={index}
              className={`aspect-square rounded-md ${getColor(item)}`}
            />
          ))}

        </div>

        <div className="flex justify-between items-center mt-8">

          <div className="text-sm text-gray-500">

            Study consistently to maintain your streak.

          </div>

          <div className="flex items-center gap-2 text-yellow-600 font-semibold">

            <Trophy size={18}/>

            Next Badge in 2 Days

          </div>

        </div>

      </div>

    </section>

  );

}

export default StudyStreak;
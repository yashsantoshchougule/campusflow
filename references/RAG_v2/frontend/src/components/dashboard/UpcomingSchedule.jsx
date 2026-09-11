import {
  Calendar,
  BookOpen,
  Clock,
  ClipboardCheck
} from "lucide-react";

function UpcomingSchedule() {

  const events = [
    {
      type: "Study",
      title: "No active roadmap",
      time: "Create one to begin",
      icon: BookOpen,
      color: "text-blue-600"
    },
    {
      type: "Checkpoint Quiz",
      title: "No quiz scheduled",
      time: "--",
      icon: ClipboardCheck,
      color: "text-green-600"
    },
    {
      type: "Mock Exam",
      title: "Not scheduled",
      time: "--",
      icon: Calendar,
      color: "text-orange-600"
    }
  ];

  return (
    <section className="mt-8">

      <div className="bg-white rounded-2xl shadow-sm border p-8">

        <h2 className="text-2xl font-bold mb-6">
          Upcoming Schedule
        </h2>

        <div className="space-y-4">

          {events.map((item) => {

            const Icon = item.icon;

            return (

              <div
                key={item.title}
                className="flex items-center justify-between border rounded-xl p-4 hover:bg-gray-50"
              >

                <div className="flex gap-4 items-center">

                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon
                      className={item.color}
                      size={22}
                    />
                  </div>

                  <div>

                    <p className="font-semibold">
                      {item.title}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.type}
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-2 text-gray-500">

                  <Clock size={16} />

                  {item.time}

                </div>

              </div>

            );

          })}

        </div>

      </div>

    </section>
  );
}

export default UpcomingSchedule;
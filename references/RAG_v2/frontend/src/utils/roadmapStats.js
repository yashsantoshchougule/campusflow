export function getRoadmapStats(roadmap) {
  if (!roadmap) {
    return {
      completed: 0,
      total: 0,
      progress: 0,
      daysLeft: 0,
      pace: "on_track",
    };
  }

  const allTopics = roadmap.weeks.flatMap((week) => week.topics);

  const completed = allTopics.filter(
    (topic) => topic.topic.status === "completed"
  ).length;

  const total = allTopics.length;

  const progress =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const today = new Date();
  const target = new Date(roadmap.target_date);

  const daysLeft = Math.ceil(
    (target - today) / (1000 * 60 * 60 * 24)
  );

  const created = new Date(roadmap.created_at);

  const totalDays =
    Math.ceil((target - created) / (1000 * 60 * 60 * 24)) || 1;

  const elapsedDays =
    Math.ceil((today - created) / (1000 * 60 * 60 * 24)) || 1;

  const expectedProgress = Math.round(
    (elapsedDays / totalDays) * 100
  );

  let pace = "on_track";

  if (progress > expectedProgress + 10) {
    pace = "ahead";
  } else if (progress < expectedProgress - 10) {
    pace = "behind";
  }

  return {
    completed,
    total,
    progress,
    daysLeft,
    pace,
  };
}
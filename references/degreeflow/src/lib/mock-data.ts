import type {
  Commitment,
  Deliverable,
  ExerciseCategory,
  Exam,
  Preferences,
  TheoryTopic,
} from "./types";

// Compute dates relative to today for demo realism
const today = new Date();
function isoDateInDays(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_COMMITMENTS: Commitment[] = [
  { id: "c1", name: "Machine Learning lecture", day: "Mon", start: "09:00", end: "12:00", type: "Lecture" },
  { id: "c2", name: "Database lecture", day: "Tue", start: "14:00", end: "16:00", type: "Lecture" },
  { id: "c3", name: "Part-time work", day: "Wed", start: "10:00", end: "12:00", type: "Work" },
  { id: "c4", name: "Statistics lecture", day: "Thu", start: "09:00", end: "11:00", type: "Lecture" },
  { id: "c5", name: "Gym", day: "Fri", start: "15:00", end: "17:00", type: "Sport" },
];

const t = (id: string, p: Omit<TheoryTopic, "id" | "kind">): TheoryTopic => ({ id, kind: "Theory", ...p });
const x = (id: string, p: Omit<ExerciseCategory, "id" | "kind">): ExerciseCategory => ({ id, kind: "Exercise", ...p });
const d = (id: string, p: Omit<Deliverable, "id" | "kind">): Deliverable => ({ id, kind: "Project", ...p });

export const DEFAULT_EXAMS: Exam[] = [
  {
    id: "ml",
    name: "Machine Learning",
    ects: 8,
    difficulty: "Hard",
    examType: "Written + Project",
    priority: "High",
    goal: "Excellent grade",
    status: "Started",
    options: [isoDateInDays(20), isoDateInDays(36), isoDateInDays(54)],
    theory: [
      t("ml-t1", { title: "Supervised learning basics", difficulty: "Medium", estimatedHours: 2, autoEstimate: true, materialStatus: "Material ready", progress: "Studying", preferredMethod: "Mind maps" }),
      t("ml-t2", { title: "Neural networks", difficulty: "Hard", estimatedHours: 4, autoEstimate: true, materialStatus: "Notes to clean", progress: "Not started", preferredMethod: "Feynman Technique" }),
      t("ml-t3", { title: "Regularization", difficulty: "Medium", estimatedHours: 2, autoEstimate: true, materialStatus: "Slides to review", progress: "Not started", preferredMethod: "Mind maps" }),
    ],
    exercises: [
      x("ml-x1", { title: "Gradient descent exercises", difficulty: "Medium", estimatedHours: 2, autoEstimate: true, source: "Exercise sheet", progress: "Some attempted", preferredMethod: "Exercise repetition" }),
      x("ml-x2", { title: "Past exam: model evaluation", difficulty: "Hard", estimatedHours: 3, autoEstimate: true, source: "Past exam", progress: "Not started", preferredMethod: "Past exam simulations" }),
    ],
    deliverables: [
      d("ml-d1", { title: "Implement baseline classifier", deadline: isoDateInDays(10), estimatedHours: 4, autoEstimate: true, priority: "High", status: "In progress", preferredMethod: "Implementation block" }),
    ],
    attachments: [
      { id: "ml-a1", label: "Lecture slides" },
      { id: "ml-a2", label: "Personal notes" },
    ],
  },
  {
    id: "db",
    name: "Database Systems",
    ects: 6,
    difficulty: "Medium",
    examType: "Written",
    priority: "Medium",
    goal: "Good grade",
    status: "Halfway",
    options: [isoDateInDays(23), isoDateInDays(40), isoDateInDays(57)],
    theory: [
      t("db-t1", { title: "Normalization", difficulty: "Medium", estimatedHours: 2, autoEstimate: true, materialStatus: "Material ready", progress: "First revision done", preferredMethod: "Flashcards" }),
      t("db-t2", { title: "Transactions", difficulty: "Hard", estimatedHours: 3, autoEstimate: true, materialStatus: "Slides to review", progress: "Not started", preferredMethod: "Mind maps" }),
    ],
    exercises: [
      x("db-x1", { title: "SQL joins", difficulty: "Medium", estimatedHours: 2, autoEstimate: true, source: "Past exam", progress: "Some attempted", preferredMethod: "Timed practice" }),
      x("db-x2", { title: "Indexing exercises", difficulty: "Hard", estimatedHours: 3, autoEstimate: true, source: "Exercise sheet", progress: "Not started", preferredMethod: "Error review" }),
    ],
    deliverables: [],
    attachments: [{ id: "db-a1", label: "Past exam PDF" }],
  },
  {
    id: "sl",
    name: "Statistical Learning",
    ects: 8,
    difficulty: "Hard",
    examType: "Oral",
    priority: "High",
    goal: "Good grade",
    status: "Not started",
    options: [isoDateInDays(29), isoDateInDays(44), isoDateInDays(61)],
    theory: [
      t("sl-t1", { title: "Bias-variance tradeoff", difficulty: "Hard", estimatedHours: 3, autoEstimate: true, materialStatus: "Notes to clean", progress: "Not started", preferredMethod: "Feynman Technique" }),
      t("sl-t2", { title: "Model selection", difficulty: "Medium", estimatedHours: 2, autoEstimate: true, materialStatus: "Material ready", progress: "Not started", preferredMethod: "Oral rehearsal" }),
    ],
    exercises: [
      x("sl-x1", { title: "Classification exercises", difficulty: "Medium", estimatedHours: 2, autoEstimate: true, source: "Exercise sheet", progress: "Not started", preferredMethod: "Exercise repetition" }),
    ],
    deliverables: [],
    attachments: [{ id: "sl-a1", label: "Formula sheet" }],
  },
];

export const DEFAULT_PREFERENCES: Preferences = {
  preferredStudyTime: "Afternoon",

  minBreakMinutes: 30,
  unavailableDays: ["Sun"],
  restSlots: [
    { id: "rest-lunch", name: "Lunch", start: "13:00", end: "14:00", days: "every" },
    { id: "rest-dinner", name: "Dinner", start: "19:30", end: "20:30", days: "every" },
  ],
  examsToTake: 3,
  minDaysBetweenExams: 7,
  maxExamsPerWeek: 2,
  period: "Balanced",
  risk: "Safe",
  intensity: "Balanced",
  prioritize: ["High priority first", "Best spacing"],
  studyMethods: [
    "Feynman Technique",
    "Mind maps",
    "Flashcards",
    "Spaced repetition",
    "Past exam simulations",
    "Exercise repetition",
  ],
  blockDuration: 90,
  revisionFrequency: "Balanced",
  studyMode: "Mixed",
  bufferDays: 1,
};

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type CommitmentType =
  | "Lecture"
  | "Work"
  | "Commute"
  | "Sport"
  | "Personal"
  | "Other";

export interface Commitment {
  id: string;
  name: string;
  day: Weekday;
  start: string; // HH:mm
  end: string;
  type: CommitmentType;
}

export type Difficulty = "Easy" | "Medium" | "Hard";
export type ExamType =
  | "Written"
  | "Oral"
  | "Project"
  | "Written + Oral"
  | "Written + Project"
  | "Combined";
export type Priority = "Low" | "Medium" | "High";
export type ExamGoal = "Pass only" | "Good grade" | "Excellent grade";
export type PrepStatus = "Not started" | "Started" | "Halfway" | "Almost ready";

// ============= STUDY BACKLOG =============

export type StudyMethod =
  | "Auto"
  | "Spaced repetition"
  | "Feynman Technique"
  | "Mind maps"
  | "Flashcards"
  | "Past exam simulations"
  | "Exercise repetition"
  | "Pomodoro blocks"
  | "Oral rehearsal"
  | "Project milestone planning"
  | "Timed practice"
  | "Formula flashcards"
  | "Error review"
  | "Project milestone block"
  | "Documentation block"
  | "Implementation block"
  | "Presentation rehearsal";

export const ALL_STUDY_METHODS: StudyMethod[] = [
  "Spaced repetition",
  "Feynman Technique",
  "Mind maps",
  "Flashcards",
  "Past exam simulations",
  "Exercise repetition",
  "Pomodoro blocks",
  "Oral rehearsal",
  "Project milestone planning",
];

export type MaterialStatus =
  | "Material ready"
  | "Notes to clean"
  | "Slides to review"
  | "Missing material";

export type TheoryProgress =
  | "Not started"
  | "Material prepared"
  | "Studying"
  | "First revision done"
  | "Mastered";

export type ExerciseSource =
  | "Past exam"
  | "Exercise sheet"
  | "Lab"
  | "Book exercises"
  | "Custom";

export type ExerciseProgress =
  | "Not started"
  | "Some attempted"
  | "Needs correction"
  | "Repeated once"
  | "Confident";

export type DeliverableStatus =
  | "Not started"
  | "In progress"
  | "Review needed"
  | "Completed";

export const THEORY_METHODS: StudyMethod[] = [
  "Auto",
  "Feynman Technique",
  "Mind maps",
  "Spaced repetition",
  "Flashcards",
  "Oral rehearsal",
];
export const EXERCISE_METHODS: StudyMethod[] = [
  "Auto",
  "Exercise repetition",
  "Past exam simulations",
  "Timed practice",
  "Formula flashcards",
  "Error review",
];
export const PROJECT_METHODS: StudyMethod[] = [
  "Auto",
  "Project milestone block",
  "Documentation block",
  "Implementation block",
  "Presentation rehearsal",
];

export interface TheoryTopic {
  id: string;
  kind: "Theory";
  title: string;
  description?: string;
  difficulty: Difficulty;
  estimatedHours: number;
  autoEstimate: boolean;
  materialStatus: MaterialStatus;
  progress: TheoryProgress;
  preferredMethod: StudyMethod;
}

export interface ExerciseCategory {
  id: string;
  kind: "Exercise";
  title: string;
  description?: string;
  difficulty: Difficulty;
  estimatedHours: number;
  autoEstimate: boolean;
  source: ExerciseSource;
  progress: ExerciseProgress;
  preferredMethod: StudyMethod;
}

export interface Deliverable {
  id: string;
  kind: "Project";
  title: string;
  description?: string;
  deadline: string; // ISO date
  estimatedHours: number;
  autoEstimate: boolean;
  priority: Priority;
  status: DeliverableStatus;
  preferredMethod: StudyMethod;
}

export type BacklogItem = TheoryTopic | ExerciseCategory | Deliverable;

export interface Attachment {
  id: string;
  label: string;
}

export interface Exam {
  id: string;
  name: string;
  ects: number;
  difficulty: Difficulty;
  examType: ExamType;
  priority: Priority;
  goal: ExamGoal;
  status: PrepStatus;
  options: string[]; // ISO date strings, multiple candidate exam dates
  theory: TheoryTopic[];
  exercises: ExerciseCategory[];
  deliverables: Deliverable[];
  attachments: Attachment[];
}

export type StudyTimePref = "Morning" | "Afternoon" | "Evening" | "Flexible";
export type PeriodPref = "Earlier" | "Balanced" | "Later";
export type RiskAttitude = "Safe" | "Balanced" | "Aggressive";
export type Intensity = "Light" | "Balanced" | "Intensive";
export type BlockDuration = 45 | 60 | 90 | 120;
export type StudyMode = "Theory-first" | "Exercises-first" | "Mixed";
export type BufferDays = 0 | 1 | 2;

export type PrioritizeRule =
  | "Hardest first"
  | "High priority first"
  | "Best spacing"
  | "Lower workload"
  | "Best grade goal";

export interface RestSlot {
  id: string;
  name: string;
  start: string; // HH:mm
  end: string;
  days: "every" | "weekdays" | "weekend" | "custom";
  customDays?: Weekday[];
}

export interface Preferences {
  // Availability
  preferredStudyTime: StudyTimePref;
  /** @deprecated Capacity is now derived automatically from free slots. */
  maxStudyHoursPerDay?: number;
  minBreakMinutes: number;
  unavailableDays: Weekday[];
  restSlots: RestSlot[];
  // Planning
  examsToTake: number;
  minDaysBetweenExams: number;
  maxExamsPerWeek: number;
  period: PeriodPref;
  risk: RiskAttitude;
  intensity: Intensity;
  prioritize: PrioritizeRule[];
  // Global study preferences
  studyMethods: StudyMethod[];
  blockDuration: BlockDuration;
  revisionFrequency: Intensity;
  studyMode: StudyMode;
  bufferDays: BufferDays;
}

export interface UnexpectedEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  importance: "Low" | "Medium" | "High";
}

export interface SelectedExam {
  examId: string;
  examName: string;
  chosenDate: string; // ISO
  reason: string;
}

export interface RejectedOption {
  examName: string;
  date: string;
  reason: string;
}

export interface ExamPlan {
  selected: SelectedExam[];
  rejected: RejectedOption[];
  skipped: { examName: string; reason: string }[];
  health: "Good" | "Tight" | "Critical";
  healthReason: string;
}

export type BlockPriority = "Low" | "Medium" | "High" | "Critical";
export type BlockKind = "Theory" | "Exercise" | "Project" | "Prep" | "Review";

export interface StudyBlock {
  id: string;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  examId: string;
  examName: string;
  taskId: string;
  taskTitle: string; // e.g. "Neural Networks theory"
  kind: BlockKind;
  method: string;
  priority: BlockPriority;
  reason: string;
  /** Soft tasks may run after dinner (~20:00–22:00). */
  soft?: boolean;
  moved?: boolean;
  manuallyMoved?: boolean;
  originalDate?: string;
  originalStart?: string;
}

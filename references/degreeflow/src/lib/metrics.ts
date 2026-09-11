import type {
  Deliverable,
  Exam,
  ExamPlan,
  ExerciseCategory,
  StudyBlock,
  TheoryTopic,
} from "./types";
import { daysUntil, effectiveHours } from "./scheduler";

// ---------- progress scoring ----------

export function theoryScore(t: TheoryTopic): number {
  switch (t.progress) {
    case "Not started": return 0;
    case "Material prepared": return 25;
    case "Studying": return 50;
    case "First revision done": return 75;
    case "Mastered": return 100;
  }
}

export function exerciseScore(x: ExerciseCategory): number {
  switch (x.progress) {
    case "Not started": return 0;
    case "Some attempted": return 35;
    case "Needs correction": return 50;
    case "Repeated once": return 75;
    case "Confident": return 100;
  }
}

export function deliverableScore(d: Deliverable): number {
  switch (d.status) {
    case "Not started": return 0;
    case "In progress": return 50;
    case "Review needed": return 80;
    case "Completed": return 100;
  }
}

export function materialScoreForTheory(t: TheoryTopic): number {
  switch (t.materialStatus) {
    case "Material ready": return 100;
    case "Slides to review": return 60;
    case "Notes to clean": return 50;
    case "Missing material": return 0;
  }
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface CourseMetrics {
  examId: string;
  examName: string;
  chosenDate: string | null;
  daysToExam: number | null;
  theoryProgress: number;
  exerciseProgress: number;
  projectProgress: number | null;
  materialReadiness: number;
  overallReadiness: number;
  risk: "Low" | "Medium" | "High" | "Critical";
  riskReason: string;
  remainingItems: number;
  nextAction: { title: string; reason: string } | null;
}

export function computeCourseMetrics(exam: Exam, plan: ExamPlan | null): CourseMetrics {
  const sel = plan?.selected.find((s) => s.examId === exam.id) ?? null;
  const chosenDate = sel?.chosenDate ?? null;
  const dte = chosenDate ? daysUntil(chosenDate) : null;

  const theoryProgress = avg(exam.theory.map(theoryScore));
  const exerciseProgress = avg(exam.exercises.map(exerciseScore));
  const projectProgress = exam.deliverables.length > 0 ? avg(exam.deliverables.map(deliverableScore)) : null;
  const materialReadiness = exam.theory.length > 0 ? avg(exam.theory.map(materialScoreForTheory)) : 100;

  let wTheory = 0.4, wEx = 0.35, wProj = 0.15, wMat = 0.1;
  if (projectProgress === null) {
    // redistribute project weight proportionally to theory and exercises
    const total = wTheory + wEx;
    wTheory += (wProj * wTheory) / total;
    wEx += (wProj * wEx) / total;
    wProj = 0;
  }
  const overallReadiness = Math.round(
    theoryProgress * wTheory +
      exerciseProgress * wEx +
      (projectProgress ?? 0) * wProj +
      materialReadiness * wMat,
  );

  const remainingItems =
    exam.theory.filter((t) => theoryScore(t) < 100).length +
    exam.exercises.filter((x) => exerciseScore(x) < 100).length +
    exam.deliverables.filter((d) => deliverableScore(d) < 100).length;

  // Risk: rule-based
  let risk: CourseMetrics["risk"] = "Low";
  let riskReason = "Good readiness and enough time remaining.";
  const hardish = exam.difficulty === "Hard" || exam.priority === "High";
  if (dte !== null) {
    if (dte <= 7 && overallReadiness < 60) { risk = "Critical"; riskReason = `Exam in ${dte} days and readiness only ${overallReadiness}%.`; }
    else if (dte <= 14 && overallReadiness < 50) { risk = "Critical"; riskReason = `Tight: ${dte} days left, readiness ${overallReadiness}%.`; }
    else if (hardish && (overallReadiness < 40 || materialReadiness < 50)) { risk = "High"; riskReason = `Hard course with low readiness (${overallReadiness}%) or missing material.`; }
    else if (overallReadiness < 60 || materialReadiness < 70) { risk = "Medium"; riskReason = `Steady progress, but ${100 - overallReadiness}% of work still remains.`; }
    else { risk = "Low"; riskReason = `On track at ${overallReadiness}% with ${dte} days to go.`; }
  } else if (overallReadiness < 40) {
    risk = "Medium"; riskReason = "No exam date chosen yet — readiness still low.";
  }

  // Next recommended task: pick highest-priority unfinished backlog item
  const nextAction = pickNextAction(exam);

  return {
    examId: exam.id,
    examName: exam.name,
    chosenDate,
    daysToExam: dte,
    theoryProgress: Math.round(theoryProgress),
    exerciseProgress: Math.round(exerciseProgress),
    projectProgress: projectProgress === null ? null : Math.round(projectProgress),
    materialReadiness: Math.round(materialReadiness),
    overallReadiness,
    risk,
    riskReason,
    remainingItems,
    nextAction,
  };
}

function pickNextAction(exam: Exam): CourseMetrics["nextAction"] {
  // 1) Missing/unprepared material before deep study
  const missing = exam.theory.find((t) => t.materialStatus === "Missing material");
  if (missing) return { title: `Gather material for ${missing.title}`, reason: "Material is missing — prep first." };
  const notes = exam.theory.find((t) => t.materialStatus === "Notes to clean" || t.materialStatus === "Slides to review");
  if (notes) return { title: `Clean notes for ${notes.title}`, reason: `${notes.materialStatus.toLowerCase()} before deep study.` };

  // 2) Hard not-started topics
  const hardTheory = exam.theory.find((t) => t.difficulty === "Hard" && t.progress === "Not started");
  if (hardTheory) return { title: `${hardTheory.title} — first deep pass`, reason: "Hard topic, still not started." };

  // 3) Exercises for written exams
  if (exam.examType.includes("Written")) {
    const ex = exam.exercises.find((x) => exerciseScore(x) < 75);
    if (ex) return { title: `${ex.title} — timed practice`, reason: "Written exam: build exercise fluency." };
  }

  // 4) Oral rehearsal for oral exams
  if (exam.examType.includes("Oral")) {
    const t = exam.theory.find((tp) => theoryScore(tp) < 100);
    if (t) return { title: `${t.title} — oral rehearsal`, reason: "Oral exam: rehearse the explanation aloud." };
  }

  // 5) Project milestone if deadline is close
  const proj = [...exam.deliverables]
    .filter((d) => deliverableScore(d) < 100)
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))[0];
  if (proj) return { title: `${proj.title}`, reason: `Project deadline ${proj.deadline}.` };

  const any =
    exam.theory.find((t) => theoryScore(t) < 100) ??
    exam.exercises.find((x) => exerciseScore(x) < 100);
  if (any) return { title: any.title, reason: "Next unfinished backlog item." };
  return null;
}

// ---------- weekly aggregates ----------

export interface WeeklyMomentum {
  plannedBlocks: number;
  completedBlocks: number;
  plannedHours: number;
  completedHours: number;
  remainingHours: number;
  percent: number;
}

export function blockDurationHours(b: StudyBlock): number {
  const [sh, sm] = b.start.split(":").map(Number);
  const [eh, em] = b.end.split(":").map(Number);
  return (eh * 60 + em - sh * 60 - sm) / 60;
}

export function getWeekRange(weekOffset = 0): { keys: string[]; start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + monOffset + weekOffset * 7);
  const keys = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const end = new Date(start); end.setDate(end.getDate() + 6);
  return { keys, start, end };
}

export function computeWeeklyMomentum(
  schedule: StudyBlock[],
  completed: Set<string>,
  weekOffset = 0,
): WeeklyMomentum {
  const { keys } = getWeekRange(weekOffset);
  const inWeek = schedule.filter((b) => keys.includes(b.date));
  const plannedBlocks = inWeek.length;
  const completedBlocks = inWeek.filter((b) => completed.has(b.id)).length;
  const plannedHours = inWeek.reduce((s, b) => s + blockDurationHours(b), 0);
  const completedHours = inWeek.filter((b) => completed.has(b.id)).reduce((s, b) => s + blockDurationHours(b), 0);
  return {
    plannedBlocks,
    completedBlocks,
    plannedHours,
    completedHours,
    remainingHours: Math.max(0, plannedHours - completedHours),
    percent: plannedBlocks ? Math.round((completedBlocks / plannedBlocks) * 100) : 0,
  };
}

// Make sure auto-estimate values are not import-unused in some builds.
void effectiveHours;

import type {
  BacklogItem,
  BlockKind,
  Commitment,
  Deliverable,
  Exam,
  ExamPlan,
  ExerciseCategory,
  Preferences,
  RejectedOption,
  SelectedExam,
  StudyBlock,
  StudyMethod,
  TheoryTopic,
  UnexpectedEvent,
  RestSlot,
  Weekday,
} from "./types";
import { WEEKDAYS } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAY_ALIASES: Record<string, Weekday> = {
  Mon: "Mon", Monday: "Mon",
  Tue: "Tue", Tuesday: "Tue",
  Wed: "Wed", Wednesday: "Wed",
  Thu: "Thu", Thursday: "Thu",
  Fri: "Fri", Friday: "Fri",
  Sat: "Sat", Saturday: "Sat",
  Sun: "Sun", Sunday: "Sun",
};

type LongWeekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

const LONG_WEEKDAYS: LongWeekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const LONG_WEEKDAY_ALIASES: Record<string, LongWeekday> = {
  Mon: "Monday", Monday: "Monday",
  Tue: "Tuesday", Tuesday: "Tuesday",
  Wed: "Wednesday", Wednesday: "Wednesday",
  Thu: "Thursday", Thursday: "Thursday",
  Fri: "Friday", Friday: "Friday",
  Sat: "Saturday", Saturday: "Saturday",
  Sun: "Sunday", Sunday: "Sunday",
};

function normalizeWeekday(day: string): Weekday {
  return WEEKDAY_ALIASES[day] ?? (day as Weekday);
}

function normalizeLongWeekday(day: string): LongWeekday {
  return LONG_WEEKDAY_ALIASES[day] ?? (day as LongWeekday);
}

function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayYMD(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toYMD(d);
}

export function daysUntil(iso: string): number {
  const target = parseLocalDate(iso).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - start) / DAY_MS);
}

export function weekdayOf(isoDate: string): Weekday {
  const d = parseLocalDate(isoDate);
  const idx = (d.getDay() + 6) % 7;
  return WEEKDAYS[idx];
}

function longWeekdayOf(isoDate: string): LongWeekday {
  const d = parseLocalDate(isoDate);
  const idx = (d.getDay() + 6) % 7;
  return LONG_WEEKDAYS[idx];
}

export function formatDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
}

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toTime(min: number): string {
  const h = Math.floor(min / 60); const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const STATUS_WEIGHT: Record<Exam["status"], number> = { "Not started": 1, Started: 0.75, Halfway: 0.5, "Almost ready": 0.25 };
const DIFF_W: Record<Exam["difficulty"], number> = { Easy: 0.6, Medium: 1, Hard: 1.4 };
const GOAL_W: Record<Exam["goal"], number> = { "Pass only": 0.7, "Good grade": 1, "Excellent grade": 1.3 };
const PRIO_W: Record<Exam["priority"], number> = { Low: 0.7, Medium: 1, High: 1.3 };

function examWeight(e: Exam): number {
  return DIFF_W[e.difficulty] * PRIO_W[e.priority] * GOAL_W[e.goal] * STATUS_WEIGHT[e.status] * Math.min(e.ects / 6, 1.5);
}

// ===================== EXAM PLAN SELECTION =====================

function rankExamsForSelection(exams: Exam[], prefs: Preferences): Exam[] {
  return [...exams].sort((a, b) => {
    for (const rule of prefs.prioritize) {
      let diff = 0;
      switch (rule) {
        case "High priority first": diff = PRIO_W[b.priority] - PRIO_W[a.priority]; break;
        case "Hardest first": diff = DIFF_W[b.difficulty] - DIFF_W[a.difficulty]; break;
        case "Lower workload": diff = a.ects - b.ects; break;
        case "Best grade goal": diff = GOAL_W[b.goal] - GOAL_W[a.goal]; break;
        case "Best spacing": break;
      }
      if (diff !== 0) return diff;
    }
    return PRIO_W[b.priority] - PRIO_W[a.priority];
  });
}

interface Combo {
  picks: { exam: Exam; date: string }[];
  score: number;
  invalid?: string;
}

function neededPrepDays(e: Exam): number {
  const base = e.difficulty === "Hard" ? 28 : e.difficulty === "Medium" ? 18 : 10;
  return Math.round(base * STATUS_WEIGHT[e.status] * GOAL_W[e.goal]);
}

function evalCombo(picks: { exam: Exam; date: string }[], prefs: Preferences): Combo {
  const sorted = [...picks].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  for (let i = 1; i < sorted.length; i++) {
    const gap = (+new Date(sorted[i].date) - +new Date(sorted[i - 1].date)) / DAY_MS;
    if (gap < prefs.minDaysBetweenExams)
      return { picks: sorted, score: -Infinity, invalid: `${sorted[i - 1].exam.name} and ${sorted[i].exam.name} are only ${Math.round(gap)} days apart` };
  }
  for (let i = 0; i < sorted.length; i++) {
    let inWeek = 1;
    for (let j = i + 1; j < sorted.length; j++) {
      const gap = (+new Date(sorted[j].date) - +new Date(sorted[i].date)) / DAY_MS;
      if (gap <= 7) inWeek++;
    }
    if (inWeek > prefs.maxExamsPerWeek) return { picks: sorted, score: -Infinity, invalid: "Too many exams in one week" };
  }
  let prepDeficit = 0;
  for (const p of sorted) {
    const need = neededPrepDays(p.exam);
    const have = daysUntil(p.date);
    if (have < need) {
      const deficit = need - have;
      prepDeficit += deficit;
      if (prefs.risk === "Safe" && deficit > 3)
        return { picks: sorted, score: -Infinity, invalid: `${p.exam.name} needs ~${need} days of prep, only ${have} available` };
    }
  }
  let score = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = (+new Date(sorted[i].date) - +new Date(sorted[i - 1].date)) / DAY_MS;
    score += Math.min(gap, 21) * 0.5;
  }
  const meanDays = sorted.reduce((s, p) => s + daysUntil(p.date), 0) / Math.max(sorted.length, 1);
  const periodTarget = prefs.period === "Earlier" ? 18 : prefs.period === "Later" ? 50 : 32;
  score -= Math.abs(meanDays - periodTarget) * 0.4;
  score += sorted.reduce((s, p) => s + examWeight(p.exam) * 5, 0);
  score -= prepDeficit * 2;
  return { picks: sorted, score };
}

function pickReason(exam: Exam, chosenDate: string, otherPicks: { exam: Exam; date: string }[], prefs: Preferences): string {
  const reasons: string[] = [];
  const need = neededPrepDays(exam);
  const have = daysUntil(chosenDate);
  if (have >= need) reasons.push(`gives ~${have} days of prep (needs ~${need})`);
  if (exam.priority === "High") reasons.push("high priority");
  if (exam.difficulty === "Hard") reasons.push("hard course needs spacing");
  if (exam.status === "Halfway" || exam.status === "Almost ready") reasons.push(`preparation is ${exam.status.toLowerCase()}`);
  const closest = otherPicks.filter((p) => p.exam.id !== exam.id).map((p) => Math.abs(daysUntil(p.date) - have)).sort((a, b) => a - b)[0];
  if (closest !== undefined && closest >= prefs.minDaysBetweenExams + 2) reasons.push(`comfortable ${closest}-day gap from nearest exam`);
  return reasons.join(", ") || "fits all constraints";
}

export function selectExamPlan(exams: Exam[], prefs: Preferences): ExamPlan {
  if (exams.length === 0) return { selected: [], rejected: [], skipped: [], health: "Good", healthReason: "No exams added yet." };
  const ranked = rankExamsForSelection(exams, prefs);
  const target = Math.min(prefs.examsToTake, exams.length);
  const candidates = ranked.slice(0, target);
  const skipped = ranked.slice(target).map((e) => ({ examName: e.name, reason: `Beyond your target of ${prefs.examsToTake} exams this session` }));
  function combos(idx: number, current: { exam: Exam; date: string }[]): Combo[] {
    if (idx === candidates.length) return [evalCombo(current, prefs)];
    const out: Combo[] = [];
    for (const d of candidates[idx].options) out.push(...combos(idx + 1, [...current, { exam: candidates[idx], date: d }]));
    return out;
  }
  const all = combos(0, []);
  const valid = all.filter((c) => c.score > -Infinity);
  let best: Combo | undefined = valid.sort((a, b) => b.score - a.score)[0];
  let health: ExamPlan["health"] = "Good";
  let healthReason = "All constraints satisfied with comfortable spacing.";
  if (!best) {
    const relaxed = [...all].sort((a, b) => b.score - a.score)[0];
    best = relaxed;
    health = "Critical";
    healthReason = relaxed?.invalid ?? "No valid combination found — relax your constraints (min days, period).";
  } else {
    const gaps = best.picks.map((_, i, arr) => i === 0 ? Infinity : (+new Date(arr[i].date) - +new Date(arr[i - 1].date)) / DAY_MS).filter((x) => x !== Infinity);
    const minGap = gaps.length ? Math.min(...gaps) : Infinity;
    if (isFinite(minGap) && minGap <= prefs.minDaysBetweenExams + 2) {
      health = "Tight"; healthReason = `Minimum spacing is ${Math.round(minGap)} days — tight but workable.`;
    }
  }
  const selected: SelectedExam[] = (best?.picks ?? []).map((p) => ({
    examId: p.exam.id, examName: p.exam.name, chosenDate: p.date,
    reason: pickReason(p.exam, p.date, best!.picks, prefs),
  }));
  const rejected: RejectedOption[] = [];
  for (const p of best?.picks ?? []) {
    for (const d of p.exam.options) {
      if (d === p.date) continue;
      rejected.push({ examName: p.exam.name, date: d, reason: rejectionReason(p.exam, d, best!.picks, prefs) });
    }
  }
  return { selected, rejected, skipped, health, healthReason };
}

function rejectionReason(exam: Exam, date: string, picks: { exam: Exam; date: string }[], prefs: Preferences): string {
  const have = daysUntil(date);
  const need = neededPrepDays(exam);
  if (have < need) return `Too soon — only ${have} days of prep (needs ~${need})`;
  const conflict = picks.find((p) => p.exam.id !== exam.id && Math.abs(daysUntil(p.date) - have) < prefs.minDaysBetweenExams);
  if (conflict) return `Too close to ${conflict.exam.name} (< ${prefs.minDaysBetweenExams} days)`;
  return "Lower overall score than the chosen date";
}

// ===================== AUTO HOUR ESTIMATION =====================

export function estimateHoursAuto(item: BacklogItem, exam: Exam): number {
  let base = 2;
  if (item.kind === "Theory") {
    base = item.difficulty === "Hard" ? 4 : item.difficulty === "Medium" ? 2 : 1.5;
    if (item.progress === "Not started") base *= 1.2;
    else if (item.progress === "Mastered") base *= 0.3;
    else if (item.progress === "First revision done") base *= 0.5;
    if (item.materialStatus === "Notes to clean" || item.materialStatus === "Slides to review") base += 0.5;
    if (item.materialStatus === "Missing material") base += 1;
  } else if (item.kind === "Exercise") {
    base = item.difficulty === "Hard" ? 4 : item.difficulty === "Medium" ? 2.5 : 1.5;
    if (item.progress === "Not started") base *= 1.2;
    else if (item.progress === "Confident") base *= 0.3;
    else if (item.progress === "Repeated once") base *= 0.6;
  } else {
    base = item.priority === "High" ? 6 : item.priority === "Medium" ? 4 : 2;
    if (item.status === "Completed") return 0;
    if (item.status === "In progress") base *= 0.6;
    if (item.status === "Review needed") base *= 0.4;
  }
  if (exam.difficulty === "Hard" && exam.priority === "High") base *= 1.1;
  return Math.max(0.5, Math.round(base * 2) / 2);
}

export function effectiveHours(item: BacklogItem, exam: Exam): number {
  return item.autoEstimate ? estimateHoursAuto(item, exam) : Math.max(0.5, item.estimatedHours);
}

// ===================== BACKLOG-DRIVEN TASKS =====================

interface TaskUnit {
  examId: string;
  examName: string;
  taskId: string;
  taskTitle: string;
  kind: BlockKind;
  method: string;
  durationMin: number;
  // urgency inputs
  urgency: number; // higher = sooner
  hardDeadline?: string; // ISO, must be placed before this
  reason: string;
  // sequencing: prep blocks must come before their parent study blocks
  groupKey?: string; // items sharing key must be placed in order
  seq?: number; // order within group
  // spacing hint: avoid same-day repetition
  preferSpaced?: boolean;
}

const THEORY_PROG_W: Record<TheoryTopic["progress"], number> = {
  "Not started": 1, "Material prepared": 0.8, "Studying": 0.6, "First revision done": 0.35, "Mastered": 0.1,
};
const EX_PROG_W: Record<ExerciseCategory["progress"], number> = {
  "Not started": 1, "Some attempted": 0.7, "Needs correction": 0.6, "Repeated once": 0.4, "Confident": 0.15,
};
const DEL_STATUS_W: Record<Deliverable["status"], number> = {
  "Not started": 1, "In progress": 0.6, "Review needed": 0.3, "Completed": 0,
};

function autoMethod(item: BacklogItem, exam: Exam, prefs: Preferences): string {
  if (item.preferredMethod !== "Auto") return item.preferredMethod;
  if (item.kind === "Theory") {
    if (exam.examType === "Oral" || exam.examType === "Written + Oral")
      return prefs.studyMethods.includes("Feynman Technique") ? "Feynman Technique" : "Oral rehearsal";
    return prefs.studyMethods.includes("Mind maps") ? "Mind maps" : "Feynman Technique";
  }
  if (item.kind === "Exercise") {
    if (exam.examType.includes("Written"))
      return prefs.studyMethods.includes("Past exam simulations") ? "Past exam simulations" : "Exercise repetition";
    return "Exercise repetition";
  }
  return "Implementation block";
}

function buildTaskUnits(selected: { exam: Exam; date: string }[], prefs: Preferences): { units: TaskUnit[]; warnings: string[] } {
  const units: TaskUnit[] = [];
  const warnings: string[] = [];
  const blockMin = prefs.blockDuration;
  const intensityMul = prefs.revisionFrequency === "Intensive" ? 1.25 : prefs.revisionFrequency === "Light" ? 0.75 : 1;
  const goalMul = (g: Exam["goal"]) => GOAL_W[g];

  for (const { exam, date } of selected) {
    const daysToExam = Math.max(daysUntil(date), 1);

    // Order backlog by global studyMode
    const order: ("Theory" | "Exercise" | "Project")[] =
      prefs.studyMode === "Theory-first" ? ["Theory", "Exercise", "Project"] :
      prefs.studyMode === "Exercises-first" ? ["Exercise", "Theory", "Project"] :
      ["Theory", "Exercise", "Project"];

    for (const kind of order) {
      const list: BacklogItem[] =
        kind === "Theory" ? exam.theory :
        kind === "Exercise" ? exam.exercises : exam.deliverables;

      for (const item of list) {
        // Compute remaining work
        const progressW =
          item.kind === "Theory" ? THEORY_PROG_W[item.progress] :
          item.kind === "Exercise" ? EX_PROG_W[item.progress] :
          DEL_STATUS_W[item.status];
        if (progressW <= 0) continue;
        const baseHours = effectiveHours(item, exam);
        const targetMin = Math.max(blockMin, Math.round(baseHours * 60 * progressW * goalMul(exam.goal) * intensityMul));
        const groupKey = `${exam.id}-${item.id}`;

        // ---- THEORY ----
        if (item.kind === "Theory") {
          // Material readiness → prep blocks first
          if (item.materialStatus === "Missing material") {
            warnings.push(`${exam.name} · ${item.title}: material missing — add notes or slides before scheduling deep study.`);
            // still schedule a single prep block to gather material
            units.push({
              examId: exam.id, examName: exam.name, taskId: `prep-${item.id}`,
              taskTitle: `Gather material for ${item.title}`,
              kind: "Prep", method: "Pomodoro blocks", durationMin: blockMin,
              urgency: 10 + DIFF_W[item.difficulty],
              reason: "Material missing — scheduled material-gathering before deep study.",
              groupKey, seq: 0,
            });
          } else if (item.materialStatus === "Notes to clean" || item.materialStatus === "Slides to review") {
            const prepTitle = item.materialStatus === "Notes to clean"
              ? `Clean notes for ${item.title}`
              : `Review slides and extract key concepts for ${item.title}`;
            units.push({
              examId: exam.id, examName: exam.name, taskId: `prep-${item.id}`,
              taskTitle: prepTitle,
              kind: "Prep", method: "Pomodoro blocks", durationMin: blockMin,
              urgency: 8 + DIFF_W[item.difficulty],
              reason: `Material preparation added because ${item.materialStatus.toLowerCase()}.`,
              groupKey, seq: 0,
            });
          }
          // Main study chunks
          const chunks = Math.max(1, Math.ceil(targetMin / blockMin));
          const method = autoMethod(item, exam, prefs);
          for (let i = 0; i < chunks; i++) {
            units.push({
              examId: exam.id, examName: exam.name, taskId: `${item.id}-s${i}`,
              taskTitle: `${item.title} theory — ${method}`,
              kind: "Theory", method, durationMin: blockMin,
              urgency: DIFF_W[item.difficulty] * (item.progress === "Not started" ? 1.6 : 1) + (item.preferredMethod === "Auto" ? 0 : 0.1),
              reason: theoryReason(item, exam),
              groupKey, seq: 1 + i,
              preferSpaced: true,
            });
          }
          // Spaced repetition short reviews (only if intensity allows and topic non-trivial)
          if (prefs.revisionFrequency !== "Light" && (item.difficulty !== "Easy")) {
            const reviews = prefs.revisionFrequency === "Intensive" ? 3 : 2;
            for (let i = 0; i < reviews; i++) {
              units.push({
                examId: exam.id, examName: exam.name, taskId: `${item.id}-r${i}`,
                taskTitle: `${item.title} — spaced review`,
                kind: "Review", method: "Spaced repetition", durationMin: Math.max(45, Math.round(blockMin * 0.5)),
                urgency: 0.6,
                reason: "Spaced repetition block added to maintain memory before the exam.",
                groupKey: `${groupKey}-rev`, seq: i,
                preferSpaced: true,
              });
            }
          }
        }

        // ---- EXERCISE ----
        if (item.kind === "Exercise") {
          const method = autoMethod(item, exam, prefs);
          const chunks = Math.max(2, Math.ceil(targetMin / blockMin));
          for (let i = 0; i < chunks; i++) {
            units.push({
              examId: exam.id, examName: exam.name, taskId: `${item.id}-e${i}`,
              taskTitle: `${item.title} exercises — ${method}`,
              kind: "Exercise", method, durationMin: blockMin,
              urgency: DIFF_W[item.difficulty] * (item.progress === "Not started" ? 1.4 : 1),
              reason: exerciseReason(item, exam),
              groupKey, seq: i,
              preferSpaced: true, // repeat across days
            });
          }
        }

        // ---- PROJECT ----
        if (item.kind === "Project") {
          const method = autoMethod(item, exam, prefs);
          const chunks = Math.max(1, Math.ceil(targetMin / blockMin));
          const dl = item.deadline;
          for (let i = 0; i < chunks; i++) {
            units.push({
              examId: exam.id, examName: exam.name, taskId: `${item.id}-p${i}`,
              taskTitle: `${item.title} — ${method}`,
              kind: "Project", method, durationMin: blockMin,
              urgency: (PRIO_W[item.priority] + 1) * 2 / Math.max(daysUntil(dl), 1),
              hardDeadline: dl,
              reason: `Project work scheduled before the ${formatDate(dl)} deadline.`,
              groupKey, seq: i,
            });
          }
        }
      }

      void daysToExam;
    }
  }

  return { units, warnings };
}

function theoryReason(t: TheoryTopic, exam: Exam): string {
  if (t.progress === "Not started" && t.difficulty === "Hard")
    return "Scheduled early because this topic is hard and not started.";
  if (exam.examType === "Oral" || exam.examType === "Written + Oral")
    return "Feynman Technique selected because this is an oral exam.";
  if (t.progress === "First revision done")
    return "Light recall — first revision already done.";
  return "Core theory block from your backlog.";
}
function exerciseReason(x: ExerciseCategory, exam: Exam): string {
  if (x.source === "Past exam") return "Past exam practice added because this is a written exam.";
  if (x.progress === "Not started") return "First pass through this exercise category.";
  if (x.progress === "Needs correction") return "Error review — exercises previously needed correction.";
  return "Repeated across multiple days for retention.";
}

// ===================== SCHEDULE PLACEMENT =====================

interface FreeSlot {
  date: string;
  start: number; // minutes
  end: number;
}

interface BlockedInterval {
  day: Weekday;
  date?: string;
  start: number;
  end: number;
  type: "commitment" | "event" | "rest" | "unavailable" | "study";
  label: string;
}

interface FixedBlockedInterval {
  day: LongWeekday;
  date: string;
  start: number;
  end: number;
  type: "commitment" | "event" | "rest" | "unavailable";
  label: string;
}

interface MutableFreeSlot {
  date: string;
  day: LongWeekday;
  start: number;
  end: number;
}

const SIMPLE_DAY_START = 8 * 60;
const SIMPLE_DAY_END = 22 * 60;

function overlaps(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && end > otherStart;
}

function buildFixedBlockedForDate(date: string, commitments: Commitment[], events: UnexpectedEvent[], prefs: Preferences): FixedBlockedInterval[] {
  const day = longWeekdayOf(date);
  const shortDay = normalizeWeekday(day);
  const blocked: FixedBlockedInterval[] = [];

  if (prefs.unavailableDays.map(normalizeLongWeekday).includes(day)) {
    blocked.push({ day, date, start: 0, end: 24 * 60, type: "unavailable", label: `${day} unavailable` });
  }
  for (const c of commitments) {
    if (normalizeLongWeekday(c.day) === day) {
      blocked.push({ day, date, start: toMin(c.start), end: toMin(c.end), type: "commitment", label: c.name });
    }
  }
  for (const r of prefs.restSlots ?? []) {
    if (restSlotAppliesTo(r, shortDay)) {
      blocked.push({ day, date, start: toMin(r.start), end: toMin(r.end), type: "rest", label: r.name });
    }
  }
  for (const e of events) {
    if (e.date === date) blocked.push({ day, date, start: toMin(e.start), end: toMin(e.end), type: "event", label: e.name });
  }

  return blocked.filter((block) => block.end > block.start).sort((a, b) => a.start - b.start);
}

/**
 * Sort by start ascending, then merge overlapping OR touching intervals
 * into a minimal set of disjoint [start, end] ranges.
 */
function mergeFixedIntervals(blocked: FixedBlockedInterval[]): [number, number][] {
  const sorted = blocked
    .map((b) => [b.start, b.end] as [number, number])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of sorted) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }
  return merged;
}

function freeSlotsFromMerged(date: string, merged: [number, number][]): MutableFreeSlot[] {
  const day = longWeekdayOf(date);
  const slots: MutableFreeSlot[] = [];
  let cursor = SIMPLE_DAY_START;
  for (const [bs, be] of merged) {
    const start = Math.max(SIMPLE_DAY_START, bs);
    const end = Math.min(SIMPLE_DAY_END, be);
    if (end <= SIMPLE_DAY_START || start >= SIMPLE_DAY_END) continue;
    if (start > cursor) slots.push({ date, day, start: cursor, end: start });
    cursor = Math.max(cursor, end);
    if (cursor >= SIMPLE_DAY_END) break;
  }
  if (cursor < SIMPLE_DAY_END) slots.push({ date, day, start: cursor, end: SIMPLE_DAY_END });
  return slots.filter((slot) => slot.end - slot.start >= 45);
}

function makeScheduleDates(daysAhead: number): string[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: daysAhead }, (_, off) => {
    const d = new Date(start);
    d.setDate(d.getDate() + off);
    return toYMD(d);
  });
}

function buildScheduleSpace(dates: string[], commitments: Commitment[], events: UnexpectedEvent[], prefs: Preferences) {
  const blockedByDay = LONG_WEEKDAYS.reduce((acc, day) => ({ ...acc, [day]: [] as FixedBlockedInterval[] }), {} as Record<LongWeekday, FixedBlockedInterval[]>);
  const blockedByDate = new Map<string, FixedBlockedInterval[]>();
  const mergedByDate = new Map<string, [number, number][]>();
  const freeSlots: MutableFreeSlot[] = [];

  for (const date of dates) {
    const blocked = buildFixedBlockedForDate(date, commitments, events, prefs);
    blockedByDate.set(date, blocked);
    const merged = mergeFixedIntervals(blocked);
    mergedByDate.set(date, merged);
    for (const block of blocked) blockedByDay[block.day].push(block);
    freeSlots.push(...freeSlotsFromMerged(date, merged));
  }

  freeSlots.sort((a, b) => (a.date + toTime(a.start)).localeCompare(b.date + toTime(b.start)));
  return { blockedByDay, blockedByDate, mergedByDate, freeSlots };
}

function consumeFreeSlot(slots: MutableFreeSlot[], slotIndex: number, start: number, end: number, breakAfter: number): void {
  const slot = slots[slotIndex];
  const replacements: MutableFreeSlot[] = [];
  if (slot.start < start) replacements.push({ ...slot, end: start });
  const nextStart = Math.min(slot.end, end + breakAfter);
  if (nextStart < slot.end) replacements.push({ ...slot, start: nextStart });
  slots.splice(slotIndex, 1, ...replacements.filter((s) => s.end - s.start >= 45));
}

function consumeExistingBlocks(existing: StudyBlock[], slots: MutableFreeSlot[], warnings: string[]): StudyBlock[] {
  const kept: StudyBlock[] = [];
  for (const block of [...existing].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))) {
    const start = toMin(block.start);
    const end = toMin(block.end);
    const slotIndex = slots.findIndex((slot) => slot.date === block.date && slot.start <= start && slot.end >= end);
    if (slotIndex === -1) {
      warnings.push("One study task was removed because it conflicted with a fixed commitment.");
      continue;
    }
    consumeFreeSlot(slots, slotIndex, start, end, 0);
    kept.push(block);
  }
  return kept;
}

function validateSimpleSchedule(
  blocks: StudyBlock[],
  fixedByDate: Map<string, FixedBlockedInterval[]>,
  mergedByDate: Map<string, [number, number][]>,
  warnings: string[],
): StudyBlock[] {
  const valid: StudyBlock[] = [];
  let removed = 0;
  for (const block of [...blocks].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))) {
    const start = toMin(block.start);
    const end = toMin(block.end);
    const merged = mergedByDate.get(block.date) ?? mergeFixedIntervals(fixedByDate.get(block.date) ?? []);
    const fixedConflict = merged.some(([bs, be]) => overlaps(start, end, bs, be));
    const studyConflict = valid.some((other) => other.date === block.date && overlaps(start, end, toMin(other.start), toMin(other.end)));
    if (fixedConflict || studyConflict) {
      removed += 1;
      continue;
    }
    valid.push(block);
  }
  if (removed > 0) warnings.push("One study task was removed because it conflicted with a fixed commitment.");
  return valid;
}

export function getScheduleDiagnostics(input: {
  dates: string[];
  schedule: StudyBlock[];
  commitments: Commitment[];
  events: UnexpectedEvent[];
  prefs: Preferences;
}): { blockedIntervals: number; freeSlots: number; studyBlocks: number; conflicts: number; conflictBlockIds: string[] } {
  const { blockedByDate, freeSlots } = buildScheduleSpace(input.dates, input.commitments, input.events, input.prefs);
  const conflictBlockIds = new Set<string>();
  const blocks = input.schedule.filter((block) => input.dates.includes(block.date));

  for (const block of blocks) {
    const start = toMin(block.start);
    const end = toMin(block.end);
    if ((blockedByDate.get(block.date) ?? []).some((fixed) => overlaps(start, end, fixed.start, fixed.end))) {
      conflictBlockIds.add(block.id);
    }
  }
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocks[i].date !== blocks[j].date) continue;
      if (overlaps(toMin(blocks[i].start), toMin(blocks[i].end), toMin(blocks[j].start), toMin(blocks[j].end))) {
        conflictBlockIds.add(blocks[i].id);
        conflictBlockIds.add(blocks[j].id);
      }
    }
  }

  return {
    blockedIntervals: [...blockedByDate.values()].reduce((sum, list) => sum + list.length, 0),
    freeSlots: freeSlots.length,
    studyBlocks: blocks.length - conflictBlockIds.size,
    conflicts: conflictBlockIds.size,
    conflictBlockIds: [...conflictBlockIds],
  };
}

export function getSchedulingDebugReport(input: {
  dates: string[];
  schedule: StudyBlock[];
  commitments: Commitment[];
  events: UnexpectedEvent[];
  prefs: Preferences;
}) {
  const { blockedByDate, mergedByDate, freeSlots } = buildScheduleSpace(input.dates, input.commitments, input.events, input.prefs);
  const blockedIntervals = [...blockedByDate.values()].flat().map((block) => ({
    title: block.label,
    day: block.day,
    date: block.date,
    startMinutes: block.start,
    endMinutes: block.end,
    type: block.type,
  }));
  const mergedBlockedIntervals = input.dates.flatMap((date) =>
    (mergedByDate.get(date) ?? []).map(([s, e]) => ({
      day: longWeekdayOf(date),
      date,
      startMinutes: s,
      endMinutes: e,
    })),
  );
  const freeSlotList = freeSlots.map((slot) => ({
    day: slot.day,
    date: slot.date,
    startMinutes: slot.start,
    endMinutes: slot.end,
  }));
  const generatedBlocks = input.schedule
    .filter((block) => input.dates.includes(block.date))
    .map((block) => ({
      id: block.id,
      taskTitle: block.taskTitle,
      course: block.examName,
      day: longWeekdayOf(block.date),
      date: block.date,
      startMinutes: toMin(block.start),
      endMinutes: toMin(block.end),
    }));
  const conflicts = generatedBlocks.flatMap((study) =>
    (mergedByDate.get(study.date) ?? [])
      .filter(([bs, be]) => study.startMinutes < be && study.endMinutes > bs)
      .map(([bs, be]) => ({
        studyBlockName: study.taskTitle,
        blockedTitle: "merged blocked interval",
        day: study.day,
        studyTime: `${study.startMinutes}-${study.endMinutes}`,
        blockedTime: `${bs}-${be}`,
      })),
  );

  return { blockedIntervals, mergedBlockedIntervals, freeSlots: freeSlotList, generatedBlocks, conflicts };
}

// Hours allowed per preferred-time setting. The first range is the primary
// window; secondary ranges still get used when the primary fills up.
// Evening cap is 22:00, with light/soft tasks allowed after 20:00 (see LATE_START).
const PREF_RANGES: Record<Preferences["preferredStudyTime"], [number, number][]> = {
  Morning: [[8 * 60, 13 * 60], [14 * 60, 19 * 60], [20 * 60, 22 * 60]],
  Afternoon: [[13 * 60, 19 * 60], [9 * 60, 13 * 60], [20 * 60, 22 * 60]],
  Evening: [[16 * 60, 22 * 60], [9 * 60, 16 * 60]],
  Flexible: [[9 * 60, 13 * 60], [14 * 60, 19 * 60], [20 * 60, 22 * 60]],
};

/** Block start at or after this minute counts as "after dinner". */
const LATE_START = 20 * 60;

/** Methods/kinds that are light enough for after-dinner placement. */
const SOFT_METHODS = new Set<string>([
  "Flashcards",
  "Spaced repetition",
  "Mind maps",
  "Oral rehearsal",
  "Formula flashcards",
  "Error review",
]);

function isSoftUnit(kind: BlockKind, method: string): boolean {
  if (kind === "Review" || kind === "Prep") return true;
  if (kind === "Theory" && SOFT_METHODS.has(method)) return true;
  if (kind === "Exercise" && SOFT_METHODS.has(method)) return true;
  return false;
}

export function restSlotAppliesTo(rs: RestSlot, wd: Weekday): boolean {
  const day = normalizeWeekday(wd);
  if (rs.days === "every") return true;
  if (rs.days === "weekdays") return day !== "Sat" && day !== "Sun";
  if (rs.days === "weekend") return day === "Sat" || day === "Sun";
  return (rs.customDays ?? []).map(normalizeWeekday).includes(day);
}

function buildBlockedIntervalsForDate(
  date: string,
  commitments: Commitment[],
  events: UnexpectedEvent[],
  prefs: Preferences,
  studyBlocks: StudyBlock[] = [],
): BlockedInterval[] {
  const day = weekdayOf(date);
  const blocked: BlockedInterval[] = [];
  if (prefs.unavailableDays.map(normalizeWeekday).includes(day)) {
    blocked.push({ day, date, start: 0, end: 24 * 60, type: "unavailable", label: `${day} unavailable` });
  }
  for (const c of commitments) {
    if (normalizeWeekday(c.day) === day) blocked.push({ day, date, start: toMin(c.start), end: toMin(c.end), type: "commitment", label: c.name });
  }
  for (const r of prefs.restSlots ?? []) {
    if (restSlotAppliesTo(r, day)) blocked.push({ day, date, start: toMin(r.start), end: toMin(r.end), type: "rest", label: r.name });
  }
  for (const e of events) {
    if (e.date === date) blocked.push({ day, date, start: toMin(e.start), end: toMin(e.end), type: "event", label: e.name });
  }
  for (const b of studyBlocks) {
    if (b.date === date) blocked.push({ day, date, start: toMin(b.start), end: toMin(b.end), type: "study", label: b.taskTitle });
  }
  return blocked.filter((block) => block.end > block.start);
}

function hasConflict(day: Weekday, start: number, end: number, blockedIntervals: BlockedInterval[]): boolean {
  return blockedIntervals
    .filter((block) => block.day === day)
    .some((block) => start < block.end && end > block.start);
}

function firstConflict(day: Weekday, start: number, end: number, blockedIntervals: BlockedInterval[]): BlockedInterval | undefined {
  return blockedIntervals.find((block) => block.day === day && start < block.end && end > block.start);
}

function mergeIntervals(arr: [number, number][]): [number, number][] {
  if (arr.length === 0) return [];
  const sorted = [...arr].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const [s, e] = sorted[i];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

/** Subtract merged busy intervals from a single [rs,re] range. */
function subtractFromRange(rs: number, re: number, busy: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  let cursor = rs;
  for (const [bs, be] of busy) {
    if (be <= cursor) continue;
    if (bs >= re) break;
    if (bs > cursor) out.push([cursor, Math.min(bs, re)]);
    cursor = Math.max(cursor, be);
    if (cursor >= re) break;
  }
  if (cursor < re) out.push([cursor, re]);
  return out;
}

function computeFreeSlots(
  date: string,
  commitments: Commitment[],
  events: UnexpectedEvent[],
  prefs: Preferences,
  studyBlocks: StudyBlock[] = [],
): FreeSlot[] {
  const blockedIntervals = buildBlockedIntervalsForDate(date, commitments, events, prefs, studyBlocks);
  if (blockedIntervals.some((block) => block.type === "unavailable")) return [];
  const busy = mergeIntervals(blockedIntervals.map((block) => [block.start, block.end] as [number, number]));

  const slots: FreeSlot[] = [];
  for (const [rs, re] of PREF_RANGES[prefs.preferredStudyTime]) {
    for (const [s, e] of subtractFromRange(rs, re, busy)) {
      slots.push({ date, start: s, end: e });
    }
  }
  return slots.filter((s) => s.end - s.start >= 45);
}

function priorityFor(daysLeft: number, urgency: number, kind: BlockKind): "Low" | "Medium" | "High" | "Critical" {
  if (daysLeft <= 3) return "Critical";
  if (kind === "Prep" || daysLeft <= 7) return "High";
  if (urgency >= 1.2) return "High";
  if (urgency >= 0.8) return "Medium";
  return "Low";
}

function findAvailableSlot(
  durationMinutes: number,
  startDate: string,
  blockedStudyBlocks: StudyBlock[],
  commitments: Commitment[],
  events: UnexpectedEvent[],
  prefs: Preferences,
  daysAhead: number,
  allowLateForHard: boolean,
  soft: boolean,
): FreeSlot | null {
  const searchStart = parseLocalDate(startDate);
  for (let off = 0; off < daysAhead; off++) {
    const d = new Date(searchStart);
    d.setDate(d.getDate() + off);
    const date = toYMD(d);
    const day = weekdayOf(date);
    const slots = computeFreeSlots(date, commitments, events, prefs, blockedStudyBlocks);
    for (const slot of slots) {
      if (slot.end - slot.start < durationMinutes) continue;
      const blockedIntervals = buildBlockedIntervalsForDate(date, commitments, events, prefs, blockedStudyBlocks);
      for (let start = slot.start; start + durationMinutes <= slot.end; start += 15) {
        const end = start + durationMinutes;
        if (!soft && !allowLateForHard && start >= LATE_START) continue;
        if (!hasConflict(day, start, end, blockedIntervals)) return { date, start, end };
      }
    }
  }
  return null;
}

function validateAndRepairSchedule(
  blocks: StudyBlock[],
  commitments: Commitment[],
  events: UnexpectedEvent[],
  prefs: Preferences,
  warnings: string[],
  daysAhead: number,
): StudyBlock[] {
  const repaired: StudyBlock[] = [];
  for (const block of [...blocks].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))) {
    const day = weekdayOf(block.date);
    const start = toMin(block.start);
    const end = toMin(block.end);
    const duration = end - start;
    const fixedConflict = firstConflict(day, start, end, buildBlockedIntervalsForDate(block.date, commitments, events, prefs));
    const studyConflict = firstConflict(day, start, end, buildBlockedIntervalsForDate(block.date, [], [], { ...prefs, unavailableDays: [], restSlots: [] }, repaired));
    if (!fixedConflict && !studyConflict) {
      repaired.push(block);
      continue;
    }

    const conflict = fixedConflict ?? studyConflict;
    warnings.push(`Conflict detected: “${block.taskTitle}” overlaps with ${conflict?.label ?? "another study block"}.`);
    const slot = findAvailableSlot(duration, block.date, repaired, commitments, events, prefs, daysAhead, false, Boolean(block.soft))
      ?? findAvailableSlot(duration, block.date, repaired, commitments, events, prefs, daysAhead, true, Boolean(block.soft));
    if (!slot) {
      warnings.push("Some tasks could not be scheduled because your week is full.");
      continue;
    }
    repaired.push({
      ...block,
      date: slot.date,
      start: toTime(slot.start),
      end: toTime(slot.end),
      moved: true,
      originalDate: block.originalDate ?? block.date,
      originalStart: block.originalStart ?? block.start,
    });
  }
  return repaired;
}

export interface GenerationInput {
  exams: Exam[];
  plan: ExamPlan;
  commitments: Commitment[];
  prefs: Preferences;
  events: UnexpectedEvent[];
  daysAhead?: number;
  existing?: StudyBlock[]; // when present, do an incremental insert keeping these
}

export function generateStudySchedule(input: GenerationInput): {
  blocks: StudyBlock[];
  warnings: string[];
} {
  const { plan, commitments, prefs, events, exams } = input;
  const daysAhead = input.daysAhead ?? 28;

  const selectedExams = plan.selected
    .map((s) => ({ exam: exams.find((e) => e.id === s.examId)!, date: s.chosenDate }))
    .filter((x) => x.exam);
  if (selectedExams.length === 0) return { blocks: [], warnings: [] };

  const { units, warnings } = buildTaskUnits(selectedExams, prefs);

  // Determine per-exam latest study date (apply buffer)
  const examLatest = new Map<string, string>();
  for (const s of selectedExams) {
    const d = parseLocalDate(s.date);
    d.setDate(d.getDate() - 1 - prefs.bufferDays);
    examLatest.set(s.exam.id, toYMD(d));
  }

  const dates = makeScheduleDates(daysAhead);
  const { blockedByDay, blockedByDate, mergedByDate, freeSlots } = buildScheduleSpace(dates, commitments, events, prefs);
  const blockedCount = LONG_WEEKDAYS.reduce((sum, day) => sum + blockedByDay[day].length, 0);
  void blockedCount;

  const existing = input.existing ?? [];
  const blocks: StudyBlock[] = consumeExistingBlocks(existing, freeSlots, warnings);
  const placedSeqByGroup = new Map<string, number>();
  const placedOnDayByGroup = new Map<string, Set<string>>();

  for (const block of blocks) {
    if (!placedOnDayByGroup.has(block.date)) placedOnDayByGroup.set(block.date, new Set());
    placedOnDayByGroup.get(block.date)!.add(`${block.examId}-${block.taskId}`);
  }

  const queue = [...units].sort((a, b) => {
    if ((a.kind === "Prep") !== (b.kind === "Prep")) return a.kind === "Prep" ? -1 : 1;
    if (b.urgency !== a.urgency) return b.urgency - a.urgency;
    return (a.seq ?? 0) - (b.seq ?? 0);
  });

  function tryPlace(unit: TaskUnit, allowLateForHard: boolean): boolean {
    const soft = isSoftUnit(unit.kind, unit.method);
    const latest = examLatest.get(unit.examId);
    for (let i = 0; i < freeSlots.length; i++) {
      const slot = freeSlots[i];
      if (latest && slot.date > latest) continue;
      if (unit.hardDeadline && slot.date > unit.hardDeadline) continue;
      if (unit.preferSpaced && unit.groupKey && placedOnDayByGroup.get(slot.date)?.has(unit.groupKey)) continue;
      if (!soft && !allowLateForHard && slot.start >= LATE_START) continue;
      if (slot.end - slot.start < unit.durationMin) continue;

      const blockStart = slot.start;
      const blockEnd = blockStart + unit.durationMin;
      const daysLeftToExam = daysUntil(plan.selected.find((s) => s.examId === unit.examId)?.chosenDate ?? slot.date);
      blocks.push({
        id: `b-${slot.date}-${unit.taskId}-${blockStart}`,
        date: slot.date,
        start: toTime(blockStart),
        end: toTime(blockEnd),
        examId: unit.examId,
        examName: unit.examName,
        taskId: unit.taskId,
        taskTitle: unit.taskTitle,
        kind: unit.kind,
        method: unit.method,
        priority: priorityFor(daysLeftToExam, unit.urgency, unit.kind),
        reason: unit.reason,
        soft,
      });
      consumeFreeSlot(freeSlots, i, blockStart, blockEnd, prefs.minBreakMinutes);
      if (unit.groupKey != null && unit.seq != null) placedSeqByGroup.set(unit.groupKey, Math.max(placedSeqByGroup.get(unit.groupKey) ?? -1, unit.seq));
      if (unit.groupKey) {
        if (!placedOnDayByGroup.has(slot.date)) placedOnDayByGroup.set(slot.date, new Set());
        placedOnDayByGroup.get(slot.date)!.add(unit.groupKey);
      }
      return true;
    }
    return false;
  }

  const lateFallback: TaskUnit[] = [];
  const waiting: TaskUnit[] = [];
  for (const unit of queue) {
    if (unit.groupKey != null && unit.seq != null && unit.seq > 0 && (placedSeqByGroup.get(unit.groupKey) ?? -1) < unit.seq - 1) {
      waiting.push(unit);
      continue;
    }
    if (!tryPlace(unit, false)) lateFallback.push(unit);
  }
  for (const unit of waiting) {
    if (unit.groupKey != null && unit.seq != null && unit.seq > 0 && (placedSeqByGroup.get(unit.groupKey) ?? -1) < unit.seq - 1) continue;
    if (!tryPlace(unit, false)) lateFallback.push(unit);
  }
  for (const unit of lateFallback) tryPlace(unit, true);

  const kept = validateSimpleSchedule(blocks, blockedByDate, mergedByDate, warnings);
  if (kept.length < units.length + existing.length) warnings.push("Some tasks could not be scheduled because there are not enough free slots.");
  kept.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  return { blocks: kept, warnings };
}

// ===================== RESCHEDULE =====================

export function rescheduleAroundEvent(
  blocks: StudyBlock[],
  event: UnexpectedEvent,
  commitments: Commitment[],
  events: UnexpectedEvent[],
  prefs: Preferences,
): { blocks: StudyBlock[]; movedNotes: string[] } {
  const evStart = toMin(event.start);
  const evEnd = toMin(event.end);
  const movedNotes: string[] = [];

  const result: StudyBlock[] = [];
  const conflicted: StudyBlock[] = [];
  for (const b of blocks) {
    const bs = toMin(b.start);
    const be = toMin(b.end);
    if (b.date === event.date && bs < evEnd && be > evStart) conflicted.push(b);
    else result.push(b);
  }

  for (const b of conflicted) {
    const dur = toMin(b.end) - toMin(b.start);
    const startDate = parseLocalDate(b.date);
    let placed = false;
    for (let off = 1; off <= 10 && !placed; off++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + off);
      const date = toYMD(d);
      const slots = computeFreeSlots(
        date,
        commitments,
        events,
        prefs,
        result,
      );
      for (const slot of slots) {
        if (slot.end - slot.start >= dur) {
          const newStart = toTime(slot.start);
          const newEnd = toTime(slot.start + dur);
          result.push({ ...b, date, start: newStart, end: newEnd, moved: true, originalDate: b.date, originalStart: b.start });
          movedNotes.push(`${b.taskTitle} moved from ${formatDate(b.date)} ${b.start} → ${formatDate(date)} ${newStart} (${event.name} blocks the original slot).`);
          placed = true;
          break;
        }
      }
    }
    if (!placed) movedNotes.push(`${b.taskTitle} on ${formatDate(b.date)} ${b.start} could not be rescheduled — no free slot found in the next 10 days.`);
  }
  return { blocks: result.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)), movedNotes };
}

// Naive natural language parser (mock, deterministic patterns)
export function parseNaturalEvent(text: string): UnexpectedEvent | null {
  if (!text.trim()) return null;
  const lower = text.toLowerCase();
  const dayMap: Record<string, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
  let date = todayYMD();
  for (const [name, idx] of Object.entries(dayMap)) {
    if (lower.includes(name)) {
      const now = new Date();
      const today = now.getDay();
      let diff = (idx - today + 7) % 7;
      if (diff === 0) diff = 7;
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + diff);
      date = toYMD(d);
      break;
    }
  }
  if (lower.includes("tomorrow")) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    date = toYMD(d);
  }
  const m24 = lower.match(/(\d{1,2}):?(\d{2})?\s*(?:to|-|–|until)\s*(\d{1,2}):?(\d{2})?/);
  let start = "15:00"; let end = "17:00";
  if (m24) {
    const sh = String(Math.min(23, parseInt(m24[1]))).padStart(2, "0");
    const sm = (m24[2] ?? "00").padStart(2, "0");
    const eh = String(Math.min(23, parseInt(m24[3]))).padStart(2, "0");
    const em = (m24[4] ?? "00").padStart(2, "0");
    start = `${sh}:${sm}`; end = `${eh}:${em}`;
  }
  const keywords = ["dentist", "doctor", "appointment", "meeting", "interview", "trip", "wedding", "family", "visit"];
  let name = "Unexpected event";
  for (const k of keywords) if (lower.includes(k)) { name = k.charAt(0).toUpperCase() + k.slice(1); break; }
  if (name === "Unexpected event") {
    const first = text.trim().split(/[.,\n]/)[0];
    if (first.length > 0 && first.length < 60) name = first.charAt(0).toUpperCase() + first.slice(1);
  }
  return { id: `ne-${Date.now()}`, name, date, start, end, importance: "Medium" };
}

// Helpers for UI
export function methodForBacklogItem(item: BacklogItem, exam: Exam, prefs: Preferences): string {
  return autoMethod(item, exam, prefs);
}

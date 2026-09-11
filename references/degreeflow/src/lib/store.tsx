import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./auth";

import type {
  Attachment,
  BacklogItem,
  Commitment,
  Deliverable,
  Exam,
  ExamPlan,
  ExerciseCategory,
  Preferences,
  StudyBlock,
  TheoryTopic,
  UnexpectedEvent,
} from "./types";
import { DEFAULT_COMMITMENTS, DEFAULT_EXAMS, DEFAULT_PREFERENCES } from "./mock-data";
import {
  generateStudySchedule,
  rescheduleAroundEvent,
  selectExamPlan,
  weekdayOf,
} from "./scheduler";

interface State {
  commitments: Commitment[];
  exams: Exam[];
  prefs: Preferences;
  plan: ExamPlan | null;
  schedule: StudyBlock[];
  warnings: string[];
  events: UnexpectedEvent[];
  generatedAt: string | null;
  pendingChanges: number;
  completedBlocks: string[];
}

interface Ctx extends State {
  addCommitment: (c: Commitment) => void;
  updateCommitment: (id: string, patch: Partial<Commitment>) => void;
  removeCommitment: (id: string) => void;

  addExam: (e: Exam) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  removeExam: (id: string) => void;

  setPrefs: (p: Partial<Preferences>) => void;

  addTheory: (examId: string, t: TheoryTopic) => void;
  updateTheory: (examId: string, id: string, patch: Partial<TheoryTopic>) => void;
  removeTheory: (examId: string, id: string) => void;
  addExercise: (examId: string, e: ExerciseCategory) => void;
  updateExercise: (examId: string, id: string, patch: Partial<ExerciseCategory>) => void;
  removeExercise: (examId: string, id: string) => void;
  addDeliverable: (examId: string, d: Deliverable) => void;
  updateDeliverable: (examId: string, id: string, patch: Partial<Deliverable>) => void;
  removeDeliverable: (examId: string, id: string) => void;
  addAttachment: (examId: string, a: Attachment) => void;
  removeAttachment: (examId: string, id: string) => void;

  generatePlan: () => void;
  recalculateSchedule: () => void;
  addEvent: (e: UnexpectedEvent) => { movedNotes: string[] };
  removeEvent: (id: string) => void;
  regenerateFromScratch: () => void;
  resetDemo: () => void;

  toggleBlockComplete: (id: string) => void;
  moveBlock: (id: string, newDate: string, newStart: string) => { ok: boolean; reason?: string };
}

const KEY = "degreeflow.v11";
const StoreContext = createContext<Ctx | null>(null);

const initial: State = {
  commitments: DEFAULT_COMMITMENTS,
  exams: DEFAULT_EXAMS,
  prefs: DEFAULT_PREFERENCES,
  plan: null,
  schedule: [],
  warnings: [],
  events: [],
  generatedAt: null,
  pendingChanges: 0,
  completedBlocks: [],
};

function load(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from DB when signed in, otherwise from localStorage.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const hydrate = async () => {
      setHydrated(false);
      if (user) {
        currentUserIdRef.current = user.id;
        const { data, error } = await supabase
          .from("user_app_state")
          .select("state")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.error("[store] load error", error);
          toast.error("Couldn't load your saved plan. Working from defaults.");
          setState(initial);
        } else if (data && data.state && Object.keys(data.state as object).length > 0) {
          setState({ ...initial, ...(data.state as Partial<State>) });
        } else {
          // First-time signed-in user: seed with defaults only (never with
          // leftover localStorage that could belong to a previous user/demo).
          setState(initial);
          const { error: upErr } = await supabase
            .from("user_app_state")
            .upsert({ user_id: user.id, state: JSON.parse(JSON.stringify(initial)) as never });
          if (upErr) {
            console.error("[store] seed error", upErr);
            toast.error("Couldn't initialize your plan storage. Changes may not save.");
          }
        }
      } else {
        currentUserIdRef.current = null;
        const p = load();
        setState(p ? { ...initial, ...p } : initial);
      }
      if (!cancelled) setHydrated(true);
    };

    hydrate();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Persist on change: DB if signed in, localStorage otherwise. Debounced.
  // Also flush immediately on tab hide/unload so a quick logout doesn't lose
  // the last few edits sitting in the debounce timer.
  const flushSave = useCallback((stateToSave: State) => {
    const uid = currentUserIdRef.current;
    if (uid) {
      void supabase
        .from("user_app_state")
        .upsert({ user_id: uid, state: JSON.parse(JSON.stringify(stateToSave)) as never })
        .then(({ error }) => {
          if (error) {
            console.error("[store] save error", error);
            toast.error("Couldn't save your latest changes.");
          }
        });
    } else {
      try { localStorage.setItem(KEY, JSON.stringify(stateToSave)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => flushSave(state), 400);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state, hydrated, flushSave]);

  // Flush before tab hide / unload.
  useEffect(() => {
    if (!hydrated) return;
    const onHide = () => {
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
      flushSave(state);
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    return () => {
      window.removeEventListener("pagehide", onHide);
    };
  }, [state, hydrated, flushSave]);



  const markDirty = (s: State): State => ({ ...s, pendingChanges: s.schedule.length > 0 ? s.pendingChanges + 1 : s.pendingChanges });

  const addCommitment = useCallback((c: Commitment) => setState((s) => markDirty({ ...s, commitments: [...s.commitments, c] })), []);
  const updateCommitment = useCallback((id: string, patch: Partial<Commitment>) =>
    setState((s) => markDirty({ ...s, commitments: s.commitments.map((c) => (c.id === id ? { ...c, ...patch } : c)) })), []);
  const removeCommitment = useCallback((id: string) =>
    setState((s) => markDirty({ ...s, commitments: s.commitments.filter((c) => c.id !== id) })), []);

  const addExam = useCallback((e: Exam) => setState((s) => markDirty({ ...s, exams: [...s.exams, e] })), []);
  const updateExam = useCallback((id: string, patch: Partial<Exam>) =>
    setState((s) => markDirty({ ...s, exams: s.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) })), []);
  const removeExam = useCallback((id: string) =>
    setState((s) => markDirty({ ...s, exams: s.exams.filter((e) => e.id !== id) })), []);

  const setPrefs = useCallback((p: Partial<Preferences>) =>
    setState((s) => markDirty({ ...s, prefs: { ...s.prefs, ...p } })), []);

  // Backlog helpers
  const patchExam = (examId: string, fn: (e: Exam) => Exam) =>
    setState((s) => markDirty({ ...s, exams: s.exams.map((e) => (e.id === examId ? fn(e) : e)) }));

  const addTheory = useCallback((examId: string, t: TheoryTopic) =>
    patchExam(examId, (e) => ({ ...e, theory: [...e.theory, t] })), []);
  const updateTheory = useCallback((examId: string, id: string, patch: Partial<TheoryTopic>) =>
    patchExam(examId, (e) => ({ ...e, theory: e.theory.map((t) => t.id === id ? { ...t, ...patch } : t) })), []);
  const removeTheory = useCallback((examId: string, id: string) =>
    patchExam(examId, (e) => ({ ...e, theory: e.theory.filter((t) => t.id !== id) })), []);

  const addExercise = useCallback((examId: string, ex: ExerciseCategory) =>
    patchExam(examId, (e) => ({ ...e, exercises: [...e.exercises, ex] })), []);
  const updateExercise = useCallback((examId: string, id: string, patch: Partial<ExerciseCategory>) =>
    patchExam(examId, (e) => ({ ...e, exercises: e.exercises.map((x) => x.id === id ? { ...x, ...patch } : x) })), []);
  const removeExercise = useCallback((examId: string, id: string) =>
    patchExam(examId, (e) => ({ ...e, exercises: e.exercises.filter((x) => x.id !== id) })), []);

  const addDeliverable = useCallback((examId: string, d: Deliverable) =>
    patchExam(examId, (e) => ({ ...e, deliverables: [...e.deliverables, d] })), []);
  const updateDeliverable = useCallback((examId: string, id: string, patch: Partial<Deliverable>) =>
    patchExam(examId, (e) => ({ ...e, deliverables: e.deliverables.map((d) => d.id === id ? { ...d, ...patch } : d) })), []);
  const removeDeliverable = useCallback((examId: string, id: string) =>
    patchExam(examId, (e) => ({ ...e, deliverables: e.deliverables.filter((d) => d.id !== id) })), []);

  const addAttachment = useCallback((examId: string, a: Attachment) =>
    patchExam(examId, (e) => ({ ...e, attachments: [...e.attachments, a] })), []);
  const removeAttachment = useCallback((examId: string, id: string) =>
    patchExam(examId, (e) => ({ ...e, attachments: e.attachments.filter((a) => a.id !== id) })), []);

  const generateNow = (s: State, existing?: StudyBlock[]): State => {
    const plan = selectExamPlan(s.exams, s.prefs);
    const { blocks, warnings } = generateStudySchedule({
      exams: s.exams, plan, commitments: s.commitments, prefs: s.prefs, events: s.events,
      existing,
    });
    return { ...s, plan, schedule: blocks, warnings, generatedAt: new Date().toISOString(), pendingChanges: 0 };
  };

  const generatePlan = useCallback(() => setState((s) => generateNow(s)), []);
  const recalculateSchedule = useCallback(() => setState((s) => generateNow(s, s.schedule)), []);
  const regenerateFromScratch = useCallback(() => setState((s) => generateNow(s)), []);

  const addEvent = useCallback((e: UnexpectedEvent) => {
    let movedNotes: string[] = [];
    setState((s) => {
      const events = [...s.events, e];
      if (s.schedule.length === 0) return { ...s, events };
      const r = rescheduleAroundEvent(s.schedule, e, s.commitments, s.events, s.prefs);
      movedNotes = r.movedNotes;
      return { ...s, events, schedule: r.blocks };
    });
    return { movedNotes };
  }, []);

  const removeEvent = useCallback((id: string) =>
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) })), []);

  const resetDemo = useCallback(() => setState(initial), []);

  const toggleBlockComplete = useCallback((id: string) => setState((s) => {
    const has = s.completedBlocks.includes(id);
    return { ...s, completedBlocks: has ? s.completedBlocks.filter((x) => x !== id) : [...s.completedBlocks, id] };
  }), []);

  const moveBlock = useCallback((id: string, newDate: string, newStart: string): { ok: boolean; reason?: string } => {
    let outcome: { ok: boolean; reason?: string } = { ok: true };
    setState((s) => {
      const block = s.schedule.find((b) => b.id === id);
      if (!block) { outcome = { ok: false, reason: "Block not found" }; return s; }
      const [sh, sm] = block.start.split(":").map(Number);
      const [eh, em] = block.end.split(":").map(Number);
      const durMin = eh * 60 + em - (sh * 60 + sm);
      const [nsh, nsm] = newStart.split(":").map(Number);
      const newStartMin = nsh * 60 + nsm;
      const newEndMin = newStartMin + durMin;
      if (newEndMin > 22 * 60 + 30) { outcome = { ok: false, reason: "Doesn't fit before 22:30" }; return s; }
      // Build weekday from local calendar date, matching scheduler normalization.
      const wd = weekdayOf(newDate);
      // Commitment conflicts
      for (const c of s.commitments) {
        if (c.day !== wd) continue;
        const cs = parseInt(c.start.slice(0,2))*60 + parseInt(c.start.slice(3,5));
        const ce = parseInt(c.end.slice(0,2))*60 + parseInt(c.end.slice(3,5));
        if (cs < newEndMin && ce > newStartMin) { outcome = { ok: false, reason: `This slot overlaps with a fixed commitment (${c.name}). Choose another time.` }; return s; }
      }
      // Event conflicts
      for (const ev of s.events) {
        if (ev.date !== newDate) continue;
        const es = parseInt(ev.start.slice(0,2))*60 + parseInt(ev.start.slice(3,5));
        const ee = parseInt(ev.end.slice(0,2))*60 + parseInt(ev.end.slice(3,5));
        if (es < newEndMin && ee > newStartMin) { outcome = { ok: false, reason: `This slot overlaps with ${ev.name}. Choose another time.` }; return s; }
      }
      // Rest slot conflicts (lunch/dinner/etc.)
      for (const r of s.prefs.restSlots ?? []) {
        const applies =
          r.days === "every" ||
          (r.days === "weekdays" && wd !== "Sat" && wd !== "Sun") ||
          (r.days === "weekend" && (wd === "Sat" || wd === "Sun")) ||
          (r.days === "custom" && (r.customDays ?? []).includes(wd));
        if (!applies) continue;
        const rs = parseInt(r.start.slice(0,2))*60 + parseInt(r.start.slice(3,5));
        const re = parseInt(r.end.slice(0,2))*60 + parseInt(r.end.slice(3,5));
        if (rs < newEndMin && re > newStartMin) { outcome = { ok: false, reason: `This slot overlaps with rest time (${r.name}). Choose another time.` }; return s; }
      }
      // Unavailable day
      if (s.prefs.unavailableDays.includes(wd)) {
        outcome = { ok: false, reason: `${wd} is marked as an unavailable day.` }; return s;
      }
      // Other study block conflicts
      for (const b of s.schedule) {
        if (b.id === id || b.date !== newDate) continue;
        const bs = parseInt(b.start.slice(0,2))*60 + parseInt(b.start.slice(3,5));
        const be = parseInt(b.end.slice(0,2))*60 + parseInt(b.end.slice(3,5));
        if (bs < newEndMin && be > newStartMin) { outcome = { ok: false, reason: `Overlaps another study block (${b.taskTitle})` }; return s; }
      }
      const pad = (n: number) => String(n).padStart(2, "0");
      const newEnd = `${pad(Math.floor(newEndMin/60))}:${pad(newEndMin%60)}`;
      const schedule = s.schedule.map((b) => b.id === id ? {
        ...b,
        date: newDate,
        start: newStart,
        end: newEnd,
        moved: true,
        manuallyMoved: true,
        originalDate: b.originalDate ?? b.date,
        originalStart: b.originalStart ?? b.start,
      } : b);
      return { ...s, schedule };
    });
    return outcome;
  }, []);

  const value = useMemo<Ctx>(() => ({
    ...state,
    addCommitment, updateCommitment, removeCommitment,
    addExam, updateExam, removeExam,
    setPrefs,
    addTheory, updateTheory, removeTheory,
    addExercise, updateExercise, removeExercise,
    addDeliverable, updateDeliverable, removeDeliverable,
    addAttachment, removeAttachment,
    generatePlan, recalculateSchedule,
    addEvent, removeEvent, regenerateFromScratch, resetDemo,
    toggleBlockComplete, moveBlock,
  }), [state, addCommitment, updateCommitment, removeCommitment, addExam, updateExam, removeExam, setPrefs, addTheory, updateTheory, removeTheory, addExercise, updateExercise, removeExercise, addDeliverable, updateDeliverable, removeDeliverable, addAttachment, removeAttachment, generatePlan, recalculateSchedule, addEvent, removeEvent, regenerateFromScratch, resetDemo, toggleBlockComplete, moveBlock]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

// Convenience to satisfy unused-import guards in BacklogItem type
export type _BI = BacklogItem;

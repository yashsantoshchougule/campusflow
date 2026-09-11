import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { daysUntil, restSlotAppliesTo } from "@/lib/scheduler";
import { useEffect, useMemo, useState } from "react";
import type { Commitment, RestSlot, StudyBlock, UnexpectedEvent, Weekday } from "@/lib/types";
import { WEEKDAYS } from "@/lib/types";
import {
  buildAuthUrl,
  clearTokens,
  loadSyncedMap,
  loadTokens,
  redirectUri,
  syncExamDeadlines,
  syncStudyBlocks,
  type SyncResult,
} from "@/lib/google-calendar";
import { getGoogleClientId } from "@/lib/google-calendar.functions";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — DegreeFlow" }] }),
  component: () => (
    <AppShell>
      <CalendarPage />
    </AppShell>
  ),
});

const DAY_START = 8 * 60;   // 08:00
const DAY_END = 22 * 60;    // 22:00
const PX_PER_MIN = 0.9;     // ~54px/hour
const COL_HEIGHT = (DAY_END - DAY_START) * PX_PER_MIN;

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function pad(n: number) { return String(n).padStart(2, "0"); }
function toTime(min: number): string { return `${pad(Math.floor(min/60))}:${pad(min%60)}`; }
function toLocalYMD(d: Date): string { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function CalendarPage() {
  const { schedule, commitments, events, plan, generatePlan, recalculateSchedule, generatedAt, prefs, pendingChanges, completedBlocks, toggleBlockComplete, moveBlock } = useStore();
  const restSlots = prefs.restSlots ?? [];
  const completedSet = useMemo(() => new Set(completedBlocks), [completedBlocks]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<StudyBlock | null>(null);
  const [moveTarget, setMoveTarget] = useState<StudyBlock | null>(null);

  const weekDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    const monOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + monOffset + weekOffset * 7);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d;
    });
  }, [weekOffset]);

  const upcomingExams = plan?.selected ?? [];
  const nextExam = upcomingExams[0];

  const weekKeys = weekDays.map(toLocalYMD);

  const visibleSchedule = schedule;

  const weekBlocks = visibleSchedule.filter((b) => weekKeys.includes(b.date));
  const studyHours = weekBlocks.reduce((s, b) => (toMin(b.end) - toMin(b.start)) / 60 + s, 0);


  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 5</div>
          <h1 className="font-display text-5xl text-ink mt-1">Your study calendar.</h1>
          <p className="text-muted-foreground mt-2">
            {generatedAt ? `Plan generated ${new Date(generatedAt).toLocaleString()}` : "Generate a plan to see your study blocks."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="px-3 py-2 rounded-full border border-border text-sm hover:bg-muted">← Prev</button>
          <button onClick={() => setWeekOffset(0)} className="px-3 py-2 rounded-full border border-border text-sm hover:bg-muted">This week</button>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-3 py-2 rounded-full border border-border text-sm hover:bg-muted">Next →</button>
          {schedule.length > 0 && (
            <button onClick={recalculateSchedule} className="px-3 py-2 rounded-full bg-accent text-accent-foreground text-sm">
              Recalculate{pendingChanges > 0 ? ` (${pendingChanges})` : ""}
            </button>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-3">
        <Summary label="Next exam" value={nextExam ? nextExam.examName : "—"} sub={nextExam ? `in ${daysUntil(nextExam.chosenDate)} days` : "no plan yet"} accent />
        <Summary label="Study planned" value={`${studyHours.toFixed(1)}h`} sub="this week" />
        <Summary label="Blocks scheduled" value={`${weekBlocks.length}`} sub="this week" />
        <Summary label="Completed" value={`${weekBlocks.filter((b) => completedSet.has(b.id)).length}/${weekBlocks.length}`} sub="blocks done" />
      </div>

      <GoogleCalendarPanel
        blocks={schedule}
        exams={upcomingExams}
      />



      {schedule.length === 0 ? (
        <div className="paper rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="font-display text-3xl text-ink">Your adaptive study calendar will appear here</div>
          <p className="text-muted-foreground mt-2">Generate your plan to fill it with specific backlog tasks.</p>
          <button onClick={generatePlan} className="mt-6 px-5 py-2.5 rounded-full bg-ink text-cream text-sm">
            Generate my plan ✨
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div className="hidden md:block">
              <WeekTimeline
                weekDays={weekDays}
                schedule={visibleSchedule}
                commitments={commitments}
                events={events}
                restSlots={restSlots}
                upcomingExams={upcomingExams}
                selected={selected}
                setSelected={setSelected}
                completedSet={completedSet}
                toggleBlockComplete={toggleBlockComplete}
                onMove={(b) => setMoveTarget(b)}
              />
            </div>
            <div className="md:hidden">
              <AgendaList
                weekDays={weekDays}
                schedule={visibleSchedule}
                commitments={commitments}
                events={events}
                upcomingExams={upcomingExams}
                completedSet={completedSet}
                onSelect={setSelected}
                onToggleDone={toggleBlockComplete}
                onMove={(b) => setMoveTarget(b)}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="paper rounded-2xl border border-border p-5">
              <h2 className="font-display text-xl text-ink mb-2">Why this schedule?</h2>
              {selected ? (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{selected.examName} · {selected.kind}</div>
                  <div className="font-medium text-ink mt-1">{selected.taskTitle}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{selected.start}–{selected.end} · {selected.method}</div>
                  <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm text-ink">
                    {selected.reason}
                  </div>
                  {selected.soft && (
                    <div className="mt-2 text-[11px] text-info">Light task — safe to do after dinner.</div>
                  )}
                  {selected.manuallyMoved && (
                    <div className="mt-2 text-xs text-warning">Manually moved from {selected.originalDate} {selected.originalStart}.</div>
                  )}
                  {selected.moved && !selected.manuallyMoved && selected.originalDate && (
                    <div className="mt-2 text-xs text-warning">Auto-moved from {selected.originalDate} {selected.originalStart}.</div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => toggleBlockComplete(selected.id)}
                      className={`text-xs px-3 py-1.5 rounded-full ${completedSet.has(selected.id) ? "bg-success text-cream" : "border border-border hover:bg-muted"}`}
                    >
                      {completedSet.has(selected.id) ? "✓ Done" : "Mark done"}
                    </button>
                    <button
                      onClick={() => setMoveTarget(selected)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted"
                    >
                      Move…
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Click a study block to see why it was scheduled, mark it done, or move it.</p>
              )}
            </div>

            <div className="paper rounded-2xl border border-border p-5">
              <h3 className="font-display text-lg text-ink mb-2">Legend</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <Legend color="bg-info" label="Lecture / work commitment" />
                <Legend color="bg-muted-foreground/40" label="Lunch / dinner / rest" />
                <Legend color="bg-warning" label="Unexpected event" />
                <Legend color="bg-accent" label="Theory / high-priority study" />
                <Legend color="bg-success" label="Exercise / practice" />
                <Legend color="bg-primary" label="Project / deliverable" />
                <Legend color="bg-danger" label="Critical · near exam" />
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-3">
                Buffer: {prefs.bufferDays} day{prefs.bufferDays === 1 ? "" : "s"} before each exam · {prefs.blockDuration} min blocks · {prefs.studyMode}.
              </div>
            </div>
          </aside>
        </div>
      )}

      {moveTarget && (
        <MoveDialog
          block={moveTarget}
          onClose={() => setMoveTarget(null)}
          onMove={moveBlock}
        />
      )}
    </div>
  );
}

function WeekTimeline({
  weekDays, schedule, commitments, events, restSlots, upcomingExams, selected, setSelected, completedSet, toggleBlockComplete, onMove,
}: {
  weekDays: Date[];
  schedule: StudyBlock[];
  commitments: Commitment[];
  events: UnexpectedEvent[];
  restSlots: RestSlot[];
  upcomingExams: { examId: string; examName: string; chosenDate: string }[];
  selected: StudyBlock | null;
  setSelected: (b: StudyBlock | null) => void;
  completedSet: Set<string>;
  toggleBlockComplete: (id: string) => void;
  onMove: (b: StudyBlock) => void;
}) {
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i);
  const todayKey = toLocalYMD(new Date());
  return (
    <div className="paper rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
      <div className="min-w-[720px]">
      {/* Header row */}
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] bg-muted/40 border-b border-border">
        <div />
        {weekDays.map((d, i) => {
          const dayKey = toLocalYMD(d);
          const isToday = dayKey === todayKey;
          const examsToday = upcomingExams.filter((e) => e.chosenDate.slice(0, 10) === dayKey);
          return (
            <div key={i} className={`p-2 text-center border-l border-border ${isToday ? "bg-accent/10" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{WEEKDAYS[i]}</div>
              <div className={`font-display text-2xl ${isToday ? "text-accent" : "text-ink"}`}>{d.getDate()}</div>
              {examsToday.map((e) => (
                <div key={e.examId} className="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-danger text-cream font-medium truncate">
                  {e.examName} exam
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Body with hour column */}
      <div className="overflow-y-auto max-h-[640px]">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] relative">
          {/* Hour gutter */}
          <div className="border-r border-border" style={{ height: COL_HEIGHT }}>
            {hours.map((h) => (
              <div
                key={h}
                className="text-[10px] text-muted-foreground text-right pr-2"
                style={{ height: 60 * PX_PER_MIN, lineHeight: "12px" }}
              >
                {pad(h)}:00
              </div>
            ))}
          </div>
          {/* Day columns */}
          {weekDays.map((d, i) => {
            const dayKey = toLocalYMD(d);
            const wd = WEEKDAYS[(d.getDay() + 6) % 7] as Weekday;
            const dayCommitments = commitments.filter((c) => c.day === wd);
            const dayEvents = events.filter((e) => e.date === dayKey);
            const dayRest = restSlots.filter((r) => restSlotAppliesTo(r, wd));
            const dayBlocks = schedule.filter((b) => b.date === dayKey);
            return (
              <div
                key={i}
                className="relative border-l border-border bg-background/30"
                style={{ height: COL_HEIGHT }}
              >
                {/* hour grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border/40"
                    style={{ top: (h * 60 - DAY_START) * PX_PER_MIN }}
                  />
                ))}
                {dayRest.map((r) => (
                  <div
                    key={`r-${r.id}-${dayKey}`}
                    className="absolute left-0 right-0 bg-muted/30 border-y border-dashed border-border/60 pointer-events-none"
                    style={{
                      top: Math.max(0, (toMin(r.start) - DAY_START) * PX_PER_MIN),
                      height: Math.max(12, (Math.min(toMin(r.end), DAY_END) - Math.max(toMin(r.start), DAY_START)) * PX_PER_MIN),
                    }}
                  >
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70 px-1.5 pt-0.5 truncate">
                      {r.name} · Rest
                    </div>
                  </div>
                ))}
                {dayCommitments.map((c) => (
                  <TimelineTile
                    key={`c-${c.id}`}
                    start={toMin(c.start)}
                    end={toMin(c.end)}
                    className="border-l-4 border-l-info bg-info/10 border-info/30"
                    label={c.name}
                    sublabel={c.type}
                  />
                ))}
                {dayEvents.map((e) => (
                  <TimelineTile
                    key={`e-${e.id}`}
                    start={toMin(e.start)}
                    end={toMin(e.end)}
                    className="border-l-4 border-l-warning bg-warning/15 border-warning/40"
                    label={e.name}
                    sublabel="Event"
                  />
                ))}
                {dayBlocks.map((b) => (
                  <StudyTile
                    key={b.id}
                    block={b}
                    selected={selected?.id === b.id}
                    completed={completedSet.has(b.id)}
                    onSelect={() => setSelected(b)}
                    onToggleDone={() => toggleBlockComplete(b.id)}
                    onMove={() => onMove(b)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}

function TimelineTile({
  start, end, className, label, sublabel,
}: { start: number; end: number; className: string; label: string; sublabel?: string }) {
  const top = Math.max(0, (start - DAY_START) * PX_PER_MIN);
  const height = Math.max(20, (Math.min(end, DAY_END) - Math.max(start, DAY_START)) * PX_PER_MIN);
  return (
    <div
      className={`absolute left-1 right-1 rounded-md border p-1.5 overflow-hidden ${className}`}
      style={{ top, height }}
    >
      <div className="text-[10px] text-muted-foreground">{toTime(start)}–{toTime(end)}</div>
      <div className="text-xs text-ink leading-tight truncate">{label}</div>
      {sublabel && <div className="text-[9px] uppercase tracking-wider opacity-70">{sublabel}</div>}
    </div>
  );
}

function StudyTile({
  block, selected, completed, onSelect, onToggleDone, onMove,
}: {
  block: StudyBlock;
  selected: boolean;
  completed: boolean;
  onSelect: () => void;
  onToggleDone: () => void;
  onMove: () => void;
}) {
  const start = toMin(block.start);
  const end = toMin(block.end);
  const top = Math.max(0, (start - DAY_START) * PX_PER_MIN);
  const height = Math.max(36, (Math.min(end, DAY_END) - Math.max(start, DAY_START)) * PX_PER_MIN);

  const tone =
    block.priority === "Critical" ? "border-l-danger bg-danger/10" :
    block.kind === "Project" ? "border-l-primary bg-primary/10" :
    block.kind === "Exercise" ? "border-l-success bg-success/10" :
    block.kind === "Prep" ? "border-l-warning bg-warning/15" :
    block.kind === "Review" ? "border-l-info bg-info/10" :
    "border-l-accent bg-accent/10";

  const durMin = end - start;

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border border-l-4 p-1.5 overflow-hidden cursor-pointer transition-all hover:shadow-md ${tone} ${selected ? "ring-2 ring-accent" : ""} ${completed ? "opacity-60" : ""}`}
      style={{ top, height }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="text-[10px] text-muted-foreground flex-1 min-w-0 truncate">
          {block.start}–{block.end} · {durMin}m
        </div>
        <span className={`shrink-0 text-[9px] uppercase tracking-wider px-1 rounded ${
          block.priority === "Critical" ? "bg-danger text-cream" :
          block.priority === "High" ? "bg-warning text-ink" :
          "text-muted-foreground"
        }`}>{block.priority}</span>
      </div>
      <div className={`text-xs font-medium leading-tight mt-0.5 ${completed ? "line-through text-muted-foreground" : "text-ink"}`}>
        {block.taskTitle}
      </div>
      {height > 56 && (
        <>
          <div className="text-[10px] text-muted-foreground truncate">{block.examName}</div>
          {height > 72 && <div className="text-[10px] text-muted-foreground/80 truncate italic">{block.method}</div>}
        </>
      )}
      {height >= 56 && (
        <div className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleDone}
            className={`text-[10px] px-1.5 py-0.5 rounded ${completed ? "bg-success text-cream" : "bg-ink/5 hover:bg-ink/10 text-ink"}`}
          >
            {completed ? "✓" : "Done"}
          </button>
          <button
            onClick={onMove}
            className="text-[10px] px-1.5 py-0.5 rounded bg-ink/5 hover:bg-ink/10 text-ink"
          >
            Move
          </button>
          {block.manuallyMoved && (
            <span className="text-[9px] px-1 rounded bg-warning/30 text-ink uppercase tracking-wider">moved</span>
          )}
        </div>
      )}
    </div>
  );
}

function AgendaList({
  weekDays, schedule, commitments, events, upcomingExams, completedSet, onSelect, onToggleDone, onMove,
}: {
  weekDays: Date[];
  schedule: StudyBlock[];
  commitments: Commitment[];
  events: UnexpectedEvent[];
  upcomingExams: { examId: string; examName: string; chosenDate: string }[];
  completedSet: Set<string>;
  onSelect: (b: StudyBlock) => void;
  onToggleDone: (id: string) => void;
  onMove: (b: StudyBlock) => void;
}) {
  const todayKey = toLocalYMD(new Date());
  return (
    <div className="space-y-3">
      {weekDays.map((d, i) => {
        const dayKey = toLocalYMD(d);
        const wd = WEEKDAYS[(d.getDay() + 6) % 7] as Weekday;
        const isToday = dayKey === todayKey;
        const dayCommitments = commitments.filter((c) => c.day === wd);
        const dayEvents = events.filter((e) => e.date === dayKey);
        const dayBlocks = schedule.filter((b) => b.date === dayKey).sort((a, b) => a.start.localeCompare(b.start));
        const examsToday = upcomingExams.filter((e) => e.chosenDate.slice(0, 10) === dayKey);
        const hasContent = dayCommitments.length + dayEvents.length + dayBlocks.length + examsToday.length > 0;
        return (
          <div key={i} className={`paper rounded-2xl border ${isToday ? "border-accent/50" : "border-border"} overflow-hidden`}>
            <div className={`px-4 py-2.5 flex items-center justify-between ${isToday ? "bg-accent/10" : "bg-muted/30"}`}>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {d.toLocaleDateString(undefined, { weekday: "long" })}
                </div>
                <div className={`font-display text-xl ${isToday ? "text-accent" : "text-ink"}`}>
                  {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              </div>
              {isToday && <span className="text-[10px] uppercase tracking-wider text-accent">Today</span>}
            </div>
            <div className="divide-y divide-border">
              {examsToday.map((e) => (
                <div key={e.examId} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full bg-danger" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{e.examName} exam</div>
                    <div className="text-[11px] text-danger uppercase tracking-wider">Exam day</div>
                  </div>
                </div>
              ))}
              {dayCommitments.map((c) => (
                <div key={c.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full bg-info" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.start}–{c.end} · {c.type}</div>
                  </div>
                </div>
              ))}
              {dayEvents.map((e) => (
                <div key={e.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full bg-warning" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{e.name}</div>
                    <div className="text-[11px] text-muted-foreground">{e.start}–{e.end} · Event</div>
                  </div>
                </div>
              ))}
              {dayBlocks.map((b) => {
                const done = completedSet.has(b.id);
                const tone =
                  b.priority === "Critical" ? "bg-danger" :
                  b.kind === "Project" ? "bg-primary" :
                  b.kind === "Exercise" ? "bg-success" :
                  b.kind === "Prep" ? "bg-warning" :
                  b.kind === "Review" ? "bg-info" :
                  "bg-accent";
                return (
                  <div key={b.id} className="px-4 py-3 flex items-start gap-3">
                    <div className={`w-1 self-stretch min-h-8 rounded-full ${tone}`} />
                    <button onClick={() => onSelect(b)} className="flex-1 min-w-0 text-left">
                      <div className={`text-sm font-medium leading-tight ${done ? "line-through text-muted-foreground" : "text-ink"}`}>
                        {b.taskTitle}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {b.start}–{b.end} · {b.examName}
                      </div>
                    </button>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => onToggleDone(b.id)}
                        className={`text-[10px] px-2 py-1 rounded-full ${done ? "bg-success text-cream" : "border border-border hover:bg-muted"}`}
                      >
                        {done ? "✓ Done" : "Done"}
                      </button>
                      <button
                        onClick={() => onMove(b)}
                        className="text-[10px] px-2 py-1 rounded-full border border-border hover:bg-muted"
                      >
                        Move
                      </button>
                    </div>
                  </div>
                );
              })}
              {!hasContent && (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">No study, commitments, or events.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function MoveDialog({
  block, onClose, onMove,
}: {
  block: StudyBlock;
  onClose: () => void;
  onMove: (id: string, newDate: string, newStart: string) => { ok: boolean; reason?: string };
}) {
  const [date, setDate] = useState(block.date);
  const [start, setStart] = useState(block.start);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    const r = onMove(block.id, date, start);
    if (!r.ok) setError(r.reason ?? "Could not move block.");
    else onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm overflow-y-auto flex items-start sm:items-center justify-center p-4"
      style={{ width: "100vw", minHeight: "100vh" }}
      onClick={onClose}
    >
      <div
        className="paper rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Move study block</div>
        <h3 className="font-display text-2xl text-ink mt-1">{block.taskTitle}</h3>
        <div className="text-xs text-muted-foreground mt-1">
          {block.examName} · currently {block.date} {block.start}–{block.end}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">New date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">New start</span>
            <input
              type="time"
              value={start}
              step={900}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-danger/15 border border-danger/40 text-sm text-danger">
            ⚠ {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full border border-border text-sm hover:bg-muted">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-full bg-ink text-cream text-sm hover:bg-ink/90">Move block</button>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "bg-ink text-cream border-ink" : "bg-card border-border"}`}>
      <div className={`text-[10px] uppercase tracking-widest ${accent ? "text-cream/60" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-xl mt-1 truncate">{value}</div>
      <div className={`text-xs mt-0.5 ${accent ? "text-cream/70" : "text-muted-foreground"}`}>{sub}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function GoogleCalendarPanel({
  blocks,
  exams,
}: {
  blocks: StudyBlock[];
  exams: { examId: string; examName: string; chosenDate: string }[];
}) {
  const [connected, setConnected] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const [includeExams, setIncludeExams] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, m] = await Promise.all([loadTokens(), loadSyncedMap()]);
      if (cancelled) return;
      setConnected(!!t);
      setSyncedCount(Object.keys(m).length);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleConnect = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { clientId } = await getGoogleClientId();
      if (!clientId) {
        setMessage({ kind: "error", text: "Google Calendar isn't configured yet. Add a Google OAuth Client ID in project settings." });
        return;
      }
      const url = buildAuthUrl(clientId, redirectUri());
      window.location.href = url;
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await clearTokens();
      setConnected(false);
      setSyncedCount(0);
      setMessage({ kind: "info", text: "Google Calendar disconnected. Synced events were not deleted from Google." });
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
  };

  const handleSync = async () => {
    if (blocks.length === 0) {
      setMessage({ kind: "info", text: "No study blocks to sync yet. Generate your plan first." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const blockRes: SyncResult = await syncStudyBlocks(blocks);
      let examRes: SyncResult = { created: 0, updated: 0, failed: 0, errors: [] };
      if (includeExams && exams.length > 0) {
        examRes = await syncExamDeadlines(exams);
      }
      setSyncedCount(Object.keys(await loadSyncedMap()).length);
      const totalCreated = blockRes.created + examRes.created;
      const totalUpdated = blockRes.updated + examRes.updated;
      const totalFailed = blockRes.failed + examRes.failed;
      if (totalFailed === 0) {
        setMessage({
          kind: "ok",
          text: `Study plan synced to Google Calendar. ${totalCreated} created, ${totalUpdated} updated.`,
        });
      } else {
        const firstErr = [...blockRes.errors, ...examRes.errors][0] ?? "";
        setMessage({
          kind: "error",
          text: `${totalCreated} created, ${totalUpdated} updated, ${totalFailed} failed. ${firstErr}`.trim(),
        });
      }
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="paper rounded-2xl border border-border p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Integration</div>
        <div className="font-display text-xl text-ink mt-0.5">Google Calendar</div>
        <p className="text-xs text-muted-foreground mt-1">
          {connected
            ? `Connected. ${syncedCount} DegreeFlow event${syncedCount === 1 ? "" : "s"} tracked. Re-syncing updates the same events — no duplicates.`
            : "Sync your generated study blocks (and optionally exam deadlines) to your primary Google Calendar. Only DegreeFlow-generated events are written."}
        </p>
        {message && (
          <div className={`mt-2 text-xs rounded-md px-2.5 py-1.5 border ${
            message.kind === "ok" ? "bg-success/10 border-success/40 text-ink" :
            message.kind === "error" ? "bg-danger/10 border-danger/40 text-danger" :
            "bg-muted border-border text-muted-foreground"
          }`}>
            {message.text}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {connected && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            <input
              type="checkbox"
              checked={includeExams}
              onChange={(e) => setIncludeExams(e.target.checked)}
              className="accent-accent"
            />
            Include exam dates
          </label>
        )}
        {!connected ? (
          <button
            onClick={handleConnect}
            disabled={busy}
            className="px-4 py-2 rounded-full bg-ink text-cream text-sm disabled:opacity-50"
          >
            {busy ? "Opening Google…" : "Connect Google Calendar"}
          </button>
        ) : (
          <>
            <button
              onClick={handleSync}
              disabled={busy}
              className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm disabled:opacity-50"
            >
              {busy ? "Syncing…" : "Sync study plan"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={busy}
              className="px-3 py-2 rounded-full border border-border text-xs hover:bg-muted disabled:opacity-50"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}


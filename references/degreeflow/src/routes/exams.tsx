import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { useState } from "react";
import type {
  Attachment,
  Deliverable,
  Difficulty,
  Exam,
  ExamGoal,
  ExamType,
  ExerciseCategory,
  ExerciseSource,
  MaterialStatus,
  PrepStatus,
  Priority,
  StudyMethod,
  TheoryTopic,
} from "@/lib/types";
import {
  EXERCISE_METHODS,
  PROJECT_METHODS,
  THEORY_METHODS,
} from "@/lib/types";
import { effectiveHours, formatDate } from "@/lib/scheduler";

export const Route = createFileRoute("/exams")({
  head: () => ({ meta: [{ title: "Exam options — DegreeFlow" }] }),
  component: () => (
    <AppShell>
      <ExamsPage />
    </AppShell>
  ),
});

const DIFFS: Difficulty[] = ["Easy", "Medium", "Hard"];
const TYPES: ExamType[] = ["Written", "Oral", "Project", "Written + Oral", "Written + Project", "Combined"];
const PRIOS: Priority[] = ["Low", "Medium", "High"];
const GOALS: ExamGoal[] = ["Pass only", "Good grade", "Excellent grade"];
const STATUSES: PrepStatus[] = ["Not started", "Started", "Halfway", "Almost ready"];
const MAT_STATUSES: MaterialStatus[] = ["Material ready", "Notes to clean", "Slides to review", "Missing material"];
const THEORY_PROG = ["Not started", "Material prepared", "Studying", "First revision done", "Mastered"] as const;
const EX_PROG = ["Not started", "Some attempted", "Needs correction", "Repeated once", "Confident"] as const;
const EX_SOURCES: ExerciseSource[] = ["Past exam", "Exercise sheet", "Lab", "Book exercises", "Custom"];
const DEL_STATUS = ["Not started", "In progress", "Review needed", "Completed"] as const;

function ExamsPage() {
  const { exams, addExam, updateExam, removeExam, pendingChanges, recalculateSchedule, schedule } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [backlogOpen, setBacklogOpen] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 2</div>
          <h1 className="font-display text-5xl text-ink mt-1">Your exams &amp; study backlog.</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Add what you actually need to study for each exam — theory topics, exercise categories, and project deliverables.
            DegreeFlow generates the schedule from these concrete items.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setQuickAddOpen(true)} className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm hover:opacity-90">
            + Add today's lecture topic
          </button>
        </div>
      </header>

      {schedule.length > 0 && pendingChanges > 0 && (
        <div className="paper rounded-xl border border-warning/50 bg-warning/10 p-4 flex items-center justify-between gap-3">
          <div className="text-sm text-ink">
            <span className="font-medium">New topic added.</span> Recalculate schedule to include it in your weekly plan.
          </div>
          <button onClick={recalculateSchedule} className="px-4 py-2 rounded-full bg-ink text-cream text-sm shrink-0">
            Recalculate schedule
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {exams.map((e) => (
          <ExamCard
            key={e.id}
            exam={e}
            editing={editing === e.id}
            backlogOpen={backlogOpen === e.id}
            onToggleEdit={() => setEditing(editing === e.id ? null : e.id)}
            onToggleBacklog={() => setBacklogOpen(backlogOpen === e.id ? null : e.id)}
            onUpdate={(patch) => updateExam(e.id, patch)}
            onRemove={() => removeExam(e.id)}
          />
        ))}
      </div>

      <NewExamForm onAdd={addExam} />

      {quickAddOpen && <QuickAddDialog exams={exams} onClose={() => setQuickAddOpen(false)} />}

      <div className="flex justify-between">
        <Link to="/availability" className="px-5 py-2.5 rounded-full border border-border text-sm hover:bg-muted">← Back</Link>
        <Link to="/preferences" className="px-5 py-2.5 rounded-full bg-ink text-cream text-sm hover:bg-ink/90">
          Next: study &amp; planning preferences →
        </Link>
      </div>
    </div>
  );
}

function ExamCard({
  exam, editing, backlogOpen, onToggleEdit, onToggleBacklog, onUpdate, onRemove,
}: {
  exam: Exam;
  editing: boolean;
  backlogOpen: boolean;
  onToggleEdit: () => void;
  onToggleBacklog: () => void;
  onUpdate: (patch: Partial<Exam>) => void;
  onRemove: () => void;
}) {
  const diffTone =
    exam.difficulty === "Hard" ? "bg-danger/15 text-danger" :
    exam.difficulty === "Medium" ? "bg-warning/25 text-ink" : "bg-success/15 text-success";
  const prioTone =
    exam.priority === "High" ? "bg-accent/15 text-accent" :
    exam.priority === "Medium" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground";

  const addDate = () => {
    const next = prompt("Possible exam date (YYYY-MM-DD)");
    if (!next) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) { alert("Use format YYYY-MM-DD"); return; }
    onUpdate({ options: [...exam.options, next].sort() });
  };
  const removeDate = (d: string) => onUpdate({ options: exam.options.filter((x) => x !== d) });

  const totalHours =
    exam.theory.reduce((s, t) => s + effectiveHours(t, exam), 0) +
    exam.exercises.reduce((s, x) => s + effectiveHours(x, exam), 0) +
    exam.deliverables.reduce((s, d) => s + effectiveHours(d, exam), 0);
  const totalItems = exam.theory.length + exam.exercises.length + exam.deliverables.length;

  return (
    <div className="paper rounded-2xl border border-border p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-2xl text-ink leading-tight">{exam.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Pill>{exam.ects} ECTS</Pill>
            <Pill className={diffTone}>{exam.difficulty}</Pill>
            <Pill className={prioTone}>{exam.priority} priority</Pill>
            <Pill>{exam.examType}</Pill>
            <Pill>{exam.goal}</Pill>
            <Pill>{exam.status}</Pill>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onToggleEdit} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">
            {editing ? "Done" : "Edit"}
          </button>
          <button onClick={onRemove} className="text-xs px-2 py-1 rounded text-danger hover:bg-danger/10">Remove</button>
        </div>
      </div>

      {editing && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <Mini label="ECTS"><input type="number" min={1} max={30} value={exam.ects} onChange={(e) => onUpdate({ ects: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
          <Mini label="Difficulty"><select value={exam.difficulty} onChange={(e) => onUpdate({ difficulty: e.target.value as Difficulty })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{DIFFS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Exam type"><select value={exam.examType} onChange={(e) => onUpdate({ examType: e.target.value as ExamType })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{TYPES.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Priority"><select value={exam.priority} onChange={(e) => onUpdate({ priority: e.target.value as Priority })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{PRIOS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Goal"><select value={exam.goal} onChange={(e) => onUpdate({ goal: e.target.value as ExamGoal })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{GOALS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Status"><select value={exam.status} onChange={(e) => onUpdate({ status: e.target.value as PrepStatus })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{STATUSES.map(o => <option key={o}>{o}</option>)}</select></Mini>
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Possible exam dates</div>
        <div className="flex flex-wrap gap-2">
          {exam.options.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink/5 text-xs text-ink">
              {formatDate(d)}
              <button onClick={() => removeDate(d)} className="text-muted-foreground hover:text-danger ml-1" aria-label="Remove date">×</button>
            </span>
          ))}
          <button onClick={addDate} className="px-2.5 py-1 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            + Add date
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-center justify-between">
        <div className="text-xs text-ink">
          <span className="font-medium">{totalItems}</span> backlog item{totalItems === 1 ? "" : "s"} ·{" "}
          <span className="font-medium">{totalHours}h</span> estimated
        </div>
        <button onClick={onToggleBacklog} className="text-xs px-3 py-1.5 rounded-full bg-ink text-cream hover:opacity-90">
          {backlogOpen ? "Close backlog" : "Manage backlog →"}
        </button>
      </div>

      {backlogOpen && <BacklogPanel exam={exam} onUpdate={onUpdate} />}
    </div>
  );
}

function BacklogPanel({ exam, onUpdate }: { exam: Exam; onUpdate: (patch: Partial<Exam>) => void }) {
  const [tab, setTab] = useState<"theory" | "exercises" | "projects" | "materials">("theory");
  const {
    addTheory, updateTheory, removeTheory,
    addExercise, updateExercise, removeExercise,
    addDeliverable, updateDeliverable, removeDeliverable,
    addAttachment, removeAttachment,
  } = useStore();
  void onUpdate;

  return (
    <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
      <div className="flex gap-1 bg-muted rounded-full p-1 text-xs w-fit">
        {(["theory", "exercises", "projects", "materials"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full capitalize ${tab === t ? "bg-ink text-cream" : "text-muted-foreground"}`}>
            {t === "theory" ? `Theory (${exam.theory.length})` :
              t === "exercises" ? `Exercises (${exam.exercises.length})` :
              t === "projects" ? `Projects (${exam.deliverables.length})` :
              `Materials (${exam.attachments.length})`}
          </button>
        ))}
      </div>

      {tab === "theory" && (
        <div className="space-y-2">
          {exam.theory.map((t) => (
            <TheoryRow key={t.id} t={t} onUpdate={(p) => updateTheory(exam.id, t.id, p)} onRemove={() => removeTheory(exam.id, t.id)} />
          ))}
          <AddTheoryRow onAdd={(t) => addTheory(exam.id, t)} />
        </div>
      )}

      {tab === "exercises" && (
        <div className="space-y-2">
          {exam.exercises.map((x) => (
            <ExerciseRow key={x.id} x={x} onUpdate={(p) => updateExercise(exam.id, x.id, p)} onRemove={() => removeExercise(exam.id, x.id)} />
          ))}
          <AddExerciseRow onAdd={(x) => addExercise(exam.id, x)} />
        </div>
      )}

      {tab === "projects" && (
        <div className="space-y-2">
          {exam.deliverables.map((d) => (
            <DeliverableRow key={d.id} d={d} onUpdate={(p) => updateDeliverable(exam.id, d.id, p)} onRemove={() => removeDeliverable(exam.id, d.id)} />
          ))}
          <AddDeliverableRow onAdd={(d) => addDeliverable(exam.id, d)} />
        </div>
      )}

      {tab === "materials" && (
        <MaterialsPanel exam={exam} onAdd={(a) => addAttachment(exam.id, a)} onRemove={(id) => removeAttachment(exam.id, id)} />
      )}
    </div>
  );
}

function TheoryRow({ t, onUpdate, onRemove }: { t: TheoryTopic; onUpdate: (p: Partial<TheoryTopic>) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const mat = t.materialStatus;
  const matTone = mat === "Missing material" ? "bg-danger/15 text-danger"
    : mat === "Material ready" ? "bg-success/15 text-success" : "bg-warning/20 text-ink";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink truncate">{t.title}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            <Pill>{t.difficulty}</Pill>
            <HoursPill auto={t.autoEstimate} hours={t.estimatedHours} />
            <Pill className={matTone}>{t.materialStatus}</Pill>
            <Pill>{t.progress}</Pill>
            <Pill>{t.preferredMethod}</Pill>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setOpen(!open)} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">{open ? "Done" : "Edit"}</button>
          <button onClick={onRemove} className="text-xs px-2 py-1 rounded text-danger hover:bg-danger/10">✕</button>
        </div>
      </div>
      {open && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
          <Mini label="Title"><input value={t.title} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
          <HoursControl auto={t.autoEstimate} hours={t.estimatedHours} onChange={(p) => onUpdate(p as Partial<TheoryTopic>)} />
          <Mini label="Difficulty"><select value={t.difficulty} onChange={(e) => onUpdate({ difficulty: e.target.value as Difficulty })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{DIFFS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Material"><select value={t.materialStatus} onChange={(e) => onUpdate({ materialStatus: e.target.value as MaterialStatus })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{MAT_STATUSES.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Progress"><select value={t.progress} onChange={(e) => onUpdate({ progress: e.target.value as TheoryTopic["progress"] })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{THEORY_PROG.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Method"><select value={t.preferredMethod} onChange={(e) => onUpdate({ preferredMethod: e.target.value as StudyMethod })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{THEORY_METHODS.map(o => <option key={o}>{o}</option>)}</select></Mini>
        </div>
      )}
    </div>
  );
}

function AddTheoryRow({ onAdd }: { onAdd: (t: TheoryTopic) => void }) {
  const [title, setTitle] = useState("");
  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      id: `tt-${Date.now()}`, kind: "Theory", title: title.trim(),
      difficulty: "Medium", estimatedHours: 2, autoEstimate: true, materialStatus: "Material ready",
      progress: "Not started", preferredMethod: "Auto",
    });
    setTitle("");
  };
  return (
    <div className="flex gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ Add theory topic (e.g. Convolutional networks)" className="flex-1 px-3 py-2 rounded-lg border border-dashed border-border bg-card text-sm" />
      <button onClick={submit} className="px-3 py-2 rounded-lg bg-ink text-cream text-xs">Add</button>
    </div>
  );
}

function ExerciseRow({ x, onUpdate, onRemove }: { x: ExerciseCategory; onUpdate: (p: Partial<ExerciseCategory>) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink truncate">{x.title}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            <Pill>{x.difficulty}</Pill>
            <HoursPill auto={x.autoEstimate} hours={x.estimatedHours} />
            <Pill>{x.source}</Pill>
            <Pill>{x.progress}</Pill>
            <Pill>{x.preferredMethod}</Pill>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setOpen(!open)} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">{open ? "Done" : "Edit"}</button>
          <button onClick={onRemove} className="text-xs px-2 py-1 rounded text-danger hover:bg-danger/10">✕</button>
        </div>
      </div>
      {open && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
          <Mini label="Title"><input value={x.title} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
          <HoursControl auto={x.autoEstimate} hours={x.estimatedHours} onChange={(p) => onUpdate(p as Partial<ExerciseCategory>)} />
          <Mini label="Difficulty"><select value={x.difficulty} onChange={(e) => onUpdate({ difficulty: e.target.value as Difficulty })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{DIFFS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Source"><select value={x.source} onChange={(e) => onUpdate({ source: e.target.value as ExerciseSource })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{EX_SOURCES.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Progress"><select value={x.progress} onChange={(e) => onUpdate({ progress: e.target.value as ExerciseCategory["progress"] })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{EX_PROG.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Method"><select value={x.preferredMethod} onChange={(e) => onUpdate({ preferredMethod: e.target.value as StudyMethod })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{EXERCISE_METHODS.map(o => <option key={o}>{o}</option>)}</select></Mini>
        </div>
      )}
    </div>
  );
}

function AddExerciseRow({ onAdd }: { onAdd: (x: ExerciseCategory) => void }) {
  const [title, setTitle] = useState("");
  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      id: `xx-${Date.now()}`, kind: "Exercise", title: title.trim(),
      difficulty: "Medium", estimatedHours: 2, autoEstimate: true, source: "Exercise sheet",
      progress: "Not started", preferredMethod: "Auto",
    });
    setTitle("");
  };
  return (
    <div className="flex gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ Add exercise category (e.g. Dynamic programming)" className="flex-1 px-3 py-2 rounded-lg border border-dashed border-border bg-card text-sm" />
      <button onClick={submit} className="px-3 py-2 rounded-lg bg-ink text-cream text-xs">Add</button>
    </div>
  );
}

function DeliverableRow({ d, onUpdate, onRemove }: { d: Deliverable; onUpdate: (p: Partial<Deliverable>) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink truncate">{d.title}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            <Pill>Due {formatDate(d.deadline)}</Pill>
            <HoursPill auto={d.autoEstimate} hours={d.estimatedHours} />
            <Pill>{d.priority} priority</Pill>
            <Pill>{d.status}</Pill>
            <Pill>{d.preferredMethod}</Pill>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setOpen(!open)} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">{open ? "Done" : "Edit"}</button>
          <button onClick={onRemove} className="text-xs px-2 py-1 rounded text-danger hover:bg-danger/10">✕</button>
        </div>
      </div>
      {open && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
          <Mini label="Title"><input value={d.title} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
          <Mini label="Deadline"><input type="date" value={d.deadline} onChange={(e) => onUpdate({ deadline: e.target.value })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
          <HoursControl auto={d.autoEstimate} hours={d.estimatedHours} onChange={(p) => onUpdate(p as Partial<Deliverable>)} />
          <Mini label="Priority"><select value={d.priority} onChange={(e) => onUpdate({ priority: e.target.value as Priority })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{PRIOS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Status"><select value={d.status} onChange={(e) => onUpdate({ status: e.target.value as Deliverable["status"] })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{DEL_STATUS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Method"><select value={d.preferredMethod} onChange={(e) => onUpdate({ preferredMethod: e.target.value as StudyMethod })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{PROJECT_METHODS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Description"><textarea value={d.description ?? ""} onChange={(e) => onUpdate({ description: e.target.value })} rows={2} className="col-span-2 w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
        </div>
      )}
    </div>
  );
}

function AddDeliverableRow({ onAdd }: { onAdd: (d: Deliverable) => void }) {
  const [title, setTitle] = useState("");
  const submit = () => {
    if (!title.trim()) return;
    const dl = new Date(); dl.setDate(dl.getDate() + 14);
    onAdd({
      id: `dd-${Date.now()}`, kind: "Project", title: title.trim(),
      deadline: dl.toISOString().slice(0, 10), estimatedHours: 4, autoEstimate: true,
      priority: "Medium", status: "Not started", preferredMethod: "Auto",
    });
    setTitle("");
  };
  return (
    <div className="flex gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ Add project / deliverable" className="flex-1 px-3 py-2 rounded-lg border border-dashed border-border bg-card text-sm" />
      <button onClick={submit} className="px-3 py-2 rounded-lg bg-ink text-cream text-xs">Add</button>
    </div>
  );
}

function MaterialsPanel({ exam, onAdd, onRemove }: { exam: Exam; onAdd: (a: Attachment) => void; onRemove: (id: string) => void }) {
  const [label, setLabel] = useState("");
  const presets = ["Lecture slides", "Personal notes", "Past exam PDF", "Formula sheet", "Textbook chapter"];
  const submit = (val: string) => {
    const v = val.trim();
    if (!v) return;
    onAdd({ id: `at-${Date.now()}`, label: v });
    setLabel("");
  };
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground italic">
        File parsing is a future extension. In this MVP, materials are tracked manually to keep the schedule realistic.
      </div>
      <div className="flex flex-wrap gap-2">
        {exam.attachments.map((a) => (
          <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-info/10 text-info text-xs">
            📎 {a.label}
            <button onClick={() => onRemove(a.id)} className="text-muted-foreground hover:text-danger">×</button>
          </span>
        ))}
        {exam.attachments.length === 0 && <span className="text-xs text-muted-foreground">No materials attached.</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button key={p} onClick={() => submit(p)} className="px-2.5 py-1 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            + {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Custom material label" className="flex-1 px-3 py-2 rounded-lg border border-input text-sm bg-card" />
        <button onClick={() => submit(label)} className="px-3 py-2 rounded-lg bg-ink text-cream text-xs">Attach</button>
      </div>
    </div>
  );
}

function QuickAddDialog({ exams, onClose }: { exams: Exam[]; onClose: () => void }) {
  const { addTheory, addExercise, addDeliverable } = useStore();
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const [type, setType] = useState<"Theory" | "Exercise" | "Project">("Theory");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [hours, setHours] = useState(2);
  const [autoEstimate, setAutoEstimate] = useState(true);
  const [mat, setMat] = useState<MaterialStatus>("Material ready");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!examId || !title.trim()) return;
    const id = `add-${Date.now()}`;
    if (type === "Theory") addTheory(examId, {
      id, kind: "Theory", title: title.trim(), description: notes,
      difficulty, estimatedHours: hours, autoEstimate, materialStatus: mat,
      progress: "Not started", preferredMethod: "Auto",
    });
    else if (type === "Exercise") addExercise(examId, {
      id, kind: "Exercise", title: title.trim(), description: notes,
      difficulty, estimatedHours: hours, autoEstimate, source: "Exercise sheet",
      progress: "Not started", preferredMethod: "Auto",
    });
    else {
      const dl = new Date(); dl.setDate(dl.getDate() + 14);
      addDeliverable(examId, {
        id, kind: "Project", title: title.trim(), description: notes,
        deadline: dl.toISOString().slice(0, 10), estimatedHours: hours, autoEstimate,
        priority: "Medium", status: "Not started", preferredMethod: "Auto",
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm overflow-y-auto flex items-start sm:items-center justify-center p-4"
      style={{ width: "100vw", minHeight: "100vh" }}
      onClick={onClose}
    >
      <div className="paper rounded-2xl border border-border p-6 w-full max-w-lg space-y-4 my-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl text-ink">Add today's lecture topic</h3>
        <div className="grid grid-cols-2 gap-3">
          <Mini label="Course"><select value={examId} onChange={(e) => setExamId(e.target.value)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Mini>
          <Mini label="Type"><select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{["Theory", "Exercise", "Project"].map(o => <option key={o}>{o}</option>)}</select></Mini>
          <Mini label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
          <HoursControl auto={autoEstimate} hours={hours} onChange={(p) => { if (p.autoEstimate !== undefined) setAutoEstimate(p.autoEstimate); if (p.estimatedHours !== undefined) setHours(p.estimatedHours); }} />
          <Mini label="Difficulty"><select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{DIFFS.map(o => <option key={o}>{o}</option>)}</select></Mini>
          {type === "Theory" && <Mini label="Material status"><select value={mat} onChange={(e) => setMat(e.target.value as MaterialStatus)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{MAT_STATUSES.map(o => <option key={o}>{o}</option>)}</select></Mini>}
        </div>
        <Mini label="Optional notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full border border-border text-sm">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded-full bg-ink text-cream text-sm">Add to backlog</button>
        </div>
      </div>
    </div>
  );
}

function NewExamForm({ onAdd }: { onAdd: (e: Exam) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ects, setEcts] = useState(6);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [examType, setExamType] = useState<ExamType>("Written");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [goal, setGoal] = useState<ExamGoal>("Good grade");
  const [status, setStatus] = useState<PrepStatus>("Not started");
  const [dates, setDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");

  const submit = () => {
    if (!name.trim() || dates.length === 0) return;
    onAdd({
      id: `e-${Date.now()}`,
      name: name.trim(),
      ects, difficulty, examType, priority, goal, status,
      options: [...dates].sort(),
      theory: [], exercises: [], deliverables: [], attachments: [],
    });
    setName(""); setDates([]); setNewDate(""); setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full paper rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">
        + Add another exam
      </button>
    );
  }

  return (
    <div className="paper rounded-2xl border border-border p-5 space-y-4">
      <h3 className="font-display text-xl text-ink">New exam</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <Mini label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
        <Mini label="ECTS"><input type="number" min={1} max={30} value={ects} onChange={(e) => setEcts(Number(e.target.value))} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" /></Mini>
        <Mini label="Difficulty"><select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{DIFFS.map(o => <option key={o}>{o}</option>)}</select></Mini>
        <Mini label="Exam type"><select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{TYPES.map(o => <option key={o}>{o}</option>)}</select></Mini>
        <Mini label="Priority"><select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{PRIOS.map(o => <option key={o}>{o}</option>)}</select></Mini>
        <Mini label="Goal"><select value={goal} onChange={(e) => setGoal(e.target.value as ExamGoal)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{GOALS.map(o => <option key={o}>{o}</option>)}</select></Mini>
        <Mini label="Current status"><select value={status} onChange={(e) => setStatus(e.target.value as PrepStatus)} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card">{STATUSES.map(o => <option key={o}>{o}</option>)}</select></Mini>
      </div>
      <Mini label="Possible exam dates">
        <div className="flex flex-wrap gap-2 items-center">
          {dates.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink/5 text-xs">
              {formatDate(d)}
              <button onClick={() => setDates(dates.filter(x => x !== d))} className="text-muted-foreground hover:text-danger ml-1">×</button>
            </span>
          ))}
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="px-2 py-1 rounded border border-input text-sm bg-card" />
          <button onClick={() => { if (newDate) { setDates([...dates, newDate]); setNewDate(""); } }} className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs">+ Add</button>
        </div>
      </Mini>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-full border border-border text-sm">Cancel</button>
        <button onClick={submit} className="px-4 py-2 rounded-full bg-ink text-cream text-sm">Save exam</button>
      </div>
    </div>
  );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground ${className}`}>
      {children}
    </span>
  );
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}

type HoursPatch = { autoEstimate?: boolean; estimatedHours?: number };

function HoursPill({ auto, hours }: { auto: boolean; hours: number }) {
  if (auto) return <Pill className="bg-info/10 text-info">Auto ✨</Pill>;
  return <Pill>{hours}h custom</Pill>;
}

function HoursControl({ auto, hours, onChange }: { auto: boolean; hours: number; onChange: (p: HoursPatch) => void }) {
  return (
    <Mini label="Hours">
      <div className="flex gap-1 mb-1">
        <button type="button" onClick={() => onChange({ autoEstimate: true })} className={`px-2 py-1 rounded-full text-[10px] ${auto ? "bg-ink text-cream" : "border border-border text-muted-foreground"}`}>Auto estimate</button>
        <button type="button" onClick={() => onChange({ autoEstimate: false })} className={`px-2 py-1 rounded-full text-[10px] ${!auto ? "bg-ink text-cream" : "border border-border text-muted-foreground"}`}>Custom hours</button>
      </div>
      {auto ? (
        <div className="text-[10px] text-muted-foreground italic px-2 py-1.5">Estimated automatically</div>
      ) : (
        <input type="number" min={0.5} step={0.5} value={hours} onChange={(e) => onChange({ estimatedHours: Number(e.target.value) })} className="w-full px-2 py-1.5 rounded border border-input text-sm bg-card" />
      )}
    </Mini>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { formatDate, parseNaturalEvent } from "@/lib/scheduler";
import { useState } from "react";
import type { UnexpectedEvent } from "@/lib/types";

export const Route = createFileRoute("/reschedule")({
  head: () => ({ meta: [{ title: "Smart reschedule — DegreeFlow" }] }),
  component: () => (
    <AppShell>
      <ReschedulePage />
    </AppShell>
  ),
});

function ReschedulePage() {
  const { events, addEvent, removeEvent, schedule } = useStore();
  const [mode, setMode] = useState<"manual" | "nlp">("nlp");
  const [movedNotes, setMovedNotes] = useState<string[]>([]);
  const [preview, setPreview] = useState<UnexpectedEvent | null>(null);

  // manual fields
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("15:00");
  const [end, setEnd] = useState("17:00");
  const [importance, setImportance] = useState<UnexpectedEvent["importance"]>("Medium");

  // NLP fields
  const [nlpText, setNlpText] = useState("I have an unexpected appointment on Wednesday from 15:00 to 17:00.");

  const applyManual = () => {
    if (!name.trim() || !date) return;
    const e: UnexpectedEvent = { id: `ev-${Date.now()}`, name: name.trim(), date, start, end, importance };
    const { movedNotes } = addEvent(e);
    setMovedNotes(movedNotes);
    setName(""); setDate("");
  };

  const previewNlp = () => {
    const parsed = parseNaturalEvent(nlpText);
    setPreview(parsed);
  };

  const confirmNlp = () => {
    if (!preview) return;
    const { movedNotes } = addEvent(preview);
    setMovedNotes(movedNotes);
    setPreview(null);
    setNlpText("");
  };

  const affectedCount = preview
    ? schedule.filter((b) =>
        b.date === preview.date &&
        b.start < preview.end &&
        b.end > preview.start,
      ).length
    : 0;

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 7</div>
        <h1 className="font-display text-5xl text-ink mt-1">Smart reschedule assistant.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          DegreeFlow adapts your plan when life changes. Add an unexpected event and the schedule is automatically rebalanced.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="paper rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-ink">Add unexpected event</h2>
            <div className="flex bg-muted rounded-full p-1 text-xs">
              <button onClick={() => setMode("nlp")} className={`px-3 py-1 rounded-full ${mode === "nlp" ? "bg-ink text-cream" : "text-muted-foreground"}`}>Natural language</button>
              <button onClick={() => setMode("manual")} className={`px-3 py-1 rounded-full ${mode === "manual" ? "bg-ink text-cream" : "text-muted-foreground"}`}>Manual</button>
            </div>
          </div>

          {mode === "nlp" ? (
            <>
              <textarea
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                rows={4}
                placeholder="Example: I have an unexpected appointment on Wednesday from 15:00 to 17:00."
                className="w-full p-3 rounded-lg border border-input bg-card text-sm"
              />
              <div className="flex gap-2">
                <button onClick={previewNlp} className="px-4 py-2 rounded-full bg-ink text-cream text-sm">Preview event</button>
                {preview && (
                  <button onClick={confirmNlp} className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm">
                    Recalculate schedule
                  </button>
                )}
              </div>
              {preview && (
                <div className="rounded-xl border border-warning/50 bg-warning/10 p-4 space-y-1">
                  <div className="text-xs uppercase tracking-widest text-ink/70">Parsed event</div>
                  <div className="font-display text-xl text-ink">{preview.name}</div>
                  <div className="text-sm text-ink">{formatDate(preview.date)} · {preview.start}–{preview.end}</div>
                  <div className="text-xs text-ink/70 mt-1">
                    Impact: {affectedCount} study block{affectedCount === 1 ? "" : "s"} affected
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Field label="Event name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dentist appointment" className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm" />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-2 py-2 rounded-md border border-input bg-card text-sm" /></Field>
                <Field label="Start"><input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-full px-2 py-2 rounded-md border border-input bg-card text-sm" /></Field>
                <Field label="End"><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full px-2 py-2 rounded-md border border-input bg-card text-sm" /></Field>
              </div>
              <Field label="Importance">
                <div className="flex gap-2">
                  {(["Low", "Medium", "High"] as const).map((i) => (
                    <button key={i} onClick={() => setImportance(i)} className={`px-3 py-1.5 rounded-full text-xs ${importance === i ? "bg-ink text-cream" : "border border-border"}`}>{i}</button>
                  ))}
                </div>
              </Field>
              <button onClick={applyManual} className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm">
                Add & recalculate
              </button>
            </>
          )}
        </div>

        <div className="paper rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-display text-2xl text-ink">What just changed</h2>
          {movedNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reschedule yet. Add an event to see how DegreeFlow rebalances your study blocks.
            </p>
          ) : (
            <ul className="space-y-2">
              {movedNotes.map((n, i) => (
                <li key={i} className="text-sm text-ink p-3 rounded-lg bg-success/10 border border-success/30">
                  {n}
                </li>
              ))}
            </ul>
          )}

          <div className="pt-4 border-t border-border">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Active events</div>
            {events.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">No events added.</div>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border">
                    <div className="min-w-0">
                      <div className="text-sm text-ink truncate">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(e.date)} · {e.start}–{e.end} · {e.importance}</div>
                    </div>
                    <button onClick={() => removeEvent(e.id)} className="text-xs text-muted-foreground hover:text-danger">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Link to="/calendar" className="px-5 py-2.5 rounded-full border border-border text-sm hover:bg-muted">
          ← Back to calendar
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

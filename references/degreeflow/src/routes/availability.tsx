import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { WEEKDAYS, type Commitment, type CommitmentType, type Weekday, type StudyTimePref, type RestSlot } from "@/lib/types";

export const Route = createFileRoute("/availability")({
  head: () => ({ meta: [{ title: "Weekly availability — DegreeFlow" }] }),
  component: () => (
    <AppShell>
      <AvailabilityPage />
    </AppShell>
  ),
});

const TYPES: CommitmentType[] = ["Lecture", "Work", "Commute", "Sport", "Personal", "Other"];

function AvailabilityPage() {
  const { commitments, addCommitment, removeCommitment, prefs, setPrefs } = useStore();

  const grouped = WEEKDAYS.map((d) => ({
    day: d,
    items: commitments.filter((c) => c.day === d).sort((a, b) => a.start.localeCompare(b.start)),
  }));

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 1</div>
        <h1 className="font-display text-5xl text-ink mt-1">When are you actually free?</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Add your fixed weekly commitments. DegreeFlow uses these to find realistic study slots.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 paper rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-ink">Your week</h2>
            <span className="text-xs text-muted-foreground">{commitments.length} commitments</span>
          </div>
          <div className="space-y-3">
            {grouped.map(({ day, items }) => (
              <div key={day} className="flex items-start gap-4">
                <div className="w-12 text-xs uppercase tracking-widest text-muted-foreground pt-2">{day}</div>
                <div className="flex-1 space-y-2">
                  {items.length === 0 && (
                    <div className="text-xs text-muted-foreground/60 italic py-2">Free day</div>
                  )}
                  {items.map((c) => (
                    <CommitmentRow key={c.id} commitment={c} onRemove={() => removeCommitment(c.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <NewCommitmentForm onAdd={addCommitment} />
        </div>

        <aside className="paper rounded-2xl border border-border p-6 space-y-5 h-fit">
          <h2 className="font-display text-2xl text-ink">Study preferences</h2>

          <Field label="Preferred study time">
            <select
              value={prefs.preferredStudyTime}
              onChange={(e) => setPrefs({ preferredStudyTime: e.target.value as StudyTimePref })}
              className="w-full px-3 py-2 rounded-md border border-input bg-card text-sm"
            >
              {(["Morning", "Afternoon", "Evening", "Flexible"] as StudyTimePref[]).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>

          <div className="text-xs text-muted-foreground -mt-2 italic">
            Daily study capacity is derived automatically from your free time, lectures, unavailable days, and events.
          </div>

          <Field label={`Min break between blocks: ${prefs.minBreakMinutes} min`}>
            <input
              type="range" min={0} max={90} step={15} value={prefs.minBreakMinutes}
              onChange={(e) => setPrefs({ minBreakMinutes: Number(e.target.value) })}
              className="w-full accent-[oklch(0.68_0.17_38)]"
            />
          </Field>

          <Field label="Unavailable days">
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
                const on = prefs.unavailableDays.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      setPrefs({
                        unavailableDays: on
                          ? prefs.unavailableDays.filter((x) => x !== d)
                          : [...prefs.unavailableDays, d],
                      })
                    }
                    className={`px-2.5 py-1 rounded-full text-xs ${on ? "bg-ink text-cream" : "border border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>
        </aside>
      </div>

      <RestSlotsSection />


      <div className="flex justify-end">
        <Link
          to="/exams"
          className="px-5 py-2.5 rounded-full bg-ink text-cream text-sm hover:bg-ink/90"
        >
          Next: add your exams →
        </Link>
      </div>
    </div>
  );
}

function CommitmentRow({ commitment, onRemove }: { commitment: Commitment; onRemove: () => void }) {
  const toneMap: Record<CommitmentType, string> = {
    Lecture: "bg-info/15 text-info",
    Work: "bg-warning/20 text-ink",
    Commute: "bg-muted text-muted-foreground",
    Sport: "bg-success/15 text-success",
    Personal: "bg-accent/15 text-accent",
    Other: "bg-muted text-muted-foreground",
  };
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card">
      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${toneMap[commitment.type]}`}>
        {commitment.type}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink truncate">{commitment.name}</div>
        <div className="text-xs text-muted-foreground">{commitment.start}–{commitment.end}</div>
      </div>
      <button
        onClick={onRemove}
        className="text-xs text-muted-foreground hover:text-danger px-2"
        aria-label="Remove commitment"
      >
        ✕
      </button>
    </div>
  );
}

function NewCommitmentForm({ onAdd }: { onAdd: (c: Commitment) => void }) {
  const [name, setName] = useState("");
  const [day, setDay] = useState<Weekday>("Mon");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("12:00");
  const [type, setType] = useState<CommitmentType>("Lecture");

  const submit = () => {
    if (!name.trim() || start >= end) return;
    onAdd({ id: `c-${Date.now()}`, name: name.trim(), day, start, end, type });
    setName("");
  };

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Add commitment</div>
      <div className="grid sm:grid-cols-6 gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Algorithms lecture"
          className="sm:col-span-2 px-3 py-2 rounded-md border border-input bg-card text-sm"
        />
        <select value={day} onChange={(e) => setDay(e.target.value as Weekday)} className="px-2 py-2 rounded-md border border-input bg-card text-sm">
          {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="px-2 py-2 rounded-md border border-input bg-card text-sm" />
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="px-2 py-2 rounded-md border border-input bg-card text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value as CommitmentType)} className="px-2 py-2 rounded-md border border-input bg-card text-sm">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <button onClick={submit} className="mt-3 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm hover:opacity-90">
        + Add commitment
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">{label}</label>
      {children}
    </div>
  );
}

const DAY_OPTS: { value: RestSlot["days"]; label: string }[] = [
  { value: "every", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekend", label: "Weekend" },
  { value: "custom", label: "Custom" },
];

function RestSlotsSection() {
  const { prefs, setPrefs } = useStore();
  const slots = prefs.restSlots ?? [];

  const update = (id: string, patch: Partial<RestSlot>) =>
    setPrefs({ restSlots: slots.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const remove = (id: string) => setPrefs({ restSlots: slots.filter((s) => s.id !== id) });
  const add = () =>
    setPrefs({
      restSlots: [
        ...slots,
        { id: `rest-${Date.now()}`, name: "Break", start: "16:00", end: "16:30", days: "every" },
      ],
    });

  return (
    <div className="paper rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl text-ink">Rest time slots</h2>
        <button
          onClick={add}
          className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:opacity-90"
        >
          + Add rest slot
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Protected no-study time (lunch, dinner, breaks). Generated study blocks won't be placed here.
      </p>
      {slots.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">No rest slots — your day is unprotected.</div>
      ) : (
        <div className="space-y-2">
          {slots.map((rs) => (
            <div
              key={rs.id}
              className="grid sm:grid-cols-[1.4fr_auto_auto_1.2fr_auto] gap-2 items-center px-3 py-2 rounded-lg border border-border bg-card"
            >
              <input
                value={rs.name}
                onChange={(e) => update(rs.id, { name: e.target.value })}
                className="px-2 py-1.5 rounded-md border border-input bg-background text-sm"
              />
              <input
                type="time"
                value={rs.start}
                onChange={(e) => update(rs.id, { start: e.target.value })}
                className="px-2 py-1.5 rounded-md border border-input bg-background text-sm"
              />
              <input
                type="time"
                value={rs.end}
                onChange={(e) => update(rs.id, { end: e.target.value })}
                className="px-2 py-1.5 rounded-md border border-input bg-background text-sm"
              />
              <div className="flex flex-wrap gap-1.5 items-center">
                <select
                  value={rs.days}
                  onChange={(e) => update(rs.id, { days: e.target.value as RestSlot["days"] })}
                  className="px-2 py-1.5 rounded-md border border-input bg-background text-xs"
                >
                  {DAY_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {rs.days === "custom" && (
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map((d) => {
                      const on = (rs.customDays ?? []).includes(d);
                      return (
                        <button
                          key={d}
                          onClick={() =>
                            update(rs.id, {
                              customDays: on
                                ? (rs.customDays ?? []).filter((x) => x !== d)
                                : [...(rs.customDays ?? []), d],
                            })
                          }
                          className={`px-1.5 py-0.5 rounded text-[10px] ${on ? "bg-ink text-cream" : "border border-border text-muted-foreground"}`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(rs.id)}
                className="text-xs text-muted-foreground hover:text-danger px-2 justify-self-end"
                aria-label="Remove rest slot"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

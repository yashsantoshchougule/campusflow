import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { daysUntil, formatDate } from "@/lib/scheduler";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/plan")({
  head: () => ({ meta: [{ title: "Recommended plan — DegreeFlow" }] }),
  component: () => (
    <AppShell>
      <PlanPage />
    </AppShell>
  ),
});

function PlanPage() {
  const { plan, generatePlan, schedule, generatedAt, warnings, exams, commitments, prefs } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);

  const validateAndGenerate = () => {
    setError(null);
    if (exams.length === 0) { setError("Add at least one exam before generating a plan."); return; }
    const missingDates = exams.filter((e) => e.options.length === 0).map((e) => e.name);
    if (missingDates.length > 0) { setError(`These exams have no possible dates yet: ${missingDates.join(", ")}.`); return; }
    const freeDays = 7 - prefs.unavailableDays.length;
    if (freeDays <= 0) { setError("All weekdays are marked unavailable — free up at least one day."); return; }
    // commitments check (warn only): if commitments fully consume the day, computeFreeSlots returns empty per day
    void commitments;
    generatePlan();
    setJustGenerated(true);
    setTimeout(() => setJustGenerated(false), 4000);
  };

  const weeklyHours = useMemo(() => {
    return schedule.reduce((s, b) => {
      const [sh, sm] = b.start.split(":").map(Number);
      const [eh, em] = b.end.split(":").map(Number);
      return s + (eh * 60 + em - sh * 60 - sm) / 60;
    }, 0);
  }, [schedule]);

  const healthTone =
    plan?.health === "Critical" ? "bg-danger text-cream" :
    plan?.health === "Tight" ? "bg-warning text-ink" :
    "bg-success text-cream";

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 4</div>
          <h1 className="font-display text-5xl text-ink mt-1">Your recommended plan.</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {generatedAt
              ? `Generated ${new Date(generatedAt).toLocaleString()}.`
              : "Click generate to see which exam dates to choose and how to prepare."}
          </p>
        </div>
        <button
          onClick={validateAndGenerate}
          className="px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm hover:opacity-90"
        >
          {plan ? "Regenerate plan ✨" : "Generate my plan ✨"}
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-danger/15 border border-danger/40 text-sm text-danger">
          ⚠ {error}
        </div>
      )}

      {justGenerated && plan && plan.selected.length > 0 && (
        <div className="p-4 rounded-xl bg-success/15 border border-success/40 text-sm text-ink">
          ✓ Your adaptive study plan is ready.
        </div>
      )}

      {!plan && !error && (
        <div className="paper rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="font-display text-3xl text-ink">Your adaptive plan will appear here.</div>
          <p className="text-muted-foreground mt-2">
            We'll pick the best exam dates and build a study schedule around your free time.
          </p>
          <button onClick={validateAndGenerate} className="mt-6 px-5 py-2.5 rounded-full bg-ink text-cream text-sm">
            Generate my plan ✨
          </button>
        </div>
      )}

      {plan && (
        <>
          <div className="grid lg:grid-cols-4 gap-3">
            <Summary label="Exams selected" value={`${plan.selected.length}`} sub={plan.skipped.length ? `${plan.skipped.length} skipped` : "all included"} />
            <Summary label="Study hours" value={`${weeklyHours.toFixed(1)}h`} sub="planned across schedule" />
            <Summary label="Next exam" value={plan.selected[0] ? plan.selected[0].examName : "—"} sub={plan.selected[0] ? `in ${daysUntil(plan.selected[0].chosenDate)} days` : ""} accent />
            <div className={`rounded-xl p-4 ${healthTone}`}>
              <div className="text-[10px] uppercase tracking-widest opacity-70">Schedule health</div>
              <div className="font-display text-2xl mt-1">{plan.health}</div>
              <div className="text-xs mt-1 opacity-80">{plan.healthReason}</div>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-warning/20 border border-warning/40 text-sm text-ink space-y-1">
              {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
            </div>
          )}

          <section>
            <h2 className="font-display text-3xl text-ink mb-4">Recommended exam dates</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {plan.selected.map((s) => (
                <div key={s.examId} className="paper rounded-2xl border border-border p-5">
                  <div className="text-xs uppercase tracking-widest text-success">Selected</div>
                  <div className="font-display text-2xl text-ink mt-1">{s.examName}</div>
                  <div className="text-sm text-accent mt-1">{formatDate(s.chosenDate)} · in {daysUntil(s.chosenDate)} days</div>
                  <div className="text-sm text-muted-foreground mt-3">Because {s.reason}.</div>
                </div>
              ))}
            </div>
          </section>

          {(plan.rejected.length > 0 || plan.skipped.length > 0) && (
            <section>
              <h2 className="font-display text-3xl text-ink mb-4">Alternatives we didn't pick</h2>
              <div className="paper rounded-2xl border border-border divide-y divide-border">
                {plan.rejected.map((r, i) => (
                  <div key={i} className="p-4 flex flex-wrap gap-3 items-baseline">
                    <span className="text-sm text-ink font-medium">{r.examName}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>
                    <span className="text-xs text-muted-foreground italic ml-auto">{r.reason}</span>
                  </div>
                ))}
                {plan.skipped.map((r, i) => (
                  <div key={`s${i}`} className="p-4 flex flex-wrap gap-3 items-baseline">
                    <span className="text-sm text-ink font-medium">{r.examName}</span>
                    <span className="text-xs text-muted-foreground">— skipped</span>
                    <span className="text-xs text-muted-foreground italic ml-auto">{r.reason}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="paper rounded-2xl border border-border p-6">
            <h2 className="font-display text-2xl text-ink mb-2">What happens next</h2>
            <p className="text-sm text-muted-foreground">
              {schedule.length} study blocks were placed in your free time slots across the next weeks,
              avoiding lectures, work, and your unavailable days.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/calendar" className="px-5 py-2.5 rounded-full bg-ink text-cream text-sm hover:bg-ink/90">
                Open my calendar →
              </Link>
              <Link to="/dashboard" className="px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm hover:opacity-90">
                See my dashboard →
              </Link>
              <Link to="/reschedule" className="px-5 py-2.5 rounded-full border border-border text-sm hover:bg-muted">
                Add an unexpected event
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Summary({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "bg-ink text-cream border-ink" : "bg-card border-border"}`}>
      <div className={`text-[10px] uppercase tracking-widest ${accent ? "text-cream/60" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
      <div className={`text-xs mt-0.5 ${accent ? "text-cream/70" : "text-muted-foreground"}`}>{sub}</div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import type {
  BlockDuration,
  BufferDays,
  Intensity,
  PeriodPref,
  PrioritizeRule,
  RiskAttitude,
  StudyMethod,
  StudyMode,
} from "@/lib/types";
import { ALL_STUDY_METHODS } from "@/lib/types";

export const Route = createFileRoute("/preferences")({
  head: () => ({ meta: [{ title: "Study & planning preferences — DegreeFlow" }] }),
  component: () => (
    <AppShell>
      <PreferencesPage />
    </AppShell>
  ),
});

const PRIORITIZE: PrioritizeRule[] = [
  "Hardest first",
  "High priority first",
  "Best spacing",
  "Lower workload",
  "Best grade goal",
];

function PreferencesPage() {
  const { prefs, setPrefs, exams } = useStore();
  const maxExams = Math.max(exams.length, 8);

  const toggle = (rule: PrioritizeRule) => {
    setPrefs({
      prioritize: prefs.prioritize.includes(rule)
        ? prefs.prioritize.filter((r) => r !== rule)
        : [...prefs.prioritize, rule],
    });
  };
  const toggleMethod = (m: StudyMethod) => {
    setPrefs({
      studyMethods: prefs.studyMethods.includes(m)
        ? prefs.studyMethods.filter((x) => x !== m)
        : [...prefs.studyMethods, m],
    });
  };

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 3</div>
        <h1 className="font-display text-5xl text-ink mt-1">Study &amp; planning preferences.</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          These global preferences shape every generated block. They can be overridden on individual
          backlog items.
        </p>
      </header>

      <Panel title="Global study preferences" subtitle="Applied across all courses unless overridden per item.">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Preferred study techniques</div>
          <div className="flex flex-wrap gap-2">
            {ALL_STUDY_METHODS.map((m) => {
              const on = prefs.studyMethods.includes(m);
              return (
                <button key={m} onClick={() => toggleMethod(m)} className={`px-3 py-1.5 rounded-full text-xs ${on ? "bg-ink text-cream" : "border border-border text-muted-foreground hover:bg-muted"}`}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Choice<BlockDuration>
            label="Preferred block duration"
            value={prefs.blockDuration}
            options={[45, 60, 90, 120] as const}
            render={(v) => `${v} min`}
            onChange={(v) => setPrefs({ blockDuration: v })}
          />
          <Choice<Intensity>
            label="Preferred revision frequency"
            value={prefs.revisionFrequency}
            options={["Light", "Balanced", "Intensive"]}
            onChange={(v) => setPrefs({ revisionFrequency: v })}
          />
          <Choice<StudyMode>
            label="Preferred study mode"
            value={prefs.studyMode}
            options={["Theory-first", "Exercises-first", "Mixed"]}
            onChange={(v) => setPrefs({ studyMode: v })}
          />
          <Choice<BufferDays>
            label="Buffer before exams"
            value={prefs.bufferDays}
            options={[0, 1, 2] as const}
            render={(v) => v === 0 ? "No buffer" : `${v} day buffer`}
            onChange={(v) => setPrefs({ bufferDays: v })}
          />
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-6">
        <Panel title="Session shape">
          <Range label={`Exams this session: ${prefs.examsToTake}`} min={1} max={maxExams} value={prefs.examsToTake} onChange={(v) => setPrefs({ examsToTake: v })} />
          <Range label={`Min days between exams: ${prefs.minDaysBetweenExams}`} min={1} max={21} value={prefs.minDaysBetweenExams} onChange={(v) => setPrefs({ minDaysBetweenExams: v })} />
          <Range label={`Max exams per week: ${prefs.maxExamsPerWeek}`} min={1} max={5} value={prefs.maxExamsPerWeek} onChange={(v) => setPrefs({ maxExamsPerWeek: v })} />
          <Choice<PeriodPref> label="Preferred exam period" value={prefs.period} options={["Earlier", "Balanced", "Later"]} onChange={(v) => setPrefs({ period: v })} />
        </Panel>

        <Panel title="Approach">
          <Choice<RiskAttitude> label="Risk attitude" value={prefs.risk} options={["Safe", "Balanced", "Aggressive"]} onChange={(v) => setPrefs({ risk: v })} />
          <Choice<Intensity> label="Study intensity" value={prefs.intensity} options={["Light", "Balanced", "Intensive"]} onChange={(v) => setPrefs({ intensity: v })} />
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Prioritize (in order)</div>
            <div className="flex flex-wrap gap-2">
              {PRIORITIZE.map((p) => {
                const on = prefs.prioritize.includes(p);
                const order = prefs.prioritize.indexOf(p) + 1;
                return (
                  <button key={p} onClick={() => toggle(p)} className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-2 transition-colors ${on ? "bg-ink text-cream" : "border border-border text-muted-foreground hover:bg-muted"}`}>
                    {on && <span className="w-4 h-4 rounded-full bg-cream text-ink grid place-items-center text-[10px]">{order}</span>}
                    {p}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-2">Click to add/remove. Order matters: leftmost selected wins.</div>
          </div>
        </Panel>
      </div>

      <div className="flex justify-between">
        <Link to="/exams" className="px-5 py-2.5 rounded-full border border-border text-sm hover:bg-muted">← Back</Link>
        <Link to="/plan" className="px-5 py-2.5 rounded-full bg-ink text-cream text-sm hover:bg-ink/90">
          Next: generate my plan →
        </Link>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="paper rounded-2xl border border-border p-6 space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Range({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">{label}</label>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[oklch(0.68_0.17_38)]" />
    </div>
  );
}

function Choice<T extends string | number>({ label, value, options, onChange, render }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void; render?: (v: T) => string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={String(o)} onClick={() => onChange(o)} className={`px-3 py-1.5 rounded-full text-xs ${value === o ? "bg-ink text-cream" : "border border-border text-muted-foreground hover:bg-muted"}`}>
            {render ? render(o) : String(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { computeCourseMetrics, computeWeeklyMomentum, blockDurationHours } from "@/lib/metrics";
import { daysUntil, formatDate } from "@/lib/scheduler";
import { useMemo } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Study Momentum Dashboard — DegreeFlow" }] }),
  component: () => (
    <AppShell>
      <DashboardPage />
    </AppShell>
  ),
});

function DashboardPage() {
  const { exams, plan, schedule, completedBlocks } = useStore();
  const completedSet = useMemo(() => new Set(completedBlocks), [completedBlocks]);
  const courseMetrics = useMemo(
    () => exams.map((e) => computeCourseMetrics(e, plan)),
    [exams, plan],
  );
  const momentum = useMemo(() => computeWeeklyMomentum(schedule, completedSet, 0), [schedule, completedSet]);

  const riskCounts = courseMetrics.reduce(
    (acc, c) => {
      acc[c.risk] = (acc[c.risk] ?? 0) + 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 } as Record<string, number>,
  );

  // Material readiness across all backlog
  const allTheory = exams.flatMap((e) => e.theory);
  const matReadyPct = allTheory.length
    ? Math.round((allTheory.filter((t) => t.materialStatus === "Material ready").length / allTheory.length) * 100)
    : 100;

  // Next best action: pick most urgent course's nextAction
  const sortedByRisk = [...courseMetrics].sort((a, b) => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return order[a.risk] - order[b.risk];
  });
  const nextBest = sortedByRisk.find((c) => c.nextAction) ?? null;

  const upcomingExams = (plan?.selected ?? []).slice().sort((a, b) => +new Date(a.chosenDate) - +new Date(b.chosenDate));
  const recentlyDone = schedule.filter((b) => completedSet.has(b.id)).slice(-5).reverse();

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 6</div>
        <h1 className="font-display text-5xl text-ink mt-1">Study Momentum Dashboard.</h1>
        <p className="text-muted-foreground mt-2">Track your progress, momentum, and what to do next.</p>
      </header>

      {/* Top metric cards */}
      <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-3">
        <MetricCard
          label="Weekly momentum"
          value={`${momentum.completedBlocks} / ${momentum.plannedBlocks}`}
          sub="blocks completed"
        >
          <ProgressBar percent={momentum.percent} tone="accent" />
        </MetricCard>
        <MetricCard
          label="Study hours"
          value={`${momentum.completedHours.toFixed(1)}h / ${momentum.plannedHours.toFixed(1)}h`}
          sub={`${momentum.remainingHours.toFixed(1)}h remaining this week`}
        >
          <ProgressBar percent={momentum.plannedHours ? (momentum.completedHours / momentum.plannedHours) * 100 : 0} tone="success" />
        </MetricCard>
        <MetricCard
          label="Exams at risk"
          value={`${riskCounts.Critical + riskCounts.High}`}
          sub={`Critical ${riskCounts.Critical} · High ${riskCounts.High} · Med ${riskCounts.Medium} · Low ${riskCounts.Low}`}
        />
        <MetricCard
          label="Next best action"
          value={nextBest?.nextAction?.title ?? "All caught up"}
          sub={nextBest ? `${nextBest.examName} · ${nextBest.risk} risk` : "No pending tasks"}
          accent
        />
        <MetricCard
          label="Material readiness"
          value={`${matReadyPct}%`}
          sub="theory topics with material ready"
        >
          <ProgressBar percent={matReadyPct} tone="info" />
        </MetricCard>
      </div>

      {/* Course readiness cards */}
      <section>
        <h2 className="font-display text-3xl text-ink mb-4">Course readiness</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          {courseMetrics.map((c) => (
            <CourseCard key={c.examId} c={c} />
          ))}
        </div>
      </section>

      {/* Bottom row */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="paper rounded-2xl border border-border p-5">
          <h3 className="font-display text-xl text-ink mb-3">Upcoming deadlines</h3>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No plan yet. <Link to="/plan" className="text-accent underline">Generate one →</Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingExams.map((e) => (
                <li key={e.examId} className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-ink">{e.examName}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(e.chosenDate)}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full bg-ink text-cream">in {daysUntil(e.chosenDate)} days</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="paper rounded-2xl border border-border p-5">
          <h3 className="font-display text-xl text-ink mb-3">Recently completed</h3>
          {recentlyDone.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Mark blocks as done from the <Link to="/calendar" className="text-accent underline">calendar</Link> to build momentum.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentlyDone.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{b.taskTitle}</div>
                    <div className="text-xs text-muted-foreground truncate">{b.examName} · {b.method}</div>
                  </div>
                  <div className="text-xs text-success shrink-0">+{blockDurationHours(b).toFixed(1)}h</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label, value, sub, children, accent,
}: { label: string; value: string; sub?: string; children?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "bg-ink text-cream border-ink" : "bg-card border-border"}`}>
      <div className={`text-[10px] uppercase tracking-widest ${accent ? "text-cream/60" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-xl mt-1 leading-tight">{value}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? "text-cream/70" : "text-muted-foreground"}`}>{sub}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function ProgressBar({ percent, tone }: { percent: number; tone: "accent" | "success" | "info" | "danger" }) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  const bg = tone === "accent" ? "bg-accent" : tone === "success" ? "bg-success" : tone === "info" ? "bg-info" : "bg-danger";
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className={`h-full ${bg} transition-all`} style={{ width: `${safe}%` }} />
    </div>
  );
}

function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" | "Critical" }) {
  const tone =
    risk === "Critical" ? "bg-danger text-cream" :
    risk === "High" ? "bg-warning text-ink" :
    risk === "Medium" ? "bg-info/20 text-info" :
    "bg-success/20 text-success";
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${tone}`}>{risk} risk</span>;
}

function CourseCard({ c }: { c: ReturnType<typeof computeCourseMetrics> }) {
  const tone =
    c.overallReadiness >= 70 ? "success" :
    c.overallReadiness >= 45 ? "info" :
    c.overallReadiness >= 25 ? "accent" :
    "danger";
  return (
    <div className="paper rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-2xl text-ink leading-tight">{c.examName}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {c.chosenDate ? `${formatDate(c.chosenDate)} · in ${c.daysToExam} days` : "No date selected yet"}
          </div>
        </div>
        <RiskBadge risk={c.risk} />
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <div className="font-display text-4xl text-ink">{c.overallReadiness}%</div>
        <div className="text-xs text-muted-foreground">overall readiness</div>
      </div>
      <ProgressBar percent={c.overallReadiness} tone={tone as "accent" | "success" | "info" | "danger"} />

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <ProgressRow label="Theory" pct={c.theoryProgress} />
        <ProgressRow label="Exercises" pct={c.exerciseProgress} />
        {c.projectProgress !== null && <ProgressRow label="Project" pct={c.projectProgress} />}
        <ProgressRow label="Material" pct={c.materialReadiness} />
      </div>

      <div className="mt-4 text-xs text-muted-foreground italic">{c.riskReason}</div>

      {c.nextAction && (
        <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30">
          <div className="text-[10px] uppercase tracking-widest text-accent">Next recommended</div>
          <div className="text-sm font-medium text-ink mt-0.5">{c.nextAction.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{c.nextAction.reason}</div>
        </div>
      )}

      <div className="mt-3 text-[11px] text-muted-foreground">
        {c.remainingItems} backlog item{c.remainingItems === 1 ? "" : "s"} remaining
      </div>
    </div>
  );
}

function ProgressRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-ink font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

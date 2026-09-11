import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarRange, GraduationCap, LineChart, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DegreeFlow — Plan your exams. Stay in flow." },
      {
        name: "description",
        content:
          "DegreeFlow helps university students choose exam dates, build realistic study schedules, and track academic progress around real-life commitments.",
      },
      { property: "og:title", content: "DegreeFlow — Adaptive exam & study planner" },
      {
        property: "og:description",
        content: "Choose exam dates, structure your study, and stay in flow.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#preview" className="hover:text-foreground transition-colors">Preview</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/availability" className="text-sm px-4 py-2 rounded-full bg-ink text-cream hover:bg-ink/90 transition-colors">
                Open app
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex text-sm px-3 py-2 rounded-full hover:bg-ink/5 transition-colors">
                  Log in
                </Link>
                <Link to="/login" className="text-sm px-4 py-2 rounded-full bg-ink text-cream hover:bg-ink/90 transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink/5 text-xs text-ink/70 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Adaptive exam & study planner
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.98] text-ink">
              Plan your exams.<br />
              Structure your study.<br />
              <em className="italic text-accent">Stay in flow.</em>
            </h1>
            <p className="mt-6 sm:mt-8 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              DegreeFlow helps university students choose exam dates, build realistic study
              schedules, and track academic progress around real-life commitments.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to={user ? "/availability" : "/login"}
                className="px-6 py-3 rounded-full bg-ink text-cream text-sm font-medium hover:bg-ink/90 inline-flex items-center justify-center gap-2"
              >
                Start planning <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/plan"
                className="px-6 py-3 rounded-full border border-ink/20 text-sm hover:bg-ink/5 inline-flex items-center justify-center"
              >
                Explore demo
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <PreviewCard />
          </div>
        </div>
      </section>

      {/* Value props */}
      <section id="features" className="border-t border-border/60 bg-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Why DegreeFlow</div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink mt-2">A planner that thinks like a student.</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-4 sm:gap-6">
            <Feature
              icon={<Sparkles className="w-5 h-5" />}
              title="Adaptive exam planning"
              body="Choose the best exam dates based on spacing, difficulty, priorities, and available time."
            />
            <Feature
              icon={<CalendarRange className="w-5 h-5" />}
              title="Realistic study calendar"
              body="Schedules study blocks around lectures, commitments, rest slots, and unexpected events."
            />
            <Feature
              icon={<LineChart className="w-5 h-5" />}
              title="Progress dashboard"
              body="Track course readiness, study momentum, completed blocks, and next best actions."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">How it works</div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink mt-2">From blank week to a plan that holds up.</h2>
          </div>
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "01", t: "Add your availability", b: "Lectures, work, gym — your fixed weekly commitments and rest." },
              { n: "02", t: "Add exams & dates", b: "Pick from possible dates per exam; we'll suggest the best ones." },
              { n: "03", t: "Define your work", b: "Topics, exercises, and projects per course." },
              { n: "04", t: "Generate & adapt", b: "Get a study plan that reshapes when life happens." },
            ].map((s) => (
              <li key={s.n} className="paper rounded-2xl border border-border p-5">
                <div className="font-display text-3xl text-accent">{s.n}</div>
                <div className="mt-2 font-medium text-ink">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.b}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Product preview */}
      <section id="preview" className="border-t border-border/60 bg-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Inside DegreeFlow</div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink mt-2">Built to actually be used.</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <MiniCalendarPreview />
            <CourseReadinessPreview />
            <MomentumPreview />
          </div>
        </div>
      </section>

      {/* Trust / privacy */}
      <section className="border-t border-border/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Privacy-first
          </div>
          <p className="mt-4 text-base sm:text-lg text-ink/80">
            Your academic data stays linked to your account. Google Calendar sync only creates
            and updates DegreeFlow study events.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60 bg-ink text-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cream/10 text-cream mb-6">
            <GraduationCap className="w-7 h-7" strokeWidth={1.6} />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl">Build your study plan.</h2>
          <p className="mt-4 text-cream/70 max-w-xl mx-auto">
            Free to start. No clutter, no fake gamification — just a planner that respects your time.
          </p>
          <Link
            to={user ? "/availability" : "/login"}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cream text-ink text-sm font-medium hover:bg-cream/90"
          >
            {user ? "Open your plan" : "Get started"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 justify-between items-center">
          <span>DegreeFlow — adaptive exam & study planner.</span>
          <span>© {new Date().getFullYear()} DegreeFlow</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="paper rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent grid place-items-center">
        {icon}
      </div>
      <div className="mt-4 font-medium text-ink text-lg">{title}</div>
      <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</div>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="paper rounded-2xl border border-border shadow-xl p-5 sm:p-6 lg:rotate-1 lg:hover:rotate-0 transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Recommended plan</div>
        <div className="text-xs text-success font-medium">Schedule healthy</div>
      </div>
      {([
        { d: "Mon · 15:00", c: "Machine Learning", t: "Project milestone", tone: "high" },
        { d: "Tue · 14:00", c: "Database Systems", t: "SQL exercises", tone: "medium" },
        { d: "Wed · 16:00", c: "Statistical Learning", t: "Feynman Technique", tone: "critical" },
        { d: "Fri · 14:00", c: "Machine Learning", t: "Past exam simulation", tone: "high" },
      ] as const).map((b, i) => (
        <Row key={i} {...b} />
      ))}
      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground flex justify-between">
        <span>3 exams · 18h this week</span>
        <span className="text-accent">Next exam in 20 days</span>
      </div>
    </div>
  );
}

function Row({ d, c, t, tone }: { d: string; c: string; t: string; tone: "low" | "medium" | "high" | "critical" }) {
  const color =
    tone === "critical" ? "bg-danger" : tone === "high" ? "bg-accent" : tone === "medium" ? "bg-info" : "bg-success";
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`w-1 h-10 rounded-full ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{c}</div>
        <div className="text-xs text-muted-foreground truncate">{t}</div>
      </div>
      <div className="text-xs text-muted-foreground shrink-0">{d}</div>
    </div>
  );
}

function MiniCalendarPreview() {
  return (
    <div className="paper rounded-2xl border border-border p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Calendar</div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
          <div key={d} className="text-[10px] text-center text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: 20 }).map((_, i) => {
          const variants = ["bg-accent/30", "bg-info/30", "bg-muted", "bg-muted", "bg-success/30"];
          const cls = variants[i % variants.length];
          return <div key={i} className={`h-6 rounded ${cls}`} />;
        })}
      </div>
      <div className="mt-4 text-sm font-medium text-ink">Weekly study grid</div>
      <div className="text-xs text-muted-foreground">Drag-free, conflict-aware blocks.</div>
    </div>
  );
}

function CourseReadinessPreview() {
  const courses = [
    { name: "Machine Learning", v: 72, tone: "bg-accent" },
    { name: "Database Systems", v: 54, tone: "bg-info" },
    { name: "Statistical Learning", v: 38, tone: "bg-danger" },
  ];
  return (
    <div className="paper rounded-2xl border border-border p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Course readiness</div>
      <div className="mt-4 space-y-3">
        {courses.map((c) => (
          <div key={c.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink truncate">{c.name}</span>
              <span className="text-muted-foreground">{c.v}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${c.tone}`} style={{ width: `${c.v}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm font-medium text-ink">Per-course progress</div>
      <div className="text-xs text-muted-foreground">See where to focus next.</div>
    </div>
  );
}

function MomentumPreview() {
  const heights = [40, 60, 30, 80, 70, 90, 50];
  return (
    <div className="paper rounded-2xl border border-border p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Momentum</div>
      <div className="mt-4 h-24 flex items-end gap-2">
        {heights.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-accent/70" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-4 text-sm font-medium text-ink">7-day study streak</div>
      <div className="text-xs text-muted-foreground">Stay consistent — no guilt loops.</div>
    </div>
  );
}

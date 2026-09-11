import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, User as UserIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

const STEPS = [
  { to: "/availability", label: "Availability", n: 1 },
  { to: "/exams", label: "Exams", n: 2 },
  { to: "/preferences", label: "Preferences", n: 3 },
  { to: "/plan", label: "Generate plan", n: 4 },
  { to: "/calendar", label: "Calendar", n: 5 },
  { to: "/dashboard", label: "Dashboard", n: 6 },
  { to: "/reschedule", label: "Reschedule", n: 7 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { location } = useRouterState();
  const currentIdx = STEPS.findIndex((s) => location.pathname.startsWith(s.to));
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (profile?.full_name || user?.email || "?")
    .split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {!user && (
        <div className="bg-accent/10 border-b border-accent/20 text-xs text-ink/80 px-6 py-2 text-center">
          Demo mode — <Link to="/login" className="text-accent font-medium hover:underline">sign up</Link> to save your plan.
        </div>
      )}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/plan"
              className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:opacity-90 shrink-0"
            >
              Generate plan
            </Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-9 h-9 rounded-full bg-ink text-cream text-xs font-medium grid place-items-center hover:opacity-90"
                  aria-label="User menu"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background shadow-lg z-40 overflow-hidden">
                      <div className="px-4 py-3 border-b border-border">
                        <div className="text-sm font-medium text-ink truncate">{profile?.full_name || "Student"}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => { setMenuOpen(false); navigate({ to: "/profile" }); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4" /> Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-danger"
                      >
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs px-3 py-1.5 rounded-full border border-ink/20 hover:bg-ink hover:text-cream transition-colors shrink-0"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
        <div className="border-t border-border/60 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1">
            {STEPS.map((s, i) => {
              const active = i === currentIdx;
              const done = currentIdx > i;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                    active
                      ? "bg-ink text-cream"
                      : done
                        ? "text-ink hover:bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full grid place-items-center text-[10px] ${
                      active ? "bg-cream text-ink" : done ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : s.n}
                  </span>
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">{children}</main>
      <footer className="border-t border-border bg-background/50">
        <div className="max-w-7xl mx-auto px-6 py-5 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 justify-between">
          <span>DegreeFlow — adaptive exam & study planner.</span>
          <span>© {new Date().getFullYear()} DegreeFlow</span>
        </div>
      </footer>
    </div>
  );
}

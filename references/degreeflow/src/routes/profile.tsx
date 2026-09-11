import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — DegreeFlow" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setUniversity(profile.university ?? "");
      setDegree(profile.degree_program ?? "");
      setYear(profile.year ?? "");
      setSemester(profile.semester ?? "");
    }
  }, [profile]);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName || null,
      university: university || null,
      degree_program: degree || null,
      year: year || null,
      semester: semester || null,
    });
    setSaving(false);
    if (error) toast.error(error);
    else toast.success("Profile saved");
  };

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-ink">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

        <form onSubmit={save} className="mt-8 space-y-4 paper rounded-xl border border-border p-6">
          <Field label="Full name" value={fullName} onChange={setFullName} maxLength={100} />
          <Field label="University" value={university} onChange={setUniversity} maxLength={150} />
          <Field label="Degree program" value={degree} onChange={setDegree} maxLength={150} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year" value={year} onChange={setYear} maxLength={20} />
            <Field label="Semester" value={semester} onChange={setSemester} maxLength={20} />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-full bg-ink text-cream text-sm font-medium hover:bg-ink/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="mt-6 text-xs text-muted-foreground">
          DegreeFlow stores your academic planning data securely and keeps it linked only to your account.
          Google Calendar sync only creates and updates DegreeFlow study events.
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
    </label>
  );
}

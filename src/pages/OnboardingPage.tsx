import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onboardingService } from '../features/profile/onboardingService';
import './OnboardingPage.css';

type FormData = {
  fullName: string; studentId: string; collegeName: string; course: string; department: string; semester: string;
  minimumAttendance: string; preferredStart: string; preferredEnd: string; sessionDuration: string; breakDuration: string;
  strongSubjects: string[]; weakSubjects: string[]; language: 'English' | 'Hindi' | 'Marathi';
};

const initialForm: FormData = {
  fullName: '', studentId: '', collegeName: '', course: '', department: '', semester: '', minimumAttendance: '75',
  preferredStart: '', preferredEnd: '', sessionDuration: '45', breakDuration: '10', strongSubjects: [], weakSubjects: [], language: 'English',
};

function SubjectTags({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  const [value, setValue] = useState('');
  const add = () => {
    const subject = value.trim();
    if (subject && !values.includes(subject)) onChange([...values, subject]);
    setValue('');
  };
  return <label className="onboarding-tags"><span>{label}</span><div><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /><button type="button" onClick={add}>Add</button></div><ul>{values.map((subject) => <li key={subject}>{subject}<button type="button" onClick={() => onChange(values.filter((item) => item !== subject))}>Remove</button></li>)}</ul></label>;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [hasAvatar, setHasAvatar] = useState(false);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [completed, setCompleted] = useState(false);

  const update = (name: keyof FormData, value: string | string[]) => setForm((current) => ({ ...current, [name]: value }));

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await onboardingService.load();
        if (!active) return;
        setForm(data.values); setCompleted(data.completed); setImagePreview(data.avatarUrl); setHasAvatar(Boolean(data.avatarUrl)); setLoading(false);
      } catch (caught) { if (active) { setError(caught instanceof Error ? caught.message : 'Unable to load onboarding details.'); navigate('/login', { replace: true }); } }
    }
    void load();
    return () => { active = false; };
  }, [navigate]);

  const validate = (complete: boolean) => {
    const errors: Record<string, string> = {};
    if (complete) {
      (['fullName', 'studentId', 'collegeName', 'course', 'department', 'semester'] as const).forEach((field) => { if (!form[field].trim()) errors[field] = 'This field is required.'; });
    }
    const attendance = Number(form.minimumAttendance);
    if (!Number.isInteger(attendance) || attendance < 1 || attendance > 100) errors.minimumAttendance = 'Enter a whole number from 1 to 100.';
    if (form.semester && (!Number.isInteger(Number(form.semester)) || Number(form.semester) < 1 || Number(form.semester) > 20)) errors.semester = 'Enter a semester from 1 to 20.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const chooseImage = (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setFieldErrors((errors) => ({ ...errors, image: 'Use a JPG, PNG or WebP image up to 5 MB.' })); return; }
    setFieldErrors((errors) => ({ ...errors, image: '' }));
    setImageFile(file); setRemoveAvatar(false); setImagePreview(URL.createObjectURL(file));
  };

  async function save(complete: boolean) {
    setError(''); setSuccess('');
    if (!validate(complete)) return;
    setSaving(true);
    try {
      if (imageFile) setUploadMessage('Uploading profile image...');
      const result = await onboardingService.save(form, complete || completed, { imageFile, hasAvatar, removeAvatar });
      setUploadMessage(''); setCompleted(complete || completed); setHasAvatar(Boolean(result.avatarPath)); setRemoveAvatar(false); setImageFile(null);
      if (result.avatarUrl) setImagePreview(result.avatarUrl);
      setSuccess(complete ? 'Setup complete. Opening your dashboard...' : 'Your progress has been saved.');
      if (complete) window.setTimeout(() => navigate('/dashboard'), 700);
    } catch (caught) { setUploadMessage(''); setError(caught instanceof Error ? caught.message : 'Unable to save your onboarding details.'); } finally { setSaving(false); }
  }

  if (loading) return <section className="onboarding-page"><p>Loading onboarding details...</p></section>;
  return <section className="onboarding-page" aria-labelledby="onboarding-title"><h1 id="onboarding-title">Student onboarding</h1><p>Complete your academic profile and study preferences.</p>
    {error && <p className="onboarding-message" role="alert">{error}</p>}{success && <p className="onboarding-message" role="status">{success}</p>}
    <form onSubmit={(event) => { event.preventDefault(); void save(true); }}>
      <fieldset><legend>Basic Student Information</legend>
        <label>Profile image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} /></label>{fieldErrors.image && <small>{fieldErrors.image}</small>}
        {imagePreview && <div className="onboarding-preview"><img src={imagePreview} alt="Selected profile preview" /><button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setRemoveAvatar(true); }}>Remove image</button></div>}
        <div className="onboarding-grid"><label>Full name<input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} />{fieldErrors.fullName && <small>{fieldErrors.fullName}</small>}</label><label>Student/roll number<input value={form.studentId} onChange={(event) => update('studentId', event.target.value)} />{fieldErrors.studentId && <small>{fieldErrors.studentId}</small>}</label><label>College name<input value={form.collegeName} onChange={(event) => update('collegeName', event.target.value)} />{fieldErrors.collegeName && <small>{fieldErrors.collegeName}</small>}</label><label>Course<input value={form.course} onChange={(event) => update('course', event.target.value)} />{fieldErrors.course && <small>{fieldErrors.course}</small>}</label><label>Department<input value={form.department} onChange={(event) => update('department', event.target.value)} />{fieldErrors.department && <small>{fieldErrors.department}</small>}</label><label>Current semester<input type="number" min="1" max="20" value={form.semester} onChange={(event) => update('semester', event.target.value)} />{fieldErrors.semester && <small>{fieldErrors.semester}</small>}</label></div>
      </fieldset>
      <fieldset><legend>Attendance Preference</legend><label>Minimum required attendance percentage<input type="number" min="1" max="100" value={form.minimumAttendance} onChange={(event) => update('minimumAttendance', event.target.value)} />{fieldErrors.minimumAttendance && <small>{fieldErrors.minimumAttendance}</small>}</label></fieldset>
      <fieldset><legend>Study Preferences</legend><div className="onboarding-grid"><label>Preferred study start time<input type="time" value={form.preferredStart} onChange={(event) => update('preferredStart', event.target.value)} /></label><label>Preferred study end time<input type="time" value={form.preferredEnd} onChange={(event) => update('preferredEnd', event.target.value)} /></label><label>Average study-session duration (minutes)<input type="number" min="1" value={form.sessionDuration} onChange={(event) => update('sessionDuration', event.target.value)} /></label><label>Break preference (minutes)<input type="number" min="0" value={form.breakDuration} onChange={(event) => update('breakDuration', event.target.value)} /></label><label>Language preference<select value={form.language} onChange={(event) => update('language', event.target.value)}><option>English</option><option>Hindi</option><option>Marathi</option></select></label></div><SubjectTags label="Strong subjects" values={form.strongSubjects} onChange={(values) => update('strongSubjects', values)} /><SubjectTags label="Weak subjects" values={form.weakSubjects} onChange={(values) => update('weakSubjects', values)} /></fieldset>
      {uploadMessage && <p role="status">{uploadMessage}</p>}<div className="onboarding-actions"><button disabled={saving} type="submit">{saving ? 'Saving...' : 'Complete Setup'}</button><button disabled={saving} type="button" onClick={() => void save(false)}>Save and Continue Later</button><Link to="/dashboard">Skip for Now</Link></div>
    </form>
  </section>;
}

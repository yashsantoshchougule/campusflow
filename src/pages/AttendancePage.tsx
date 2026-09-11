import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { attendanceService } from '../features/attendance/service';
import type { AttendanceDashboard, AttendanceMark, DateRangeProjection } from '../features/attendance/models';
import './AttendancePage.css';

const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const inAWeek = () => { const date = new Date(); date.setDate(date.getDate() + 7); return localDate(date); };
const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

export default function AttendancePage() {
  const [dashboard, setDashboard] = useState<AttendanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [whatIfSubject, setWhatIfSubject] = useState('');
  const [futurePresent, setFuturePresent] = useState(0);
  const [futureAbsent, setFutureAbsent] = useState(0);
  const [targetDrafts, setTargetDrafts] = useState<Record<string, number>>({});
  const [rangeFrom, setRangeFrom] = useState(localDate);
  const [rangeTo, setRangeTo] = useState(inAWeek);
  const [rangeAssumption, setRangeAssumption] = useState<'present' | 'absent'>('absent');
  const [projections, setProjections] = useState<DateRangeProjection[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await attendanceService.getDashboard();
      setDashboard(data);
      setWhatIfSubject((current) => current || data.subjects[0]?.subjectId || '');
      setTargetDrafts((current) => Object.fromEntries(data.subjects.map((subject) => [subject.subjectId, current[subject.subjectId] ?? subject.threshold])));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const mutate = async (work: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setMessage('');
    try { await work(); await refresh(); setMessage(success); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Operation failed.'); }
    finally { setBusy(false); }
  };

  const selected = dashboard?.subjects.find((subject) => subject.subjectId === whatIfSubject);
  const forecast = useMemo(() => selected ? attendanceService.forecastAttendance(selected.presentClasses, selected.totalClasses, futurePresent, futureAbsent, selected.threshold) : null, [selected, futurePresent, futureAbsent]);
  const records = dashboard?.records.filter((record) => !subjectFilter || record.subjectId === subjectFilter) ?? [];
  const subjectName = (id: string) => dashboard?.subjects.find((subject) => subject.subjectId === id)?.name ?? 'Unknown subject';

  const mark = (subjectId: string, status: AttendanceMark, timetableEntryId: string | null = null) =>
    mutate(() => attendanceService.markAttendance(subjectId, status, timetableEntryId), `Attendance marked ${status}.`);

  const runSimulation = async () => {
    setBusy(true); setError('');
    try { setProjections(await attendanceService.projectDateRange(rangeFrom, rangeTo, rangeAssumption)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Simulation failed.'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="attendance-loading">Loading attendance…</div>;
  if (!dashboard) return <div className="attendance-message error">{error || 'Attendance is unavailable.'}</div>;

  return <section className="attendance-page">
    <header><h1>Attendance Intelligence</h1><p>Record classes, test attendance decisions and plan recovery.</p></header>
    {message && <div className="attendance-message success" role="status">{message}</div>}
    {error && <div className="attendance-message error" role="alert">{error}</div>}

    <section className="attendance-summary" aria-label="Overall attendance">
      <div><strong>{dashboard.stats.totalClasses ? formatPercentage(dashboard.stats.overallPercentage) : 'Not available yet'}</strong><span>Count-weighted snapshot (not an official aggregate)</span></div>
      <div><strong>{dashboard.stats.totalPresent}/{dashboard.stats.totalClasses}</strong><span>Classes attended</span></div>
      <div><strong>{dashboard.stats.atRiskCount}</strong><span>Subjects at risk</span></div>
      <div><strong>{dashboard.stats.safeCount}</strong><span>Subjects with safe bunks</span></div>
    </section>

    <section className="attendance-panel"><h2>Today’s timetable</h2>
      {dashboard.todayLectures.length === 0 ? <p className="attendance-empty">No timetable entries today. Add them in <Link to="/academics">Academics</Link>.</p> : <div className="attendance-list">{dashboard.todayLectures.map((lecture) => <article key={lecture.id}><div><strong>{lecture.startTime}–{lecture.endTime} · {lecture.subjectName}</strong><p>Status: {lecture.attendanceStatus ?? 'Not marked'}</p></div><div className="attendance-actions"><button disabled={busy} onClick={() => void mark(lecture.subjectId, 'present', lecture.id)}>Attend</button><button disabled={busy} onClick={() => void mark(lecture.subjectId, 'absent', lecture.id)}>Miss</button><button disabled={busy} onClick={() => void mark(lecture.subjectId, 'cancelled', lecture.id)}>Cancelled</button></div></article>)}</div>}
    </section>

    <section><h2>Subjects</h2>
      {dashboard.subjects.length === 0 ? <p className="attendance-empty">Create subjects in <Link to="/academics">Academics</Link> before recording attendance.</p> : <div className="attendance-grid">{dashboard.subjects.map((subject) => <article key={subject.subjectId} className={`attendance-card ${subject.status}`} style={{ borderTopColor: subject.colour }}>
        <h3>{subject.name} <small>{subject.code}</small></h3>
        <strong className="attendance-percent">{subject.totalClasses ? formatPercentage(subject.percentage) : 'Not available yet'}</strong>
        {subject.totalClasses > 0 && <progress max="100" value={subject.percentage} aria-label={`${subject.name} attendance percentage`} />}
        <p>{subject.presentClasses}/{subject.totalClasses} attended · {subject.cancelledClasses} cancelled</p>
        <p>After attend: {formatPercentage(subject.afterAttending)} · After miss: {formatPercentage(subject.afterMissing)}</p>
        <p>Safe bunks: {subject.safeBunks} · Recovery: {subject.recoveryClasses ?? 'Not finite'}</p>
        <p className="attendance-recommendation">{attendanceService.getAttendanceRecommendation(subject)}</p>
        <div className="attendance-target"><label>Target <input type="number" min="1" max="100" value={targetDrafts[subject.subjectId] ?? subject.threshold} onChange={(event) => setTargetDrafts({ ...targetDrafts, [subject.subjectId]: Number(event.target.value) })} /></label><button disabled={busy} onClick={() => void mutate(() => attendanceService.setAttendanceTarget(subject.subjectId, targetDrafts[subject.subjectId] ?? subject.threshold), 'Attendance target updated.')}>Save target</button></div>
        <div className="attendance-actions"><button disabled={busy} onClick={() => void mark(subject.subjectId, 'present')}>Attend</button><button disabled={busy} onClick={() => void mark(subject.subjectId, 'absent')}>Miss</button></div>
      </article>)}</div>}
    </section>

    <div className="attendance-tools">
      <section className="attendance-panel"><h2>What-if calculator</h2>
        <div className="attendance-form"><label>Subject<select value={whatIfSubject} onChange={(event) => setWhatIfSubject(event.target.value)}><option value="">Select</option>{dashboard.subjects.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.name}</option>)}</select></label><label>Future attended<input type="number" min="0" value={futurePresent} onChange={(event) => setFuturePresent(Math.max(0, Number(event.target.value)))} /></label><label>Future missed<input type="number" min="0" value={futureAbsent} onChange={(event) => setFutureAbsent(Math.max(0, Number(event.target.value)))} /></label></div>
        {forecast ? <div className="attendance-result"><strong>{formatPercentage(forecast.percentage)}</strong><p>{forecast.presentClasses}/{forecast.totalClasses} attended · {forecast.safeBunks} safe bunks · Recovery {forecast.recoveryClasses ?? 'not finite'}</p></div> : <p className="attendance-empty">Select a subject.</p>}
      </section>

      <section className="attendance-panel"><h2>Date-range simulation</h2>
        <div className="attendance-form"><label>From<input type="date" value={rangeFrom} onChange={(event) => setRangeFrom(event.target.value)} /></label><label>To<input type="date" value={rangeTo} onChange={(event) => setRangeTo(event.target.value)} /></label><label>Assume<select value={rangeAssumption} onChange={(event) => setRangeAssumption(event.target.value as 'present' | 'absent')}><option value="absent">Miss scheduled classes</option><option value="present">Attend scheduled classes</option></select></label><button disabled={busy} onClick={() => void runSimulation()}>Simulate</button></div>
        {projections.length === 0 ? <p className="attendance-empty">Run a simulation for timetable-linked projections.</p> : <div className="attendance-list">{projections.map((item) => <article key={item.subjectId}><div><strong>{item.subjectName}: {formatPercentage(item.percentage)}</strong><p>{item.scheduledClasses} unrecorded scheduled classes · {item.status}</p></div></article>)}</div>}
      </section>
    </div>

    <section className="attendance-panel"><div className="attendance-history-header"><h2>Attendance history</h2><label>Subject<select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="">All subjects</option>{dashboard.subjects.map((subject) => <option key={subject.subjectId} value={subject.subjectId}>{subject.name}</option>)}</select></label></div>
      {records.length === 0 ? <p className="attendance-empty">No attendance history yet.</p> : <div className="attendance-list">{records.map((record) => <article key={record.id}><div><strong>{subjectName(record.subjectId)}</strong><p>{record.date}{record.timetableEntryId ? ' · Timetable linked' : ' · Manual'}</p></div><div className="attendance-actions"><select aria-label={`Status for ${subjectName(record.subjectId)} on ${record.date}`} value={record.status} onChange={(event) => void mutate(() => attendanceService.updateRecord(record.id, { status: event.target.value as AttendanceMark }), 'Attendance history updated.')}><option value="present">Present</option><option value="absent">Absent</option><option value="cancelled">Cancelled</option></select><button className="danger" disabled={busy} onClick={() => { if (window.confirm('Delete this attendance record?')) void mutate(() => attendanceService.deleteRecord(record.id), 'Attendance record deleted.'); }}>Delete</button></div></article>)}</div>}
    </section>
  </section>;
}

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { createAssignment } from '../services/assignmentService';
import { askDashboardQuestion, completeDashboardAction, quickAttendanceUpdate } from '../services/dashboardService';
import './Dashboard.css';

const dateInputValue = () => new Date().toLocaleDateString('en-CA');
const displayDate = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'No deadline';

const Dashboard = () => {
  const { data, error, loading, refresh } = useDashboard();
  const [assignment, setAssignment] = useState({ title: '', subject: '', dueAt: '' });
  const [attendance, setAttendance] = useState<{ subject: string; date: string; status: 'present' | 'absent' }>({ subject: '', date: dateInputValue(), status: 'present' });
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setMessage('');
    try { await action(); setMessage(success); await refresh(); }
    catch (value) { setMessage(value instanceof Error ? value.message : 'Could not save your update.'); }
    finally { setBusy(false); }
  };

  const submitAssignment = (event: FormEvent) => {
    event.preventDefault();
    if (!assignment.title.trim() || !assignment.dueAt) return setMessage('Assignment title and due date are required.');
    void run(async () => {
      await createAssignment({ title: assignment.title.trim(), subject: assignment.subject.trim() || undefined, dueAt: new Date(assignment.dueAt).toISOString() });
      setAssignment({ title: '', subject: '', dueAt: '' });
    }, 'Assignment added.');
  };

  const submitAttendance = (event: FormEvent) => {
    event.preventDefault();
    if (!attendance.subject) return setMessage('Choose a subject first.');
    void run(() => quickAttendanceUpdate(attendance), 'Attendance updated.');
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    void run(async () => {
      const result = await askDashboardQuestion(question.trim());
      setAnswer(result.answer ?? 'No recommendation is available yet.');
    }, 'CampusFlow has answered your question.');
  };

  const completeNextAction = () => {
    if (!data?.nextBestAction || !window.confirm(`Complete “${data.nextBestAction.title}”?`)) return;
    void run(() => completeDashboardAction(data.nextBestAction!), 'Action completed. Student State recalculated.');
  };

  if (loading) return <div className="dashboard"><div className="loading">Loading your dashboard...</div></div>;
  if (!data) return <div className="dashboard"><p className="dashboard-error">{error || 'Could not load dashboard data.'}</p><button onClick={() => void refresh()}>Try again</button></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div><h1>Today Command Center</h1><p>{data.student.currentDate} · {data.studentState.data_freshness} · {data.studentState.state_version}</p></div>
        <button onClick={() => void refresh()} disabled={busy}>Refresh</button>
      </div>
      {(error || message) && <p className={error ? 'dashboard-error' : 'dashboard-message'}>{error || message}</p>}

      <div className="dashboard-grid">
        <div className="dashboard-card command-card">
          <div className="card-header"><h3>Next Best Action</h3><span className={`risk risk-${data.academicRisk.level}`}>{data.academicRisk.level}</span></div>
          <div className="card-content">
            {data.nextBestAction ? <>
              <h2>{data.nextBestAction.title}</h2><p>{data.nextBestAction.explanation || data.nextBestAction.reason}</p>
              <div className="command-actions"><button disabled={busy} onClick={completeNextAction}>{data.nextBestAction.type === 'attendance' ? 'Mark present' : 'Complete action'}</button><Link to={data.nextBestAction.targetRoute}>Open details</Link></div>
              {data.why && <details><summary>Why am I seeing this?</summary><p><strong>Facts:</strong> {data.why.facts.join(' ')}</p><p><strong>Inference:</strong> {data.why.inferences.join(' ')}</p><small>Confidence: {data.why.confidence} · Sources: {data.why.sourceIds.join(', ')}</small></details>}
            </> : <p className="empty-state">No urgent action. Keep your records up to date.</p>}
          </div>
        </div>

        <div className="dashboard-card command-card">
          <div className="card-header"><h3>Attendance Today</h3><Link to="/attendance" className="card-link">View details →</Link></div>
          <div className="card-content">
            {data.attendanceToday ? <>
              <h2>{data.attendanceToday.subject} · {data.attendanceToday.startTime}</h2>
              <p className="metric">{data.attendanceToday.currentPercentage === null ? 'Not available yet' : `${data.attendanceToday.currentPercentage.toFixed(2)}%`}</p>
              <p>Attend: {data.attendanceToday.afterAttending?.toFixed(2) ?? '—'}% · Miss: {data.attendanceToday.afterMissing?.toFixed(2) ?? '—'}%</p>
              <p><strong>{data.attendanceToday.status}</strong> · {data.attendanceToday.reason}</p>
              <small>Official threshold: {data.attendanceToday.officialThreshold ?? 'unknown'}% · Safety target: {data.attendanceToday.safetyTarget ?? 'unknown'}%</small>
            </> : <p className="empty-state">No upcoming countable lecture or not enough attendance data.</p>}
            <form className="inline-form" onSubmit={submitAttendance}>
              <select aria-label="Attendance subject" value={attendance.subject} onChange={(event) => setAttendance({ ...attendance, subject: event.target.value })}><option value="">Quick attendance update</option>{data.attendance.subjects.map((subject) => <option key={subject.id} value={subject.subject}>{subject.subject}</option>)}</select>
              <select aria-label="Attendance status" value={attendance.status} onChange={(event) => setAttendance({ ...attendance, status: event.target.value as 'present' | 'absent' })}><option value="present">Present</option><option value="absent">Absent</option></select>
              <input aria-label="Attendance date" type="date" value={attendance.date} onChange={(event) => setAttendance({ ...attendance, date: event.target.value })} />
              <button disabled={busy}>Save</button>
            </form>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Today’s lectures</h3>
            <Link to="/timetable" className="card-link">View All →</Link>
          </div>
          <div className="card-content">
            <p><strong>Capacity:</strong> {data.capacity.requiredMinutes} required / {data.capacity.availableMinutes} available minutes ({data.capacity.surplusMinutes >= 0 ? 'surplus' : 'deficit'} {Math.abs(data.capacity.surplusMinutes)}).</p>
            {data.capacity.conflicts.map((conflict) => <p className="dashboard-error" key={conflict}>{conflict}</p>)}
            {data.todayLectures.length === 0 ? (
              <p className="empty-state">No lectures today.</p>
            ) : (
              <div className="schedule-list">
                {data.todayLectures.map((entry) => (
                  <div key={entry.id} className="schedule-item">
                    <div className="schedule-time">{entry.startTime}–{entry.endTime}</div>
                    <div className="schedule-details">
                      <div className="schedule-subject">{entry.subject}</div>
                      <div className="schedule-meta">{entry.status}{entry.location ? ` · ${entry.location}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Pending assignments</h3>
            <Link to="/academics" className="card-link">View All →</Link>
          </div>
          <div className="card-content">
            {data.assignments.pending.length === 0 ? (
              <p className="empty-state">No pending assignments.</p>
            ) : (
              <div className="todo-list">
                {data.assignments.pending.slice(0, 5).map((item) => <Link key={item.id} to={item.targetRoute} className="todo-item"><span className="todo-title">{item.title}</span><small>{displayDate(item.deadline)}</small></Link>)}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Upcoming examinations</h3>
            <Link to="/academics" className="card-link">View All →</Link>
          </div>
          <div className="card-content">
            {data.upcomingExams.length === 0 ? (
              <p className="empty-state">No upcoming examinations.</p>
            ) : (
              <div className="todo-list">{data.upcomingExams.slice(0, 4).map((exam) => <Link key={exam.id} to="/academics" className="todo-item"><span className="todo-title">{exam.title}{exam.subject ? ` · ${exam.subject}` : ''}</span><small>{exam.daysRemaining} day{exam.daysRemaining === 1 ? '' : 's'} left</small></Link>)}</div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header"><h3>Tasks and weekly progress</h3><Link to="/todos" className="card-link">View All →</Link></div>
          <div className="card-content">
            {data.assignments.overdueCount > 0 && <p className="dashboard-error">{data.assignments.overdueCount} assignment{data.assignments.overdueCount === 1 ? '' : 's'} overdue.</p>}
            {data.studyTasks.overdue.length > 0 && <p className="dashboard-error">{data.studyTasks.overdue.length} study task{data.studyTasks.overdue.length === 1 ? '' : 's'} overdue.</p>}
            <p>{data.weeklyProgress.completedTasks} of {data.weeklyProgress.totalTasks} tasks completed this week ({data.weeklyProgress.percentage}%).</p>
            <progress value={data.weeklyProgress.percentage} max="100">{data.weeklyProgress.percentage}%</progress>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header"><h3>Important notices</h3><Link to="/notices" className="card-link">View All →</Link></div>
          <div className="card-content">{data.importantNotices.length === 0 ? <p className="empty-state">No important notices.</p> : <div className="todo-list">{data.importantNotices.map((notice) => <Link key={notice.id} to={notice.targetRoute} className="todo-item"><span className="todo-title">{notice.title}</span><small>{notice.importance}</small></Link>)}</div>}</div>
        </div>

        <div className="dashboard-card">
          <div className="card-header"><h3>Quick-add assignment</h3><Link to="/academics" className="card-link">Open academics →</Link></div>
          <form className="dashboard-form" onSubmit={submitAssignment}>
            <input placeholder="Assignment title" value={assignment.title} onChange={(event) => setAssignment({ ...assignment, title: event.target.value })} />
            <input placeholder="Subject (optional)" value={assignment.subject} onChange={(event) => setAssignment({ ...assignment, subject: event.target.value })} />
            <input aria-label="Assignment due date" type="datetime-local" value={assignment.dueAt} onChange={(event) => setAssignment({ ...assignment, dueAt: event.target.value })} />
            <button disabled={busy}>Add assignment</button>
          </form>
        </div>

        <div className="dashboard-card">
          <div className="card-header"><h3>Ask CampusFlow</h3><Link to="/assistant" className="card-link">Open assistant →</Link></div>
          <form className="dashboard-form" onSubmit={submitQuestion}>
            <input placeholder="What should I do next?" value={question} onChange={(event) => setQuestion(event.target.value)} />
            <button disabled={busy}>Ask</button>
          </form>
          {answer && <p className="assistant-answer">{answer}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

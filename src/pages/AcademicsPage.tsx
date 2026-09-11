import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Assignment, AssignmentInput, Examination, ExaminationInput, Note, NoteInput,
  Subject, SubjectInput, TimetableEntry, TimetableEntryInput,
} from '../features/academics/models';
import { academicsService, deleteNoteFile, getNoteFileUrl, sendNoteToStudyAI, uploadNoteFile } from '../features/academics/service';
import { DAYS, formatDateTime, getAssignmentStatus, getDeadlineWarning, getExamDaysRemaining, getExamPriority, getTodayName, hasTimetableConflict } from '../features/academics/utils';
import { validateAssignment, validateExamination, validateNote, validateSubject, validateTimetableEntry, type ValidationErrors } from '../features/academics/validations';
import './AcademicsPage.css';

type Tab = 'Subjects' | 'Assignments' | 'Timetable' | 'Examinations' | 'Notes';
const TABS: Tab[] = ['Subjects', 'Assignments', 'Timetable', 'Examinations', 'Notes'];
const emptySubject = (): SubjectInput => ({ name: '', code: '', facultyName: '', credits: 3, difficulty: 'Medium', strengthLevel: 'Average', attendanceTarget: 75, colour: '#4a9eff' });
const emptyAssignment = (): AssignmentInput => ({ subjectId: '', title: '', description: '', deadline: '', estimatedMinutes: 60, difficulty: 'Medium', priority: 'Medium' });
const emptyLecture = (): TimetableEntryInput => ({ subjectId: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', facultyName: '', classroom: '', onlineLink: '', lectureType: 'Lecture' });
const emptyExam = (): ExaminationInput => ({ subjectId: '', name: '', examinationType: 'Exam', examDate: '', topics: '', room: '', preparationProgress: 0, studyPlanId: null });
const emptyNote = (): NoteInput => ({ subjectId: '', title: '', noteType: 'text', textContent: '', fileName: null, fileType: null, fileSize: null, filePath: null, isPinned: false });

function ErrorList({ errors }: { errors: ValidationErrors }) {
  const values = Object.values(errors);
  return values.length ? <div className="academic-errors" role="alert">{values.map((error) => <div key={error}>{error}</div>)}</div> : null;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="academic-empty">{children}</p>;
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete?: () => void }) {
  return <div className="academic-actions"><button type="button" onClick={onEdit}>Edit</button>{onDelete && <button type="button" className="danger" onClick={onDelete}>Delete</button>}</div>;
}

export default function AcademicsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Subjects');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [operationError, setOperationError] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lectures, setLectures] = useState<TimetableEntry[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);
  const [lectureForm, setLectureForm] = useState(emptyLecture);
  const [examForm, setExamForm] = useState(emptyExam);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editingLecture, setEditingLecture] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentSubject, setAssignmentSubject] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState('');
  const [assignmentStatus, setAssignmentStatus] = useState('');
  const [assignmentSort, setAssignmentSort] = useState('deadline');
  const [noteSearch, setNoteSearch] = useState('');

  const load = async () => {
    const [nextSubjects, nextAssignments, nextLectures, nextExams, nextNotes] = await Promise.all([
      academicsService.getSubjects(), academicsService.getAssignments(), academicsService.getTimetableEntries(), academicsService.getExaminations(), academicsService.getNotes(),
    ]);
    setSubjects(nextSubjects); setAssignments(nextAssignments); setLectures(nextLectures); setExams(nextExams); setNotes(nextNotes);
  };

  useEffect(() => {
    load().catch((error: unknown) => setOperationError(error instanceof Error ? error.message : 'Could not load academic records.')).finally(() => setLoading(false));
  }, []);

  const mutate = async (work: () => Promise<unknown>, success: string) => {
    setSaving(true); setMessage(''); setOperationError('');
    try { await work(); await load(); setMessage(success); return true; }
    catch (error) { setOperationError(error instanceof Error ? error.message : 'Operation failed.'); return false; }
    finally { setSaving(false); }
  };

  const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name ?? 'Unknown subject';
  const difficultyFor = (id: string) => subjects.find((subject) => subject.id === id)?.difficulty ?? 'Medium';

  const filteredAssignments = useMemo(() => assignments
    .filter((item) => item.title.toLowerCase().includes(assignmentSearch.toLowerCase()))
    .filter((item) => !assignmentSubject || item.subjectId === assignmentSubject)
    .filter((item) => !assignmentPriority || item.priority === assignmentPriority)
    .filter((item) => !assignmentStatus || getAssignmentStatus(item) === assignmentStatus)
    .sort((a, b) => assignmentSort === 'priority'
      ? ['High', 'Medium', 'Low'].indexOf(a.priority) - ['High', 'Medium', 'Low'].indexOf(b.priority)
      : assignmentSort === 'createdAt' ? b.createdAt.localeCompare(a.createdAt) : a.deadline.localeCompare(b.deadline)),
  [assignments, assignmentSearch, assignmentSubject, assignmentPriority, assignmentStatus, assignmentSort]);

  const filteredNotes = notes
    .filter((note) => `${note.title} ${subjectName(note.subjectId)}`.toLowerCase().includes(noteSearch.toLowerCase()))
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt.localeCompare(a.updatedAt));
  const todayLectures = lectures.filter((item) => item.dayOfWeek === getTodayName()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const currentTime = new Date().toTimeString().slice(0, 5);
  const upcomingLectureId = todayLectures.find((item) => item.endTime >= currentTime)?.id;

  const submitSubject = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateSubject(subjectForm, subjects, editingSubject ?? undefined); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const ok = await mutate(() => editingSubject ? academicsService.updateSubject(editingSubject, subjectForm) : academicsService.createSubject(subjectForm), editingSubject ? 'Subject updated.' : 'Subject created.');
    if (ok) { setSubjectForm(emptySubject()); setEditingSubject(null); }
  };

  const submitAssignment = async (event: FormEvent) => {
    event.preventDefault();
    const next: AssignmentInput = { ...assignmentForm, attachment: assignmentFile ? { fileName: assignmentFile.name, fileType: assignmentFile.type, fileSize: assignmentFile.size, filePath: `metadata:${assignmentFile.name}` } : assignmentForm.attachment };
    const nextErrors = validateAssignment(next); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const ok = await mutate(() => editingAssignment ? academicsService.updateAssignment(editingAssignment, next) : academicsService.createAssignment(next), editingAssignment ? 'Assignment updated.' : 'Assignment created.');
    if (ok) { setAssignmentForm(emptyAssignment()); setEditingAssignment(null); setAssignmentFile(null); }
  };

  const saveLecture = async (input: TimetableEntryInput, currentId: string | null, allowConflict = false) => {
    const candidate = { ...input, id: currentId ?? '', createdAt: '', updatedAt: '' };
    if (!allowConflict && hasTimetableConflict(candidate, lectures) && !window.confirm('This lecture conflicts with another lecture. Save it anyway?')) return false;
    return mutate(() => currentId ? academicsService.updateTimetableEntry(currentId, input) : academicsService.createTimetableEntry(input), currentId ? 'Lecture updated.' : 'Lecture created.');
  };

  const submitLecture = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateTimetableEntry(lectureForm); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (await saveLecture(lectureForm, editingLecture)) { setLectureForm(emptyLecture()); setEditingLecture(null); }
  };

  const submitExam = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateExamination(examForm); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const ok = await mutate(() => editingExam ? academicsService.updateExamination(editingExam, examForm) : academicsService.createExamination(examForm), editingExam ? 'Examination updated.' : 'Examination created.');
    if (ok) { setExamForm(emptyExam()); setEditingExam(null); }
  };

  const submitNote = async (event: FormEvent) => {
    event.preventDefault();
    let next = noteForm;
    try {
      if (noteForm.noteType === 'file' && noteFile) next = { ...noteForm, ...await uploadNoteFile(noteFile), textContent: '' };
    } catch (error) { setErrors({ file: error instanceof Error ? error.message : 'Upload failed.' }); return; }
    const nextErrors = validateNote(next); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const ok = await mutate(() => editingNote ? academicsService.updateNote(editingNote, next) : academicsService.createNote(next), editingNote ? 'Note updated.' : 'Note created.');
    if (ok) { setNoteForm(emptyNote()); setEditingNote(null); setNoteFile(null); }
  };

  const importTimetable = async (file: File) => {
    try {
      const text = await file.text();
      // ponytail: simple CSV rows; use a parser if quoted commas or multiline fields become required.
      const rows = file.name.toLowerCase().endsWith('.json') ? JSON.parse(text) as TimetableEntryInput[] : (() => {
        const [header, ...lines] = text.trim().split(/\r?\n/); const keys = header.split(',').map((key) => key.trim());
        return lines.map((line) => Object.fromEntries(line.split(',').map((value, index) => [keys[index], value.trim()]))) as unknown as TimetableEntryInput[];
      })();
      if (!Array.isArray(rows) || !rows.length) throw new Error('The import file has no rows.');
      let accepted = 0;
      const importedLectures = [...lectures];
      for (const row of rows) {
        const nextErrors = validateTimetableEntry(row);
        if (Object.keys(nextErrors).length || !DAYS.includes(row.dayOfWeek) || !subjects.some((subject) => subject.id === row.subjectId)) throw new Error(`Invalid timetable row ${accepted + 1}.`);
        const candidate = { ...row, id: '', createdAt: '', updatedAt: '' };
        if (hasTimetableConflict(candidate, importedLectures) && !window.confirm(`Imported ${row.dayOfWeek} ${row.startTime} conflicts. Add it anyway?`)) continue;
        const created = await academicsService.createTimetableEntry(row); importedLectures.push(created); accepted += 1;
      }
      await load(); setMessage(`${accepted} timetable entries imported.`);
    } catch (error) { setOperationError(error instanceof Error ? error.message : 'Import failed.'); }
  };

  const previewNote = async (note: Note) => {
    if (!note.filePath) return;
    const url = await getNoteFileUrl(note.filePath);
    if (url) window.open(url, '_blank', 'noopener,noreferrer'); else setOperationError('Preview expired after refresh. Upload the file again to create a new session URL.');
  };

  if (loading) return <div className="academic-loading">Loading academic records…</div>;

  return <section className="academics-page">
    <header><h1>Academic Management</h1><p>Manage subjects, work, schedules, exams and study notes.</p></header>
    <div className="academic-tabs" role="tablist" aria-label="Academic sections">
      {TABS.map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); setErrors({}); }}>{item}</button>)}
    </div>
    {message && <div className="academic-message success" role="status">{message}</div>}
    {operationError && <div className="academic-message error" role="alert">{operationError}</div>}

    {tab === 'Subjects' && <div role="tabpanel" className="academic-section">
      <form className="academic-form" onSubmit={submitSubject}><h2>{editingSubject ? 'Edit subject' : 'Add subject'}</h2><ErrorList errors={errors} />
        <div className="academic-form-grid">
          <label>Name<input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} /></label>
          <label>Unique code<input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} /></label>
          <label>Faculty<input value={subjectForm.facultyName} onChange={(e) => setSubjectForm({ ...subjectForm, facultyName: e.target.value })} /></label>
          <label>Credits<input type="number" min="0" step="0.5" value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} /></label>
          <label>Difficulty<select value={subjectForm.difficulty} onChange={(e) => setSubjectForm({ ...subjectForm, difficulty: e.target.value as SubjectInput['difficulty'] })}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
          <label>Strength<select value={subjectForm.strengthLevel} onChange={(e) => setSubjectForm({ ...subjectForm, strengthLevel: e.target.value as SubjectInput['strengthLevel'] })}><option>Strong</option><option>Average</option><option>Weak</option></select></label>
          <label>Attendance target<input type="number" min="1" max="100" value={subjectForm.attendanceTarget} onChange={(e) => setSubjectForm({ ...subjectForm, attendanceTarget: Number(e.target.value) })} /></label>
          <label>Colour<input type="color" value={subjectForm.colour} onChange={(e) => setSubjectForm({ ...subjectForm, colour: e.target.value })} /></label>
        </div><div className="academic-form-actions"><button disabled={saving}>{editingSubject ? 'Save' : 'Add subject'}</button>{editingSubject && <button type="button" onClick={() => { setEditingSubject(null); setSubjectForm(emptySubject()); }}>Cancel</button>}</div>
      </form>
      <div className="academic-list">{subjects.length === 0 ? <Empty>No subjects yet.</Empty> : subjects.map((subject) => <article key={subject.id} style={{ borderLeftColor: subject.colour }}><h3>{subject.name} <small>{subject.code}</small></h3><p>{subject.facultyName} · {subject.credits} credits · {subject.difficulty} · {subject.strengthLevel}</p><p>Attendance target: {subject.attendanceTarget}% · {assignments.filter((item) => item.subjectId === subject.id).length} assignments · {notes.filter((item) => item.subjectId === subject.id).length} notes</p><Actions onEdit={() => { setEditingSubject(subject.id); setSubjectForm(subject); }} onDelete={() => { if (window.confirm(`Delete ${subject.name}?`)) void mutate(() => academicsService.deleteSubject(subject.id), 'Subject deleted.'); }} /></article>)}</div>
    </div>}

    {tab === 'Assignments' && <div role="tabpanel" className="academic-section">
      <form className="academic-form" onSubmit={submitAssignment}><h2>{editingAssignment ? 'Edit assignment' : 'Add assignment'}</h2><ErrorList errors={errors} />
        <div className="academic-form-grid">
          <label>Title<input value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} /></label>
          <label>Subject<select value={assignmentForm.subjectId} onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}><option value="">Select</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="wide">Description<textarea value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} /></label>
          <label>Deadline<input type="datetime-local" value={assignmentForm.deadline} onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })} /></label>
          <label>Estimated minutes<input type="number" min="1" value={assignmentForm.estimatedMinutes} onChange={(e) => setAssignmentForm({ ...assignmentForm, estimatedMinutes: Number(e.target.value) })} /></label>
          <label>Difficulty<select value={assignmentForm.difficulty} onChange={(e) => setAssignmentForm({ ...assignmentForm, difficulty: e.target.value as AssignmentInput['difficulty'] })}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
          <label>Priority<select value={assignmentForm.priority} onChange={(e) => setAssignmentForm({ ...assignmentForm, priority: e.target.value as AssignmentInput['priority'] })}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label>Attachment metadata<input type="file" onChange={(e) => setAssignmentFile(e.target.files?.[0] ?? null)} /></label>
        </div><div className="academic-form-actions"><button disabled={saving}>{editingAssignment ? 'Save' : 'Add assignment'}</button>{editingAssignment && <button type="button" onClick={() => { setEditingAssignment(null); setAssignmentForm(emptyAssignment()); }}>Cancel</button>}</div>
      </form>
      <div className="academic-filters"><input aria-label="Search assignments" placeholder="Search title" value={assignmentSearch} onChange={(e) => setAssignmentSearch(e.target.value)} /><select aria-label="Filter by subject" value={assignmentSubject} onChange={(e) => setAssignmentSubject(e.target.value)}><option value="">All subjects</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Filter by priority" value={assignmentPriority} onChange={(e) => setAssignmentPriority(e.target.value)}><option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select><select aria-label="Filter by status" value={assignmentStatus} onChange={(e) => setAssignmentStatus(e.target.value)}><option value="">All statuses</option><option>Pending</option><option>Overdue</option><option>Completed</option></select><select aria-label="Sort assignments" value={assignmentSort} onChange={(e) => setAssignmentSort(e.target.value)}><option value="deadline">Deadline</option><option value="priority">Priority</option><option value="createdAt">Creation date</option></select></div>
      <div className="academic-list">{filteredAssignments.length === 0 ? <Empty>No matching assignments.</Empty> : filteredAssignments.map((item) => { const status = getAssignmentStatus(item); const warning = getDeadlineWarning(item); return <article key={item.id}><h3>{item.title}</h3><p>{subjectName(item.subjectId)} · {item.priority} priority · {item.difficulty} · {item.estimatedMinutes} min</p><p>{item.description || 'No description'} · Due {formatDateTime(item.deadline)}</p><p><span className={`badge ${status.toLowerCase()}`}>{status}</span>{warning && <span className="badge warning">{warning}</span>}{item.attachment && <span className="badge">{item.attachment.fileName}</span>}</p><div className="academic-actions"><button type="button" onClick={() => { setEditingAssignment(item.id); setAssignmentForm(item); }}>Edit</button>{!item.completedAt && <button type="button" onClick={() => void mutate(() => academicsService.completeAssignment(item.id), 'Assignment completed.')}>Mark completed</button>}</div></article>; })}</div>
    </div>}

    {tab === 'Timetable' && <div role="tabpanel" className="academic-section">
      <form className="academic-form" onSubmit={submitLecture}><h2>{editingLecture ? 'Edit lecture' : 'Add lecture'}</h2><ErrorList errors={errors} />
        <div className="academic-form-grid">
          <label>Subject<select value={lectureForm.subjectId} onChange={(e) => setLectureForm({ ...lectureForm, subjectId: e.target.value })}><option value="">Select</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Day<select value={lectureForm.dayOfWeek} onChange={(e) => setLectureForm({ ...lectureForm, dayOfWeek: e.target.value as TimetableEntryInput['dayOfWeek'] })}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></label>
          <label>Start<input type="time" value={lectureForm.startTime} onChange={(e) => setLectureForm({ ...lectureForm, startTime: e.target.value })} /></label><label>End<input type="time" value={lectureForm.endTime} onChange={(e) => setLectureForm({ ...lectureForm, endTime: e.target.value })} /></label>
          <label>Faculty<input value={lectureForm.facultyName} onChange={(e) => setLectureForm({ ...lectureForm, facultyName: e.target.value })} /></label><label>Classroom<input value={lectureForm.classroom} onChange={(e) => setLectureForm({ ...lectureForm, classroom: e.target.value })} /></label>
          <label>Online meeting link<input type="url" value={lectureForm.onlineLink} onChange={(e) => setLectureForm({ ...lectureForm, onlineLink: e.target.value })} /></label><label>Lecture type<input value={lectureForm.lectureType} onChange={(e) => setLectureForm({ ...lectureForm, lectureType: e.target.value })} /></label>
        </div><div className="academic-form-actions"><button disabled={saving}>{editingLecture ? 'Save' : 'Add lecture'}</button>{editingLecture && <button type="button" onClick={() => { setEditingLecture(null); setLectureForm(emptyLecture()); }}>Cancel</button>}<label className="file-button">Import JSON/CSV<input type="file" accept=".json,.csv" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importTimetable(file); }} /></label></div>
      </form>
      <h2>Today’s schedule</h2><div className="academic-list compact">{todayLectures.length === 0 ? <Empty>No lectures today.</Empty> : todayLectures.map((item) => <article key={item.id}><strong>{item.startTime}–{item.endTime} {subjectName(item.subjectId)}</strong>{item.id === upcomingLectureId && <span className="badge">Upcoming</span>}</article>)}</div>
      <h2>Weekly timetable</h2><div className="academic-week">{DAYS.map((day) => <section key={day}><h3>{day}</h3>{lectures.filter((item) => item.dayOfWeek === day).length === 0 ? <Empty>No lectures.</Empty> : lectures.filter((item) => item.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((item) => <article key={item.id}><strong>{item.startTime}–{item.endTime}</strong><p>{subjectName(item.subjectId)} · {item.lectureType}</p><p>{item.facultyName || 'Faculty not set'} · {item.classroom || 'Room not set'} {item.onlineLink && <>· <a href={item.onlineLink} target="_blank" rel="noreferrer">Join</a></>}</p><Actions onEdit={() => { setEditingLecture(item.id); setLectureForm(item); }} onDelete={() => { if (window.confirm('Delete this lecture?')) void mutate(() => academicsService.deleteTimetableEntry(item.id), 'Lecture deleted.'); }} /></article>)}</section>)}</div>
    </div>}

    {tab === 'Examinations' && <div role="tabpanel" className="academic-section">
      <form className="academic-form" onSubmit={submitExam}><h2>{editingExam ? 'Edit examination' : 'Add examination'}</h2><ErrorList errors={errors} />
        <div className="academic-form-grid"><label>Name<input value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} /></label><label>Subject<select value={examForm.subjectId} onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}><option value="">Select</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Date and time<input type="datetime-local" value={examForm.examDate} onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })} /></label><label>Type<input value={examForm.examinationType} onChange={(e) => setExamForm({ ...examForm, examinationType: e.target.value })} /></label><label className="wide">Syllabus/topics<textarea value={examForm.topics} onChange={(e) => setExamForm({ ...examForm, topics: e.target.value })} /></label><label>Room<input value={examForm.room} onChange={(e) => setExamForm({ ...examForm, room: e.target.value })} /></label><label>Preparation progress ({examForm.preparationProgress}%)<input type="range" min="0" max="100" value={examForm.preparationProgress} onChange={(e) => setExamForm({ ...examForm, preparationProgress: Number(e.target.value) })} /></label><label>Future study plan ID<input value={examForm.studyPlanId ?? ''} onChange={(e) => setExamForm({ ...examForm, studyPlanId: e.target.value || null })} /></label></div>
        <div className="academic-form-actions"><button disabled={saving}>{editingExam ? 'Save' : 'Add examination'}</button>{editingExam && <button type="button" onClick={() => { setEditingExam(null); setExamForm(emptyExam()); }}>Cancel</button>}</div>
      </form>
      <div className="academic-list">{exams.length === 0 ? <Empty>No examinations yet.</Empty> : [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate)).map((exam) => { const days = getExamDaysRemaining(exam.examDate); const priority = getExamPriority(exam, difficultyFor(exam.subjectId)); return <article key={exam.id}><h3>{exam.name}</h3><p>{subjectName(exam.subjectId)} · {exam.examinationType} · {formatDateTime(exam.examDate)} · {exam.room || 'Room not set'}</p><p>{days < 0 ? `${Math.abs(days)} days ago` : `${days} days remaining`} · Preparation {exam.preparationProgress}% · <span className={`badge ${priority.toLowerCase()}`}>{priority} priority</span></p><p>{exam.topics || 'No topics added'}{exam.studyPlanId && ` · Study plan ${exam.studyPlanId}`}</p><Actions onEdit={() => { setEditingExam(exam.id); setExamForm(exam); }} /></article>; })}</div>
    </div>}

    {tab === 'Notes' && <div role="tabpanel" className="academic-section">
      <form className="academic-form" onSubmit={submitNote}><h2>{editingNote ? 'Edit note' : 'Add note'}</h2><ErrorList errors={errors} />
        <div className="academic-form-grid"><label>Title<input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} /></label><label>Subject<select value={noteForm.subjectId} onChange={(e) => setNoteForm({ ...noteForm, subjectId: e.target.value })}><option value="">Select</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Type<select value={noteForm.noteType} onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value as NoteInput['noteType'] })}><option value="text">Text note</option><option value="file">File</option></select></label>{noteForm.noteType === 'text' ? <label className="wide">Text<textarea value={noteForm.textContent} onChange={(e) => setNoteForm({ ...noteForm, textContent: e.target.value })} /></label> : <label>PDF, DOCX, TXT, Markdown or image (max 10 MB)<input type="file" accept=".pdf,.docx,.txt,.md,image/*" onChange={(e) => setNoteFile(e.target.files?.[0] ?? null)} /></label>}<label className="check"><input type="checkbox" checked={noteForm.isPinned} onChange={(e) => setNoteForm({ ...noteForm, isPinned: e.target.checked })} /> Pin note</label></div>
        <div className="academic-form-actions"><button disabled={saving}>{editingNote ? 'Save' : 'Add note'}</button>{editingNote && <button type="button" onClick={() => { setEditingNote(null); setNoteForm(emptyNote()); }}>Cancel</button>}</div>
      </form>
      <div className="academic-filters"><input aria-label="Search notes" placeholder="Search title or subject" value={noteSearch} onChange={(e) => setNoteSearch(e.target.value)} /></div>
      <div className="academic-list">{filteredNotes.length === 0 ? <Empty>No matching notes.</Empty> : filteredNotes.map((note) => <article key={note.id}><h3>{note.isPinned && '📌 '}{note.title}</h3><p>{subjectName(note.subjectId)} · {note.noteType === 'file' ? `${note.fileName} (${Math.ceil((note.fileSize ?? 0) / 1024)} KB)` : note.textContent}</p><div className="academic-actions"><button type="button" onClick={() => { setEditingNote(note.id); setNoteForm(note); }}>Edit</button><button type="button" onClick={() => void mutate(() => academicsService.updateNote(note.id, { isPinned: !note.isPinned }), note.isPinned ? 'Note unpinned.' : 'Note pinned.')}>{note.isPinned ? 'Unpin' : 'Pin'}</button>{note.noteType === 'file' && <button type="button" onClick={() => void previewNote(note)}>Preview</button>}<button type="button" onClick={() => void sendNoteToStudyAI(note.id).then((result) => navigate(result.path))}>Send to Study AI</button><button type="button" className="danger" onClick={() => { if (window.confirm(`Delete ${note.title}?`)) void mutate(async () => { if (note.filePath) await deleteNoteFile(note.filePath); await academicsService.deleteNote(note.id); }, 'Note deleted.'); }}>Delete</button></div></article>)}</div>
    </div>}
  </section>;
}

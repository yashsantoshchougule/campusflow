import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import NoticeCamera from '../components/NoticeCamera';
import { editableValues, noticeService, type NoticeDashboard } from '../features/notices/service';
import type { EditableNoticeValues, NoticeCategory, NoticeField, StudentAcademicContext } from '../features/notices/models';
import './NoticesPage.css';

const CATEGORIES: NoticeCategory[] = ['General academic', 'Assignment', 'Examination', 'Fee', 'Scholarship', 'Event', 'ATKT', 'Other'];
const lines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);
const commas = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

function FieldEvidence({ field }: { field: NoticeField<unknown> }) {
  return <small className={`notice-field-meta ${field.confidence}`}>{field.confidence} confidence · {field.status.replaceAll('_', ' ')}{field.pageNumber ? ` · page ${field.pageNumber}` : ''}{field.sourceSnippet && <span>Source: “{field.sourceSnippet}”</span>}</small>;
}

function TextField({ label, field, value, onChange, multiline = false }: { label: string; field: NoticeField<unknown>; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return <label className="notice-field"><strong>{label}</strong>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}<FieldEvidence field={field} /></label>;
}

export default function NoticesPage() {
  const [data, setData] = useState<NoticeDashboard>({ sources: [], notices: [], history: [], links: [], context: { course: '', branch: '', year: '', semester: '', division: '', academicStatus: '', atktStatus: '' } });
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<EditableNoticeValues | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [atktId, setAtktId] = useState('');

  const selected = data.notices.find((notice) => notice.id === selectedId) ?? null;
  const source = selected ? data.sources.find((item) => item.id === selected.sourceId) ?? null : null;
  const sourceId = source?.id ?? '';
  const warnings = selected ? noticeService.warningsFor(selected) : [];
  const applicability = selected ? noticeService.applicabilityFor(selected, data.context) : null;
  const history = data.history.filter((entry) => entry.noticeId === selectedId);
  const links = data.links.filter((link) => link.noticeId === selectedId);

  const load = async (preferId?: string) => {
    const dashboard = await noticeService.dashboard(); setData(dashboard);
    setSelectedId((current) => preferId ?? (current || dashboard.notices[0]?.id || ''));
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (selected) setForm(editableValues(selected)); }, [selected]);
  useEffect(() => {
    if (!selected?.deadline.value || remindAt) return;
    const deadline = new Date(selected.deadline.value);
    if (!Number.isNaN(deadline.getTime())) setRemindAt(new Date(deadline.getTime() - 86400000).toISOString().slice(0, 16));
  }, [selected?.deadline.value, remindAt]);
  useEffect(() => {
    let active = true;
    let objectUrl = '';
    if (!sourceId) { setPreviewUrl(''); return; }
    void noticeService.sourceUrl(sourceId).then((url) => { objectUrl = url ?? ''; if (active) setPreviewUrl(objectUrl); else if (objectUrl) URL.revokeObjectURL(objectUrl); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [sourceId]);

  const run = async (work: () => Promise<void>) => { setBusy(true); setMessage(''); try { await work(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Operation failed.'); } finally { setBusy(false); } };
  const upload = (file: File, capture = false) => run(async () => {
    const result = await noticeService.uploadAndExtract(file, capture ? 'camera_capture' : file.type === 'application/pdf' ? 'pdf_upload' : 'image_upload');
    setCameraOpen(false); setSelectedId(result.draft.id); await load(result.draft.id);
    setMessage(result.duplicate ? 'This source was already uploaded; its existing notice was opened.' : result.extractionError ?? 'Notice extracted as a draft. Review and confirm it.');
  });
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; };

  const setContext = (key: keyof StudentAcademicContext, value: string) => setData((current) => ({ ...current, context: { ...current.context, [key]: value } }));
  const saveEdits = () => { if (!selected || !form) return; void run(async () => { const notice = await noticeService.edit(selected.id, form); await load(notice.id); setMessage('Manual edits saved as a new notice version.'); }); };
  const confirm = () => { if (!selected || !form || !window.confirm('Confirm that you reviewed the original notice and every extracted field?')) return; void run(async () => { const current = JSON.stringify(editableValues(selected)) === JSON.stringify(form) ? selected : await noticeService.edit(selected.id, form); const notice = await noticeService.confirm(current.id, true); await load(notice.id); setMessage('Notice confirmed. Actions are now available.'); }); };
  const action = (work: () => Promise<unknown>, success: string) => run(async () => { await work(); await load(selectedId); setMessage(success); });

  const originalSummary = useMemo(() => selected ? Object.entries(selected.originalExtraction).map(([key, field]) => `${key}: ${JSON.stringify(field.value)}`).join('\n') : '', [selected]);

  return <section className="notices-page">
    <header><h1>AI Notice Intelligence</h1><p>Upload or capture an academic notice, verify its evidence, and turn confirmed information into actions.</p></header>
    {message && <p className="notice-message" role="status">{message}</p>}

    <section className="notice-panel"><h2>Upload or capture</h2><div className="notice-actions"><label className="notice-upload">Select image or PDF<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={chooseFile} /></label><button type="button" onClick={() => setCameraOpen(true)}>Use camera</button></div><p>JPG, PNG, WebP or PDF · maximum 10 MB.</p></section>
    {cameraOpen && <NoticeCamera onCapture={(file) => void upload(file, true)} onClose={() => setCameraOpen(false)} />}

    <section className="notice-panel"><h2>Notice history</h2>{data.notices.length === 0 ? <p>No notices uploaded yet.</p> : <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{data.notices.map((notice) => <option key={notice.id} value={notice.id}>{notice.title.value ?? 'Untitled notice'} · v{notice.version} · {notice.status}</option>)}</select>}</section>

    {selected && form && source && <>
      <div className="notice-workspace">
        <section className="notice-panel notice-original"><h2>Original source</h2><dl><dt>File</dt><dd>{source.fileName}</dd><dt>Source</dt><dd>{source.sourceType.replaceAll('_', ' ')}</dd><dt>Uploaded</dt><dd>{new Date(source.createdAt).toLocaleString()}</dd><dt>Extracted</dt><dd>{source.extractedAt ? new Date(source.extractedAt).toLocaleString() : 'Not extracted'}</dd><dt>Hash</dt><dd><code>{source.fileHash}</code></dd><dt>Pages</dt><dd>{source.pageCount ?? 'Unknown'}</dd></dl>{previewUrl ? source.mimeType === 'application/pdf' ? <iframe src={previewUrl} title="Original notice PDF" /> : <img src={previewUrl} alt="Original uploaded notice" /> : <p>Original source preview is unavailable.</p>}<details><summary>Raw OCR text</summary><pre>{selected.rawText || 'No readable text was extracted.'}</pre></details></section>

        <section className="notice-panel"><h2>Extracted information</h2>
          <TextField label="Notice title" field={selected.title} value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <TextField label="Deadline" field={selected.deadline} value={form.deadline} onChange={(deadline) => setForm({ ...form, deadline })} />
          {selected.detectedDeadlines.length > 1 && <label className="notice-field"><strong>Select detected deadline</strong><select value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })}><option value="">Choose a date</option>{selected.detectedDeadlines.map((deadline) => <option key={deadline}>{deadline}</option>)}</select></label>}
          <TextField label="Instructions (one per line)" multiline field={selected.instructions} value={form.instructions.join('\n')} onChange={(value) => setForm({ ...form, instructions: lines(value) })} />
          <TextField label="Eligibility (one per line)" multiline field={selected.eligibility} value={form.eligibility.join('\n')} onChange={(value) => setForm({ ...form, eligibility: lines(value) })} />
          <TextField label="Required documents (one per line)" multiline field={selected.requiredDocuments} value={form.requiredDocuments.join('\n')} onChange={(value) => setForm({ ...form, requiredDocuments: lines(value) })} />
          <label className="notice-field"><strong>Category</strong><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as NoticeCategory })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select><FieldEvidence field={selected.category} /></label>
          <TextField label="Courses (comma separated)" field={selected.applicableCourses} value={form.applicableCourses.join(', ')} onChange={(value) => setForm({ ...form, applicableCourses: commas(value) })} />
          <TextField label="Branches" field={selected.applicableBranches} value={form.applicableBranches.join(', ')} onChange={(value) => setForm({ ...form, applicableBranches: commas(value) })} />
          <TextField label="Years" field={selected.applicableYears} value={form.applicableYears.join(', ')} onChange={(value) => setForm({ ...form, applicableYears: commas(value) })} />
          <TextField label="Semesters" field={selected.applicableSemesters} value={form.applicableSemesters.join(', ')} onChange={(value) => setForm({ ...form, applicableSemesters: commas(value) })} />
          <TextField label="Divisions" field={selected.applicableDivisions} value={form.applicableDivisions.join(', ')} onChange={(value) => setForm({ ...form, applicableDivisions: commas(value) })} />
          <details><summary>Immutable original extraction</summary><pre>{originalSummary}</pre></details>
          <div className="notice-actions"><button type="button" disabled={busy} onClick={saveEdits}>Save edits as new version</button><button type="button" disabled={busy || selected.status === 'confirmed'} onClick={confirm}>Confirm and save</button></div>
        </section>
      </div>

      <section className="notice-panel"><h2>Verification warnings</h2>{warnings.length === 0 ? <p>No unresolved extraction warnings.</p> : <ul>{warnings.map((warning) => <li key={warning.code}>{warning.message}</li>)}</ul>}{selected.detectedDeadlines.length > 1 && <p>Detected dates: {selected.detectedDeadlines.join(', ')}</p>}</section>

      <section className="notice-panel"><h2>Student applicability</h2><div className="notice-context">{Object.entries(data.context).map(([key, value]) => <label key={key}>{key.replace(/([A-Z])/g, ' $1')}<input value={value} onChange={(event) => setContext(key as keyof StudentAcademicContext, event.target.value)} /></label>)}</div><button type="button" onClick={() => void run(async () => { await noticeService.saveContext(data.context); setMessage('Student context saved locally.'); })}>Save student context</button>{applicability && <div className={`notice-applicability ${applicability.status}`}><strong>{applicability.status.replaceAll('_', ' ')}</strong>{applicability.reasons.map((reason) => <p key={reason}>{reason}</p>)}</div>}</section>

      <section className="notice-panel"><h2>Notice actions</h2>{selected.status !== 'confirmed' ? <p>Confirm the notice before creating linked actions.</p> : <><div className="notice-actions"><button type="button" onClick={() => action(() => noticeService.createTask(selected.id), 'Academic task linked.')}>Convert to academic task</button><label>Reminder time<input type="datetime-local" value={remindAt} onChange={(event) => setRemindAt(event.target.value)} /></label><button type="button" onClick={() => action(() => noticeService.createReminder(selected.id, remindAt), 'Reminder linked.')}>Create reminder</button><label>Existing ATKT application ID<input value={atktId} onChange={(event) => setAtktId(event.target.value)} /></label><button type="button" onClick={() => action(() => noticeService.linkAtkt(selected.id, atktId), 'ATKT context linked; approval status was not changed.')}>Link ATKT</button>{selected.deadline.value && <Link to="/calendar">View confirmed deadline in Calendar</Link>}</div>{links.map((link) => <article key={link.id}><strong>{link.type.replaceAll('_', ' ')}</strong> · {link.targetId} · {new Date(link.createdAt).toLocaleString()} <a href={link.type === 'reminder' ? '/todos' : '/academics'}>Open related item</a></article>)}</>}</section>

      <section className="notice-panel"><h2>Version and action history</h2><p>Created {new Date(selected.createdAt).toLocaleString()} · updated {new Date(selected.updatedAt).toLocaleString()} · extraction version {selected.version}</p>{history.length === 0 ? <p>No history entries.</p> : <ol>{history.map((entry) => <li key={entry.id}>v{entry.version} · {entry.action} · {entry.summary} · {new Date(entry.createdAt).toLocaleString()}</li>)}</ol>}</section>
    </>}
    {busy && <p className="notice-busy" aria-live="polite">Processing notice…</p>}
  </section>;
}

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studyAiService, type StudyAiDashboard } from '../features/studyAi/service';
import { INSUFFICIENT_EVIDENCE } from '../features/studyAi/engine';
import type { EvidenceCitation, MaterialType, QuizAttempt, QuizDifficulty, QuizFrequency, StudyAiAnswer, StudyQuiz } from '../features/studyAi/models';
import './StudyAiPage.css';

const MATERIAL_ACTIONS: { type: MaterialType; label: string }[] = [
  { type: 'summary', label: 'Summarise' },
  { type: 'key_points', label: 'Key points' },
  { type: 'definitions', label: 'Definitions' },
  { type: 'formulas', label: 'Formulas' },
  { type: 'revision_questions', label: 'Revision questions' },
];

function CitationList({ citations, onOpen }: { citations: EvidenceCitation[]; onOpen: (citation: EvidenceCitation) => void }) {
  if (citations.length === 0) return null;
  return <div className="study-ai-citations">{citations.map((citation) => <article key={citation.id}>
    <strong>{citation.documentName}</strong>
    <span>{citation.pageNumber ? `Page ${citation.pageNumber}` : citation.sectionTitle ?? 'Document section'}</span>
    <p>“{citation.excerpt}”</p>
    <button type="button" onClick={() => onOpen(citation)}>Open source</button>
  </article>)}</div>;
}

export default function StudyAiPage() {
  const [searchParams] = useSearchParams();
  const requestedNote = searchParams.get('noteId');
  const [data, setData] = useState<StudyAiDashboard>({ subjects: [], documents: [], answers: [], materials: [], quizzes: [], attempts: [], dueSchedules: [] });
  const [subjectId, setSubjectId] = useState('');
  const [documentId, setDocumentId] = useState<string>('all');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<StudyAiAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [frequency, setFrequency] = useState<QuizFrequency>('daily');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<StudyQuiz | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{ attempt: QuizAttempt; weakTopics: string[] } | null>(null);

  const load = useCallback(async (scope = subjectId) => setData(await studyAiService.dashboard(scope || undefined)), [subjectId]);

  useEffect(() => {
    void studyAiService.dashboard().then((initial) => {
      setData(initial);
      const requested = requestedNote ? initial.documents.find((document) => document.sourceNoteId === requestedNote) : undefined;
      const firstSubject = requested?.subjectId ?? initial.subjects[0]?.id ?? '';
      setSubjectId(firstSubject);
      if (requested) setDocumentId(requested.id);
    });
  }, [requestedNote]);

  useEffect(() => { if (subjectId) void load(subjectId); }, [load, subjectId]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await work(); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Operation failed.'); }
    finally { setBusy(false); }
  };

  const processDocument = (id: string) => run(async () => {
    const document = await studyAiService.ensureIndexed(id);
    setMessage(document.extractionStatus === 'no_extractable_text' ? 'This document currently has no extractable text.' : 'Document indexed and ready.');
  });

  const ask = (event: FormEvent) => {
    event.preventDefault();
    if (!subjectId || !question.trim()) return;
    void run(async () => { setAnswer(await studyAiService.ask(subjectId, documentId, question)); });
  };

  const createMaterial = (type: MaterialType) => {
    if (documentId === 'all') { setMessage('Select one document to generate study material.'); return; }
    void run(async () => { await studyAiService.generateMaterial(subjectId, documentId, type); setMessage(`${type.replace('_', ' ')} saved.`); });
  };

  const createQuiz = (selectedFrequency = frequency) => {
    if (documentId === 'all') { setMessage('Select one document to generate a cited quiz.'); return; }
    void run(async () => {
      const created = await studyAiService.generateQuiz(subjectId, documentId, selectedFrequency, questionCount, difficulty);
      setQuiz(created); setQuizIndex(0); setQuizAnswers([]); setRevealed(false); setResult(null);
    });
  };

  const nextQuizQuestion = () => {
    if (!quiz) return;
    if (quizIndex < quiz.questions.length - 1) { setQuizIndex(quizIndex + 1); setRevealed(false); }
    else void run(async () => { setResult(await studyAiService.completeQuiz(quiz, quizAnswers)); });
  };

  const openCitation = (citation: EvidenceCitation) => {
    void studyAiService.citationUrl(citation).then((url) => {
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else setMessage('The excerpt shown here is the available source preview for this text note.');
    });
  };

  const documents = data.documents.filter((document) => document.subjectId === subjectId);
  const selectedDocument = documents.find((document) => document.id === documentId);
  const currentQuestion = quiz?.questions[quizIndex];
  const currentChoice = quizAnswers[quizIndex];

  return <section className="study-ai-page">
    <header><h1>Study AI and Doubt Solver</h1><p>Answers and quizzes are restricted to your uploaded academic material.</p></header>
    {message && <div className="study-ai-message" role="status">{message}</div>}

    <section className="study-ai-panel">
      <h2>Academic scope</h2>
      <div className="study-ai-controls">
        <label>Subject<select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setDocumentId('all'); }}><option value="">Select subject</option>{data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
        <label>Document<select value={documentId} onChange={(event) => setDocumentId(event.target.value)}><option value="all">All documents in this subject</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label>
      </div>
      <div className="study-ai-documents">{documents.length === 0 ? <p>No academic notes are available for this subject. Add one under Academics → Notes.</p> : documents.map((document) => <article key={document.id}>
        <strong>{document.name}</strong><span>{document.mimeType} · {new Date(document.createdAt).toLocaleDateString()} · {document.extractionStatus}</span>
        {document.extractionStatus !== 'ready' && <button type="button" disabled={busy} onClick={() => void processDocument(document.id)}>Extract and index</button>}
        {document.extractionStatus === 'no_extractable_text' && <p>This document currently has no extractable text.</p>}
      </article>)}</div>
    </section>

    <section className="study-ai-panel">
      <h2>Evidence-locked doubt solver</h2>
      <form onSubmit={ask} className="study-ai-question"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question covered by the selected material" /><button disabled={busy || !subjectId || !question.trim()}>Ask</button></form>
      {answer && <div className={`study-ai-answer ${answer.evidenceStatus}`}><strong>{answer.evidenceStatus.replace('_', ' ')}</strong><p>{answer.answer}</p>{answer.evidenceStatus === 'insufficient_evidence' && <small>Please select or upload material that covers this topic.</small>}<CitationList citations={answer.citations} onOpen={openCitation} /></div>}
    </section>

    <section className="study-ai-panel">
      <h2>Generate study material</h2>
      <p>{selectedDocument ? `Source: ${selectedDocument.name}` : 'Select one document first.'}</p>
      <div className="study-ai-actions">{MATERIAL_ACTIONS.map((action) => <button key={action.type} type="button" disabled={busy || documentId === 'all'} onClick={() => createMaterial(action.type)}>{action.label}</button>)}</div>
      <div className="study-ai-history">{data.materials.filter((material) => !subjectId || material.subjectId === subjectId).map((material) => <article key={material.id}><strong>{material.type.replace('_', ' ')}</strong>{material.content.map((section, index) => <div key={`${material.id}:${index}`}><p>{section.text}</p><CitationList citations={material.citations.filter((citation) => section.citationIds.includes(citation.id))} onOpen={openCitation} /></div>)}</article>)}</div>
    </section>

    <section className="study-ai-panel">
      <h2>Document quiz</h2>
      {data.dueSchedules.length > 0 && <div className="study-ai-due">Quiz due: {data.dueSchedules.map((schedule) => schedule.frequency).join(', ')}</div>}
      <div className="study-ai-controls">
        <label>Frequency<select value={frequency} onChange={(event) => setFrequency(event.target.value as QuizFrequency)}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
        <label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as QuizDifficulty)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
        <label>Questions<input type="number" min="1" max="20" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} /></label>
      </div>
      <div className="study-ai-actions"><button type="button" disabled={busy || documentId === 'all'} onClick={() => createQuiz('daily')}>Generate Today’s Quiz</button><button type="button" disabled={busy || documentId === 'all'} onClick={() => createQuiz('weekly')}>Generate Weekly Quiz</button></div>

      {quiz && currentQuestion && !result && <div className="study-ai-quiz">
        <p>Question {quizIndex + 1} of {quiz.questions.length}</p><h3>{currentQuestion.question}</h3>
        <div className="study-ai-options">{currentQuestion.options.map((option, index) => {
          const chosen = currentChoice === index; const correct = revealed && currentQuestion.correctOptionIndex === index; const wrong = revealed && chosen && !correct;
          return <button type="button" key={option} disabled={revealed} className={correct ? 'correct' : wrong ? 'wrong' : chosen ? 'selected' : ''} onClick={() => { const next = [...quizAnswers]; next[quizIndex] = index; setQuizAnswers(next); }}>{String.fromCharCode(65 + index)}. {option}</button>;
        })}</div>
        {revealed && <div className="study-ai-feedback"><strong>{currentChoice === currentQuestion.correctOptionIndex ? 'Correct' : 'Incorrect'}</strong><p>{currentQuestion.explanation}</p><CitationList citations={currentQuestion.citations} onOpen={openCitation} /></div>}
        {!revealed ? <button type="button" disabled={currentChoice === undefined} onClick={() => setRevealed(true)}>Check answer</button> : <button type="button" onClick={nextQuizQuestion}>{quizIndex === quiz.questions.length - 1 ? 'Finish quiz' : 'Next question'}</button>}
      </div>}

      {quiz && result && <div className="study-ai-result"><h3>Score: {result.attempt.score}/{quiz.questions.length} ({result.attempt.percentage}%)</h3>{result.weakTopics.length > 0 && <p>Review these sourced sections: {result.weakTopics.join(', ')}</p>}<h4>Incorrect answers</h4>{quiz.questions.filter((item, index) => result.attempt.answers[index] !== item.correctOptionIndex).map((item) => <article key={item.id}><strong>{item.question}</strong><p>Correct answer: {item.options[item.correctOptionIndex]}</p><p>{item.explanation}</p><CitationList citations={item.citations} onOpen={openCitation} /></article>)}</div>}
      <div className="study-ai-history"><h3>Attempt history</h3>{data.attempts.length === 0 ? <p>No completed quizzes yet.</p> : data.attempts.map((attempt) => { const savedQuiz = data.quizzes.find((item) => item.id === attempt.quizId); return <article key={attempt.id}><strong>{attempt.score}/{savedQuiz?.questions.length ?? attempt.answers.length} · {attempt.percentage}%</strong><p>{new Date(attempt.completedAt).toLocaleString()} · {savedQuiz?.difficulty ?? 'quiz'}</p></article>; })}</div>
    </section>

    <section className="study-ai-panel"><h2>Previous answers</h2><div className="study-ai-history">{data.answers.length === 0 ? <p>No questions asked yet.</p> : data.answers.map((item) => <article key={item.id}><strong>{item.question}</strong><p>{item.answer}</p><CitationList citations={item.citations} onOpen={openCitation} /></article>)}</div></section>
    {busy && <div className="study-ai-busy" aria-live="polite">Working…</div>}
    {!busy && documents.some((document) => document.extractionStatus === 'failed') && <p className="study-ai-note">A local file could not be reopened. Upload that note again in Academics and retry extraction.</p>}
    {!subjectId && <p className="study-ai-note">Create or select a subject before using Study AI.</p>}
    {message === INSUFFICIENT_EVIDENCE && <span className="sr-only">{INSUFFICIENT_EVIDENCE}</span>}
  </section>;
}

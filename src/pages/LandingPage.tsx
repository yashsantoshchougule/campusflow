import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

type SectionBoxProps = { id?: string; title: string; children: ReactNode };

const SectionBox = ({ id, title, children }: SectionBoxProps) => <section id={id} className="landing-section"><h2>{title}</h2>{children}</section>;
const FeatureBox = ({ title, items }: { title: string; items: string[] }) => <article className="landing-card"><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>;
const StepBox = ({ number, children }: { number: number; children: string }) => <article className="landing-card landing-step"><strong>{number}</strong><p>{children}</p></article>;
const ExampleQuestionBox = ({ children }: { children: string }) => <article className="landing-card">{children}</article>;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const links = [['Home', '#top'], ['Features', '#features'], ['How It Works', '#how-it-works'], ['About', '#about'], ['Help', '#help']];
  return <header className="landing-nav"><nav aria-label="Main navigation"><a className="landing-logo" href="#top">CampusFlow</a><button className="landing-menu-button" type="button" aria-label="Toggle navigation menu" aria-expanded={open} onClick={() => setOpen(!open)}>Menu</button><div className={`landing-nav-links ${open ? 'is-open' : ''}`}>{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}<Link to="/login" onClick={() => setOpen(false)}>Login</Link><Link to="/signup" onClick={() => setOpen(false)}>Get Started</Link></div></nav></header>;
};

const features: Array<[string, string[]]> = [
  ['Unified Student Dashboard', ['Today’s lectures', 'Pending assignments', 'Upcoming examinations', 'Attendance status', 'Priority tasks and warnings']],
  ['Conversational Academic Assistant', ['Natural-language questions', 'Personalised academic answers', 'Assignment and examination retrieval', 'Recommended next actions']],
  ['Academic Priority and Risk Engine', ['Deadline prioritisation', 'Academic-risk detection', 'Attendance warnings', 'Task-conflict detection', 'Explanations for recommendations']],
  ['AI Study Planner', ['Daily and weekly plans', 'Deadline-aware scheduling', 'Missed-task rescheduling', 'Balanced subject planning', 'Daily and weekly quizzes']],
  ['Attendance What-If Engine', ['Subject-wise attendance', 'Safe-bunk calculation', 'Attendance forecasting', 'Required-class calculation', 'Attendance-recovery plan']],
  ['Evidence-Locked Doubt Solver', ['Answers from uploaded notes', 'Document summaries', 'Simple explanations', 'Revision questions', 'Source references']],
  ['AI Notice Intelligence', ['Notice image and PDF reading', 'Deadline extraction', 'Requirement extraction', 'Notice-to-task conversion', 'Confirmation before saving']],
  ['Academic Management', ['Assignments', 'Timetable', 'Examinations', 'Notes', 'Task completion status']],
];

const LandingPage = () => <div id="top" className="landing-page"><Navbar /><main className="landing-main">
  <section className="landing-hero"><div><p>AI Student Life &amp; Academic Assistant</p><h1>Know What Matters Next</h1><p>CampusFlow brings assignments, examinations, attendance, timetables, notices, study planning and academic assistance into one place.</p><div className="landing-actions"><Link to="/signup">Get Started</Link><Link to="/login">Login</Link></div><small>Personalised answers based on verified academic information.</small></div><aside className="landing-preview" aria-label="Dashboard Preview placeholder">Dashboard Preview</aside></section>
  <SectionBox title="Academic information is scattered everywhere"><div className="landing-grid">{['Assignments are stored across different platforms.', 'Timetables and examination dates are difficult to track.', 'Important notices are shared as images and PDFs.', 'Students discover attendance shortages too late.', 'Generic AI answers are not connected to verified academic data.', 'Students struggle to decide what they should complete first.'].map((item) => <article className="landing-card" key={item}>{item}</article>)}</div></SectionBox>
  <SectionBox id="about" title="One intelligent platform for student life"><p>CampusFlow combines academic management and AI assistance into one connected platform.</p><div className="landing-grid">{['Unified academic dashboard', 'Conversational academic assistant', 'Smart study planning', 'Attendance intelligence', 'Evidence-locked doubt solving', 'Notice extraction and deadline detection'].map((item) => <article className="landing-card" key={item}>{item}</article>)}</div></SectionBox>
  <SectionBox id="features" title="Main features"><div className="landing-grid">{features.map(([title, items]) => <FeatureBox key={title} title={title} items={items} />)}</div></SectionBox>
  <SectionBox id="how-it-works" title="How It Works"><div className="landing-grid landing-steps">{['Student signs in.', 'Student adds academic information or uploads documents.', 'CampusFlow retrieves relevant verified data.', 'AI analyses deadlines, attendance and priorities.', 'CampusFlow provides a response, warning or suggested action.'].map((item, index) => <StepBox key={item} number={index + 1}>{item}</StepBox>)}</div></SectionBox>
  <SectionBox title="Ask CampusFlow"><div className="landing-grid">{['“What should I complete this week?”', '“Which examination should I prepare for first?”', '“Can I miss tomorrow’s lecture?”', '“How many classes must I attend to reach 75%?”', '“Summarise this notice.”', '“Create a study plan for my upcoming examinations.”'].map((question) => <ExampleQuestionBox key={question}>{question}</ExampleQuestionBox>)}</div></SectionBox>
  <SectionBox id="help" title="Built around trusted academic data"><ul className="landing-list"><li>Student information remains private.</li><li>AI responses use verified academic information whenever available.</li><li>Document information requires confirmation before being saved.</li><li>Students can remove uploaded documents.</li><li>CampusFlow avoids presenting unsupported answers as verified facts.</li></ul></SectionBox>
  <section className="landing-cta"><h2>Bring your academic life into one place</h2><p>Keep academic work, information and assistance connected.</p><div className="landing-actions"><Link to="/signup">Get Started</Link><Link to="/login">Login</Link></div></section>
</main><footer className="landing-footer"><strong>CampusFlow</strong><p>AI Student Life &amp; Academic Assistant</p><nav aria-label="Footer navigation"><a href="#about">About</a><a href="#features">Features</a><a href="#help">Help</a><a href="#help">Privacy</a><Link to="/login">Login</Link></nav><small>© {new Date().getFullYear()} CampusFlow — AI Student Life &amp; Academic Assistant</small></footer></div>;

export default LandingPage;

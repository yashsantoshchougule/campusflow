import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Pen2PDF from './pages/Pen2PDF';
import NotesLibrary from './pages/NotesLibrary';
import FolderNotes from './pages/FolderNotes';
import NotesGenerator from './pages/NotesGenerator';
import Timetable from './pages/Timetable';
import TodoList from './pages/TodoList';
import AIAssistant from './pages/AIAssistant';
import OnboardingPage from './pages/OnboardingPage';
import AcademicsPage from './pages/AcademicsPage';
import AttendancePage from './pages/AttendancePage';
import StudyAiPage from './pages/StudyAiPage';
import NoticesPage from './pages/NoticesPage';
import CalendarPage from './pages/CalendarPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PortalPage from './pages/PortalPage';
import './pages/AuthPages.css';

function ProtectedPage({ children, loading, session }: { children: ReactNode; loading: boolean; session: Session | null }) {
  if (loading) return <div className="loading">Loading...</div>;
  return session ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const protectedPage = (children: ReactNode) => <ProtectedPage loading={loading} session={session}>{children}</ProtectedPage>;

  return <Router><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
    <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
    <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/onboarding" element={protectedPage(<OnboardingPage />)} />
    <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
    <Route path="/academics" element={protectedPage(<AcademicsPage />)} />
    <Route path="/attendance" element={protectedPage(<AttendancePage />)} />
    <Route path="/study-ai" element={protectedPage(<StudyAiPage />)} />
    <Route path="/notices" element={protectedPage(<NoticesPage />)} />
    <Route path="/calendar" element={protectedPage(<CalendarPage />)} />
    <Route path="/notifications" element={protectedPage(<NotificationsPage />)} />
    <Route path="/profile" element={protectedPage(<ProfilePage />)} />
    <Route path="/settings" element={protectedPage(<SettingsPage />)} />
    <Route path="/portal" element={protectedPage(<PortalPage />)} />
    <Route path="/pen2pdf" element={protectedPage(<Pen2PDF />)} />
    <Route path="/notes-library" element={protectedPage(<NotesLibrary />)} />
    <Route path="/notes-library/folder/:id" element={protectedPage(<FolderNotes />)} />
    <Route path="/notes-generator" element={protectedPage(<NotesGenerator />)} />
    <Route path="/timetable" element={protectedPage(<Timetable />)} />
    <Route path="/todos" element={protectedPage(<TodoList />)} />
    <Route path="/assistant" element={protectedPage(<AIAssistant />)} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Router>;
}

export default App;

import { useState, useEffect } from "react";
import DashboardNav from "./DashboardNav";
import HeroSection from "./HeroSection";
import QuickActions from "./QuickActions";
import Footer from "../common/Footer";

function Dashboard({
  subject,
  onQuiz,
  onQA,
  onUpload,
  onNotes,
  onRoadmap,
  onAnalytics,
  onLogout,
  user,
  onAnalyticsV2,
  onStudy
}) {
  const [isBlocked, setIsBlocked] = useState(!subject);

  useEffect(() => {
    setIsBlocked(!subject);
  }, [subject]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-rose-50/40">
      
      {/* Decorative warm elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl -z-10" />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-100/10 rounded-full blur-3xl -z-10" />

      <DashboardNav
  active="dashboard"
  onDashboard={() => {}}
  onStudy={onStudy}
  onUpload={onUpload}
  onNotes={onNotes}
  onQuiz={onQuiz}
  onRoadmap={onRoadmap}
  onAnalytics={onAnalytics}
  onAnalyticsV2={onAnalyticsV2}
  onLogout={onLogout}
  subject={subject} // This should be the current subject string
  user={user}
/>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-8 relative">

        {/* Hero Section - Always visible and interactive */}
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-300/10 rounded-full blur-2xl -z-10" />
          <HeroSection
            user={user}
            subject={subject}
            onUpload={onUpload}
          />
        </div>

        {/* Quick Actions - Shows locked state when no subject */}
        <div className="relative">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-orange-200/10 rounded-full blur-2xl -z-10" />
          <QuickActions
            onNotes={onNotes}
            onQA={onQA}
            onQuiz={onQuiz}
            onUpload={onUpload}
            onAnalytics={onAnalytics}
            onRoadmap={onRoadmap}
            isDisabled={!subject}
          />
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default Dashboard;
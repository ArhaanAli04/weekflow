import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@weekflow/shared/stores';
import { onAuthStateChange } from '@weekflow/shared/lib/supabase';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ThisWeekPage from './pages/ThisWeekPage';
import JournalPage from './pages/JournalPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import WeekDetailPage from './pages/history/WeekDetailPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

function AuthGate() {
  const { session, isLoading, initialize, setSession } = useAuthStore();

  useEffect(() => {
    initialize();
    const subscription = onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;

  // TODO: wrap Outlet in a shared app layout (sidebar nav, offline banner)
  return <Outlet />;
}

function GuestGate() {
  const { session, isLoading } = useAuthStore();
  if (isLoading) return <Spinner />;
  if (session) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestGate />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<AuthGate />}>
        <Route path="/" element={<ThisWeekPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:weekId" element={<WeekDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

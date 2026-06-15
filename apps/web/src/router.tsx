import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@weekflow/shared/stores';
import AuthGuard from './components/layout/AuthGuard';
import AppLayout from './components/layout/AppLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ThisWeekPage from './pages/ThisWeekPage';
import JournalPage from './pages/JournalPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import WeekDetailPage from './pages/history/WeekDetailPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';

function GuestGate() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) return <LoadingSpinner fullScreen />;
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

      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ThisWeekPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:weekId" element={<WeekDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

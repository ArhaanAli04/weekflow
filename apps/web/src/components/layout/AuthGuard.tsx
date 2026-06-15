import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@weekflow/shared/stores';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function AuthGuard() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

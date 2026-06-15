import { Navigate, Outlet } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@weekflow/shared/stores';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function AuthGuard() {
  const session = useAuthStore(useShallow((s) => s.session));
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

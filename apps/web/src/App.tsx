import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '@weekflow/shared/stores';
import { onAuthStateChange } from '@weekflow/shared/lib/supabase';
import { AppRouter } from './router';
import { WeekFlowToaster } from './components/ui/Toast';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    initialize();
    const subscription = onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <AppRouter />
      <WeekFlowToaster />
    </BrowserRouter>
  );
}

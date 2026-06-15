import { useEffect, useState } from 'react';
import { setConnected } from '@weekflow/shared/lib/networkState';
import { dequeueToggles, dequeueLogs } from '@weekflow/shared/lib/offlineQueue';
import * as api from '@weekflow/shared/lib/api';

export function useOffline(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setConnected(true);
      setIsOnline(true);
      flushQueues().catch(() => {});
    }
    function handleOffline() {
      setConnected(false);
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

async function flushQueues(): Promise<void> {
  const [toggles, logs] = await Promise.all([dequeueToggles(), dequeueLogs()]);

  await Promise.all(
    toggles.map((t) => api.updateTask(t.taskId, { done: t.done, done_at: t.done_at })),
  );

  for (const l of logs) {
    await api.upsertDailyLog(l.week_id, l.date, l.content);
  }
}

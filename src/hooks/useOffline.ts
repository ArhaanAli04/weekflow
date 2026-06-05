import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { setConnected } from '@/lib/networkState';
import { dequeueToggles, dequeueLogs } from '@/lib/offlineQueue';
import * as api from '@/lib/api';

export function useOffline(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const prevOnline = useRef(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setConnected(online);
      setIsOnline(online);

      if (online && !prevOnline.current) {
        await flushQueues();
      }
      prevOnline.current = online;
    });

    return () => unsubscribe();
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

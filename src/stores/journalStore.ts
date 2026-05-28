import { create } from 'zustand';
import { DailyLog } from '@/types';
import * as api from '@/lib/api';

interface JournalState {
  logs: Record<string, DailyLog[]>;
  isLoading: boolean;
  error: string | null;
  loadLogs: (weekId: string) => Promise<void>;
  saveLog: (log: Omit<DailyLog, 'id' | 'created_at'>) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set) => ({
  logs: {},
  isLoading: false,
  error: null,

  loadLogs: async (weekId) => {
    set({ isLoading: true, error: null });
    const { data, error } = await api.fetchLogsForWeek(weekId);
    set({ isLoading: false });
    if (error) {
      set({ error: error.message });
      return;
    }
    set((state) => ({ logs: { ...state.logs, [weekId]: data ?? [] } }));
  },

  saveLog: async (log) => {
    const { data, error } = await api.upsertDailyLog(log);
    if (error || !data) return;
    set((state) => {
      const existing = state.logs[log.week_id] ?? [];
      const idx = existing.findIndex((l) => l.log_date === log.log_date);
      const updated =
        idx >= 0 ? existing.map((l, i) => (i === idx ? data : l)) : [...existing, data];
      return { logs: { ...state.logs, [log.week_id]: updated } };
    });
  },
}));

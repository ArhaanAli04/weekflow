import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DailyLog } from '@/types';
import * as api from '@/lib/api';

interface JournalState {
  logs: Record<string, DailyLog[]>;
  isLoading: boolean;
  error: string | null;
  loadLogs: (weekId: string) => Promise<void>;
  saveLog: (log: Omit<DailyLog, 'id' | 'created_at'>) => Promise<void>;
}

export const useJournalStore = create<JournalState>()(
  immer((set) => ({
    logs: {},
    isLoading: false,
    error: null,

    loadLogs: async (weekId) => {
      set((draft) => {
        draft.isLoading = true;
        draft.error = null;
      });
      const { data, error } = await api.fetchLogsForWeek(weekId);
      set((draft) => {
        draft.isLoading = false;
      });
      if (error) {
        set((draft) => {
          draft.error = error.message;
        });
        return;
      }
      set((draft) => {
        draft.logs[weekId] = data ?? [];
      });
    },

    saveLog: async (log) => {
      const { data, error } = await api.upsertDailyLog(log);
      if (error || !data) return;
      set((draft) => {
        if (!draft.logs[log.week_id]) draft.logs[log.week_id] = [];
        const idx = draft.logs[log.week_id].findIndex((l) => l.log_date === log.log_date);
        if (idx >= 0) {
          draft.logs[log.week_id][idx] = data;
        } else {
          draft.logs[log.week_id].push(data);
        }
      });
    },
  }))
);

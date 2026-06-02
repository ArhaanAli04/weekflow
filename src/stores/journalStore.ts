import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DailyLog } from '@/types';
import * as api from '@/lib/api';
import { getWeekId } from '@/utils/weekUtils';

interface JournalState {
  logs: Record<string, DailyLog>; // keyed by log_date ISO string (e.g. '2025-05-19')
  loading: boolean;
  error: string | null;
  loadWeekLogs: (weekId: string) => Promise<void>;
  upsertLog: (date: string, content: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>()(
  immer((set) => ({
    logs: {},
    loading: false,
    error: null,

    loadWeekLogs: async (weekId) => {
      set((draft) => {
        draft.loading = true;
        draft.error = null;
      });
      const { data, error } = await api.getLogsForWeek(weekId);
      set((draft) => { draft.loading = false; });
      if (error) {
        set((draft) => { draft.error = error.message; });
        return;
      }
      set((draft) => {
        (data ?? []).forEach((log) => { draft.logs[log.log_date] = log; });
      });
    },

    upsertLog: async (date, content) => {
      // Use local noon to safely derive the week regardless of timezone offset
      const week_id = getWeekId(new Date(date + 'T12:00:00'));
      const { data, error } = await api.upsertDailyLog(week_id, date, content);
      if (error || !data) return;
      set((draft) => { draft.logs[date] = data; });
    },
  }))
);

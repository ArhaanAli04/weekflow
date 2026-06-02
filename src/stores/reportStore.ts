import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Report, Streak } from '@/types';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { getPreviousWeekId } from '@/utils/weekUtils';

interface ReportState {
  reports: Record<string, Report>;
  streaks: Streak | null;
  loading: boolean;
  error: string | null;
  loadReport: (weekId: string) => Promise<void>;
  saveReport: (weekId: string, data: Omit<Report, 'id' | 'created_at' | 'week_id' | 'user_id'>) => Promise<void>;
  generateReport: (weekId: string) => Promise<void>;
  loadStreak: () => Promise<void>;
  updateStreak: (weekId: string, completionRate: number) => Promise<void>;
  clearError: () => void;
}

export const useReportStore = create<ReportState>()(
  immer((set, get) => ({
    reports: {},
    streaks: null,
    loading: false,
    error: null,

    clearError: () =>
      set((draft) => { draft.error = null; }),

    loadReport: async (weekId) => {
      const { data, error } = await api.fetchReport(weekId);
      if (error || !data) return;
      set((draft) => { draft.reports[weekId] = data; });
    },

    saveReport: async (weekId, data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: saved, error } = await api.upsertReport({
        ...data,
        week_id: weekId,
        user_id: user.id,
      });
      if (error || !saved) {
        set((draft) => { draft.error = error?.message ?? 'Failed to save report'; });
        return;
      }
      set((draft) => { draft.reports[weekId] = saved; });
    },

    generateReport: async (weekId) => {
      set((draft) => {
        draft.loading = true;
        draft.error = null;
      });
      const { data, error } = await api.generateReport(weekId);
      set((draft) => { draft.loading = false; });
      if (error) {
        set((draft) => { draft.error = error.message; });
        return;
      }
      if (data) {
        set((draft) => { draft.reports[weekId] = data as Report; });
      }
    },

    loadStreak: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await api.fetchStreak(user.id);
      if (error || !data) return;
      set((draft) => { draft.streaks = data; });
    },

    updateStreak: async (weekId, completionRate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const qualified = completionRate >= 80;
      const existing = get().streaks;
      const prevWeekId = getPreviousWeekId(weekId);

      let current_streak: number;
      if (qualified) {
        current_streak =
          existing?.last_qualifying_week === prevWeekId
            ? existing.current_streak + 1
            : 1;
      } else {
        current_streak = existing?.current_streak ?? 0;
      }

      const streak: Streak = {
        user_id: user.id,
        current_streak,
        longest_streak: Math.max(current_streak, existing?.longest_streak ?? 0),
        last_qualifying_week: qualified ? weekId : (existing?.last_qualifying_week ?? null),
        updated_at: new Date().toISOString(),
      };

      set((draft) => { draft.streaks = streak; });
      const { error } = await api.upsertStreak(streak);
      if (error) {
        set((draft) => { draft.streaks = existing; });
      }
    },
  }))
);

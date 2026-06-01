import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Report } from '@/types';
import * as api from '@/lib/api';

interface ReportState {
  reports: Record<string, Report>;
  isGenerating: boolean;
  error: string | null;
  fetchReport: (weekId: string) => Promise<void>;
  generateReport: (weekId: string) => Promise<void>;
  clearError: () => void;
}

export const useReportStore = create<ReportState>()(
  immer((set) => ({
    reports: {},
    isGenerating: false,
    error: null,

    clearError: () =>
      set((draft) => {
        draft.error = null;
      }),

    fetchReport: async (weekId) => {
      const { data, error } = await api.fetchReport(weekId);
      if (error || !data) return;
      set((draft) => {
        draft.reports[weekId] = data;
      });
    },

    generateReport: async (weekId) => {
      set((draft) => {
        draft.isGenerating = true;
        draft.error = null;
      });
      const { data, error } = await api.generateReport(weekId);
      set((draft) => {
        draft.isGenerating = false;
      });
      if (error) {
        set((draft) => {
          draft.error = error.message;
        });
        return;
      }
      if (data) {
        set((draft) => {
          draft.reports[weekId] = data as Report;
        });
      }
    },
  }))
);

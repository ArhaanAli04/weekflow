import { create } from 'zustand';
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

export const useReportStore = create<ReportState>((set) => ({
  reports: {},
  isGenerating: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchReport: async (weekId) => {
    const { data, error } = await api.fetchReport(weekId);
    if (error || !data) return;
    set((state) => ({ reports: { ...state.reports, [weekId]: data } }));
  },

  generateReport: async (weekId) => {
    set({ isGenerating: true, error: null });
    const { data, error } = await api.generateReport(weekId);
    set({ isGenerating: false });
    if (error) {
      set({ error: error.message });
      return;
    }
    if (data) {
      set((state) => ({ reports: { ...state.reports, [weekId]: data as Report } }));
    }
  },
}));

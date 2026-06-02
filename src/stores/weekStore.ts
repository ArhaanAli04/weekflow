import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Week, Task, CreateTaskInput } from '@/types';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { getWeekId, generateEmptyWeek } from '@/utils/weekUtils';

type WeekPatch = Partial<Omit<Week, 'id' | 'user_id' | 'created_at'>>;

interface WeekState {
  currentWeekId: string;
  weeks: Record<string, Week>;
  tasks: Record<string, Task[]>;
  loading: boolean;
  error: string | null;
  loadCurrentWeek: () => Promise<void>;
  loadWeek: (weekId: string) => Promise<void>;
  createWeekIfNotExists: (weekId: string) => Promise<void>;
  updateWeek: (weekId: string, patch: WeekPatch) => Promise<void>;
  addTask: (weekId: string, input: CreateTaskInput) => Promise<void>;
  toggleTask: (taskId: string, weekId: string) => Promise<void>;
  deleteTask: (taskId: string, weekId: string) => Promise<void>;
  loadTasksForWeek: (weekId: string) => Promise<void>;
}

export const useWeekStore = create<WeekState>()(
  immer((set, get) => ({
    currentWeekId: getWeekId(),
    weeks: {},
    tasks: {},
    loading: false,
    error: null,

    loadCurrentWeek: async () => {
      await get().loadWeek(get().currentWeekId);
    },

    loadWeek: async (weekId) => {
      set((draft) => {
        draft.loading = true;
        draft.error = null;
      });
      const [weekResult, tasksResult] = await Promise.all([
        api.getWeek(weekId),
        api.getTasksForWeek(weekId),
      ]);
      if (weekResult.error || tasksResult.error) {
        set((draft) => {
          draft.loading = false;
          draft.error =
            weekResult.error?.message ?? tasksResult.error?.message ?? 'Failed to load week';
        });
        return;
      }
      set((draft) => {
        draft.loading = false;
        if (weekResult.data) draft.weeks[weekId] = weekResult.data;
        draft.tasks[weekId] = tasksResult.data ?? [];
      });
    },

    createWeekIfNotExists: async (weekId) => {
      if (get().weeks[weekId]) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing, error } = await api.getWeek(weekId);
      if (!error && existing) {
        set((draft) => { draft.weeks[weekId] = existing; });
        return;
      }
      const emptyWeek = generateEmptyWeek(weekId, user.id);
      const { data, error: createError } = await api.upsertWeek(emptyWeek);
      if (!createError && data) {
        set((draft) => { draft.weeks[weekId] = data; });
      }
    },

    updateWeek: async (weekId, patch) => {
      const prev = get().weeks[weekId];
      if (!prev) return;
      const merged = { ...prev, ...patch };
      set((draft) => { draft.weeks[weekId] = merged; });
      const { data, error } = await api.upsertWeek(merged);
      if (error) {
        set((draft) => {
          draft.weeks[weekId] = prev;
          draft.error = error.message;
        });
      } else if (data) {
        set((draft) => { draft.weeks[weekId] = data; });
      }
    },

    addTask: async (weekId, input) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await api.createTask({ ...input, user_id: user.id });
      if (error || !data) return;
      set((draft) => {
        if (!draft.tasks[weekId]) draft.tasks[weekId] = [];
        draft.tasks[weekId].push(data);
      });
    },

    toggleTask: async (taskId, weekId) => {
      const task = (get().tasks[weekId] ?? []).find((t) => t.id === taskId);
      if (!task) return;
      const done = !task.done;
      const done_at = done ? new Date().toISOString() : null;
      set((draft) => {
        const t = (draft.tasks[weekId] ?? []).find((t) => t.id === taskId);
        if (t) {
          t.done = done;
          t.done_at = done_at;
        }
      });
      const { error } = await api.updateTask(taskId, { done, done_at });
      if (error) {
        set((draft) => {
          const idx = (draft.tasks[weekId] ?? []).findIndex((t) => t.id === taskId);
          if (idx !== -1) draft.tasks[weekId][idx] = task;
        });
      }
    },

    deleteTask: async (taskId, weekId) => {
      const task = (get().tasks[weekId] ?? []).find((t) => t.id === taskId);
      set((draft) => {
        draft.tasks[weekId] = (draft.tasks[weekId] ?? []).filter((t) => t.id !== taskId);
      });
      const { error } = await api.deleteTask(taskId);
      if (error && task) {
        set((draft) => {
          if (!draft.tasks[weekId]) draft.tasks[weekId] = [];
          draft.tasks[weekId].push(task);
        });
      }
    },

    loadTasksForWeek: async (weekId) => {
      const { data, error } = await api.getTasksForWeek(weekId);
      if (error) {
        set((draft) => { draft.error = error.message; });
        return;
      }
      set((draft) => { draft.tasks[weekId] = data ?? []; });
    },
  }))
);

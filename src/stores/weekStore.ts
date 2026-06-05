import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Week, Task, CreateTaskInput } from '@/types';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { getWeekId, generateEmptyWeek } from '@/utils/weekUtils';
import { getConnected } from '@/lib/networkState';
import { readCache, writeCache, enqueueToggle } from '@/lib/offlineQueue';

type WeekPatch = Partial<Omit<Week, 'id' | 'user_id' | 'created_at'>>;

interface WeekState {
  currentWeekId: string;
  weeks: Record<string, Week>;
  tasks: Record<string, Task[]>;
  allWeekIds: string[];
  lastWeekUnfinished: Task[];
  loading: boolean;
  error: string | null;
  reset: () => void;
  loadCurrentWeek: () => Promise<void>;
  loadWeek: (weekId: string) => Promise<void>;
  loadAllWeeks: () => Promise<void>;
  loadAllTasks: () => Promise<void>;
  createWeekIfNotExists: (weekId: string) => Promise<void>;
  updateWeek: (weekId: string, patch: WeekPatch) => Promise<void>;
  addTask: (weekId: string, input: CreateTaskInput) => Promise<void>;
  toggleTask: (taskId: string, weekId: string) => Promise<void>;
  deleteTask: (taskId: string, weekId: string) => Promise<void>;
  loadTasksForWeek: (weekId: string) => Promise<void>;
  loadLastWeekUnfinished: (weekId: string) => Promise<void>;
  carryOverTasks: (currentWeekId: string, tasks: Task[]) => Promise<void>;
}

export const useWeekStore = create<WeekState>()(
  immer((set, get) => ({
    currentWeekId: getWeekId(),
    weeks: {},
    tasks: {},
    allWeekIds: [],
    lastWeekUnfinished: [],
    loading: false,
    error: null,

    reset: () =>
      set((draft) => {
        draft.currentWeekId = getWeekId();
        draft.weeks = {};
        draft.tasks = {};
        draft.allWeekIds = [];
        draft.lastWeekUnfinished = [];
        draft.loading = false;
        draft.error = null;
      }),

    loadCurrentWeek: async () => {
      await get().loadWeek(get().currentWeekId);
    },

    loadAllWeeks: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      set((draft) => { draft.loading = true; });
      const { data, error } = await api.getAllWeeks(user.id);
      set((draft) => { draft.loading = false; });
      if (error || !data) return;
      set((draft) => {
        data.forEach((w) => { draft.weeks[w.id] = w; });
        draft.allWeekIds = data.map((w) => w.id);
      });
    },

    loadAllTasks: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await api.getAllTasks(user.id);
      if (error || !data) return;
      set((draft) => {
        const byWeek: Record<string, Task[]> = {};
        data.forEach((t) => {
          if (!byWeek[t.week_id]) byWeek[t.week_id] = [];
          byWeek[t.week_id].push(t);
        });
        Object.entries(byWeek).forEach(([wid, ts]) => {
          draft.tasks[wid] = ts;
        });
      });
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
        // Fall back to locally cached data rather than showing an error screen
        const cachedWeek = await readCache<Week>(`cache_week_${weekId}`);
        const cachedTasks = await readCache<Task[]>(`cache_tasks_${weekId}`);
        if (cachedWeek) {
          set((draft) => {
            draft.loading = false;
            draft.weeks[weekId] = cachedWeek;
            draft.tasks[weekId] = cachedTasks ?? [];
          });
        } else {
          set((draft) => {
            draft.loading = false;
            draft.error =
              weekResult.error?.message ?? tasksResult.error?.message ?? 'Failed to load week';
          });
        }
        return;
      }
      // Cache the successful result for offline fallback
      if (weekResult.data) await writeCache(`cache_week_${weekId}`, weekResult.data);
      await writeCache(`cache_tasks_${weekId}`, tasksResult.data ?? []);
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
      const { data: existing, error: fetchError } = await api.getWeek(weekId);
      if (!fetchError && existing) {
        set((draft) => { draft.weeks[weekId] = existing; });
        return;
      }
      const emptyWeek = generateEmptyWeek(weekId, user.id);
      const { data, error: createError } = await api.upsertWeek(emptyWeek);
      if (createError) {
        console.error('[weekStore] createWeekIfNotExists failed:', createError.message);
        set((draft) => { draft.error = createError.message; });
        return;
      }
      if (data) {
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
      // Optimistic update always applied immediately
      set((draft) => {
        const t = (draft.tasks[weekId] ?? []).find((t) => t.id === taskId);
        if (t) {
          t.done = done;
          t.done_at = done_at;
        }
      });
      if (!getConnected()) {
        // Queue for sync when connection restores; keep optimistic state
        await enqueueToggle({ taskId, weekId, done, done_at });
        return;
      }
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

    loadLastWeekUnfinished: async (weekId) => {
      const { data } = await api.getUnfinishedTasksFromWeek(weekId);
      set((draft) => { draft.lastWeekUnfinished = data ?? []; });
    },

    carryOverTasks: async (weekId, tasks) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const created: Task[] = [];
      for (const task of tasks) {
        const { data } = await api.createTask({
          week_id: weekId,
          user_id: user.id,
          title: task.title,
          category: task.category,
          priority: task.priority,
          estimated_hours: task.estimated_hours,
          carried_over_from: task.week_id,
        });
        if (data) created.push(data);
      }
      set((draft) => {
        if (!draft.tasks[weekId]) draft.tasks[weekId] = [];
        draft.tasks[weekId].push(...created);
      });
    },
  }))
);

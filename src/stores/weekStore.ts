import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Week, Task, CreateTaskInput, UpdateTaskInput } from '@/types';
import * as api from '@/lib/api';
import { getWeekId } from '@/utils/weekUtils';

interface WeekState {
  currentWeekId: string;
  weeks: Record<string, Week>;
  tasks: Record<string, Task[]>;
  isLoading: boolean;
  error: string | null;
  setCurrentWeekId: (weekId: string) => void;
  loadCurrentWeek: () => Promise<void>;
  loadWeek: (weekId: string) => Promise<void>;
  addTask: (input: CreateTaskInput & { user_id: string }) => Promise<void>;
  toggleTask: (taskId: string, weekId: string) => Promise<void>;
  removeTask: (taskId: string, weekId: string) => Promise<void>;
}

export const useWeekStore = create<WeekState>()(
  immer((set, get) => ({
    currentWeekId: getWeekId(),
    weeks: {},
    tasks: {},
    isLoading: false,
    error: null,

    setCurrentWeekId: (weekId) =>
      set((draft) => {
        draft.currentWeekId = weekId;
      }),

    loadCurrentWeek: async () => {
      await get().loadWeek(get().currentWeekId);
    },

    loadWeek: async (weekId) => {
      set((draft) => {
        draft.isLoading = true;
        draft.error = null;
      });
      const [weekResult, tasksResult] = await Promise.all([
        api.fetchWeek(weekId),
        api.fetchTasksForWeek(weekId),
      ]);
      if (weekResult.error || tasksResult.error) {
        set((draft) => {
          draft.isLoading = false;
          draft.error =
            weekResult.error?.message ?? tasksResult.error?.message ?? 'Failed to load week';
        });
        return;
      }
      set((draft) => {
        draft.isLoading = false;
        draft.weeks[weekId] = weekResult.data!;
        draft.tasks[weekId] = tasksResult.data ?? [];
      });
    },

    addTask: async (input) => {
      const { data, error } = await api.createTask(input);
      if (error || !data) return;
      set((draft) => {
        if (!draft.tasks[input.week_id]) draft.tasks[input.week_id] = [];
        draft.tasks[input.week_id].push(data);
      });
    },

    toggleTask: async (taskId, weekId) => {
      const tasks = get().tasks[weekId] ?? [];
      const task = tasks.find((t) => t.id === taskId);
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
      const { error } = await api.updateTask({ id: taskId, done, done_at });
      if (error) {
        set((draft) => {
          const idx = (draft.tasks[weekId] ?? []).findIndex((t) => t.id === taskId);
          if (idx !== -1) draft.tasks[weekId][idx] = task;
        });
      }
    },

    removeTask: async (taskId, weekId) => {
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
  }))
);

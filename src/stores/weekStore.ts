import { create } from 'zustand';
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

export const useWeekStore = create<WeekState>((set, get) => ({
  currentWeekId: getWeekId(),
  weeks: {},
  tasks: {},
  isLoading: false,
  error: null,

  setCurrentWeekId: (weekId) => set({ currentWeekId: weekId }),

  loadCurrentWeek: async () => {
    await get().loadWeek(get().currentWeekId);
  },

  loadWeek: async (weekId) => {
    set({ isLoading: true, error: null });
    const [weekResult, tasksResult] = await Promise.all([
      api.fetchWeek(weekId),
      api.fetchTasksForWeek(weekId),
    ]);
    if (weekResult.error || tasksResult.error) {
      set({
        isLoading: false,
        error: weekResult.error?.message ?? tasksResult.error?.message ?? 'Failed to load week',
      });
      return;
    }
    set((state) => ({
      isLoading: false,
      weeks: { ...state.weeks, [weekId]: weekResult.data },
      tasks: { ...state.tasks, [weekId]: tasksResult.data ?? [] },
    }));
  },

  addTask: async (input) => {
    const { data, error } = await api.createTask(input);
    if (error || !data) return;
    set((state) => ({
      tasks: {
        ...state.tasks,
        [input.week_id]: [...(state.tasks[input.week_id] ?? []), data],
      },
    }));
  },

  toggleTask: async (taskId, weekId) => {
    const tasks = get().tasks[weekId] ?? [];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const done = !task.done;
    const done_at = done ? new Date().toISOString() : null;
    set((state) => ({
      tasks: {
        ...state.tasks,
        [weekId]: state.tasks[weekId].map((t) =>
          t.id === taskId ? { ...t, done, done_at } : t
        ),
      },
    }));
    const { error } = await api.updateTask({ id: taskId, done, done_at });
    if (error) {
      set((state) => ({
        tasks: {
          ...state.tasks,
          [weekId]: state.tasks[weekId].map((t) => (t.id === taskId ? task : t)),
        },
      }));
    }
  },

  removeTask: async (taskId, weekId) => {
    const task = (get().tasks[weekId] ?? []).find((t) => t.id === taskId);
    set((state) => ({
      tasks: {
        ...state.tasks,
        [weekId]: (state.tasks[weekId] ?? []).filter((t) => t.id !== taskId),
      },
    }));
    const { error } = await api.deleteTask(taskId);
    if (error && task) {
      set((state) => ({
        tasks: {
          ...state.tasks,
          [weekId]: [...(state.tasks[weekId] ?? []), task],
        },
      }));
    }
  },
}));

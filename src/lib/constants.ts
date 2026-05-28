import { TaskCategory, TaskPriority } from '@/types';

export const COLORS = {
  BACKGROUND: '#0E0E17',
  SURFACE: '#161622',
  BORDER: 'rgba(255,255,255,0.08)',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: 'rgba(255,255,255,0.6)',
  TEXT_MUTED: 'rgba(255,255,255,0.3)',
  ACCENT: '#6366F1',
  ACCENT_SECONDARY: '#8B5CF6',
  PINK: '#EC4899',
  SUCCESS: '#22C55E',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
} as const;

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Work: '#6366F1',
  Health: '#EC4899',
  Personal: '#14B8A6',
  Learning: '#F97316',
  Other: '#8B5CF6',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#22C55E',
};

export const VALIDATION = {
  TASK_TITLE_MAX: 100,
  INTENTION_MAX: 200,
  JOURNAL_MAX: 500,
  FOCUS_HOURS_STEP: 0.5,
  ENERGY_MIN: 1,
  ENERGY_MAX: 5,
} as const;

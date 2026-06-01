import { Week, Task, Report } from '@/types';

function toWeekId(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getWeekId(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toWeekId(d);
}

export function getWeekLabel(weekId: string): string {
  const [year, month, day] = weekId.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 6);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

export function generateEmptyWeek(weekId: string, userId: string): Week {
  return {
    id: weekId,
    user_id: userId,
    label: getWeekLabel(weekId),
    intention: null,
    energy_start: null,
    energy_end: null,
    focus_hours: 0,
    timer_running: false,
    timer_started_at: null,
    report_generated: false,
    created_at: new Date().toISOString(),
  };
}

export function getDatesInWeek(weekId: string): Date[] {
  const [year, month, day] = weekId.split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => new Date(year, month - 1, day + i));
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getDayLabel(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function isCurrentWeek(weekId: string): boolean {
  return weekId === getWeekId();
}

export function getPreviousWeekId(weekId: string): string {
  const [year, month, day] = weekId.split('-').map(Number);
  return toWeekId(new Date(year, month - 1, day - 7));
}

export function getNextWeekId(weekId: string): string {
  const [year, month, day] = weekId.split('-').map(Number);
  return toWeekId(new Date(year, month - 1, day + 7));
}

export function calculateCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
}

export function calculateWeekScore(week: Week, tasks: Task[], report?: Report): number {
  if (report) return report.overall_score;
  const doneRatio = tasks.length === 0 ? 0 : tasks.filter((t) => t.done).length / tasks.length;
  const completionPoints = doneRatio * 80;
  const energyEnd = week.energy_end ?? week.energy_start ?? 3;
  const energyPoints = (energyEnd / 5) * 10;
  const focusPoints = Math.min(10, (week.focus_hours / 10) * 10);
  return Math.min(100, Math.round(completionPoints + energyPoints + focusPoints));
}

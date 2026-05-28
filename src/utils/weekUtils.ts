export function getWeekId(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function getWeekLabel(weekId: string): string {
  const start = new Date(weekId);
  const end = new Date(weekId);
  end.setDate(end.getDate() + 6);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

export function getPreviousWeekId(weekId: string): string {
  const d = new Date(weekId);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

export function getNextWeekId(weekId: string): string {
  const d = new Date(weekId);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export function isCurrentWeek(weekId: string): boolean {
  return weekId === getWeekId();
}

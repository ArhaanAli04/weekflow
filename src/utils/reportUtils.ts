import { Task, WeekGrade } from '@/types';

export function computeCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  return tasks.filter((t) => t.done).length / tasks.length;
}

export function qualifiesForStreak(completionRate: number): boolean {
  return completionRate >= 0.8;
}

export function gradeToLabel(grade: WeekGrade): string {
  const labels: Record<WeekGrade, string> = {
    S: 'Outstanding',
    A: 'Excellent',
    B: 'Good',
    C: 'Fair',
    D: 'Needs Improvement',
  };
  return labels[grade];
}

export function scoreToGrade(score: number): WeekGrade {
  if (score >= 95) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

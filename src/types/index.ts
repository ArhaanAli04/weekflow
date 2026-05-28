export type TaskCategory = 'Work' | 'Health' | 'Personal' | 'Learning' | 'Other';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type WeekGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Profile {
  id: string;
  display_name: string;
  notification_prefs: Record<string, unknown>;
  created_at: string;
}

export interface Week {
  id: string;
  user_id: string;
  label: string;
  intention: string | null;
  energy_start: number | null;
  energy_end: number | null;
  focus_hours: number;
  timer_running: boolean;
  timer_started_at: string | null;
  report_generated: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  week_id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimated_hours: number;
  done: boolean;
  done_at: string | null;
  carried_over_from: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  week_id: string;
  user_id: string;
  log_date: string;
  content: string;
  created_at: string;
}

export interface Report {
  id: string;
  week_id: string;
  user_id: string;
  overall_score: number;
  grade: WeekGrade;
  headline: string;
  wins: string[];
  improvements: string[];
  capacity_insight: string;
  focus_suggestion: string;
  next_week_goal: string;
  motivational_note: string;
  raw_json: Record<string, unknown>;
  created_at: string;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_qualifying_week: string | null;
  updated_at: string;
}

export interface FeatureFlag {
  user_id: string;
  flag: string;
  enabled: boolean;
}

export interface WeekSummary {
  week: Week;
  tasks: Task[];
  completionRate: number;
  report?: Report;
}

export interface CreateTaskInput {
  week_id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimated_hours: number;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  estimated_hours?: number;
  done?: boolean;
  done_at?: string | null;
}

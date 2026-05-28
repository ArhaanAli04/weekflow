import { supabase } from './supabase';
import {
  Week,
  Task,
  DailyLog,
  Report,
  Streak,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/types';

export async function fetchWeek(weekId: string) {
  return supabase.from('weeks').select('*').eq('id', weekId).single<Week>();
}

export async function upsertWeek(week: Partial<Week> & { id: string; user_id: string }) {
  return supabase.from('weeks').upsert(week).select().single<Week>();
}

export async function fetchTasksForWeek(weekId: string) {
  return supabase
    .from('tasks')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: true })
    .returns<Task[]>();
}

export async function createTask(input: CreateTaskInput & { user_id: string }) {
  return supabase.from('tasks').insert(input).select().single<Task>();
}

export async function updateTask(input: UpdateTaskInput) {
  const { id, ...updates } = input;
  return supabase.from('tasks').update(updates).eq('id', id).select().single<Task>();
}

export async function deleteTask(taskId: string) {
  return supabase.from('tasks').delete().eq('id', taskId);
}

export async function fetchLogsForWeek(weekId: string) {
  return supabase
    .from('daily_logs')
    .select('*')
    .eq('week_id', weekId)
    .order('log_date', { ascending: true })
    .returns<DailyLog[]>();
}

export async function upsertDailyLog(log: Omit<DailyLog, 'id' | 'created_at'>) {
  return supabase
    .from('daily_logs')
    .upsert(log, { onConflict: 'user_id,log_date' })
    .select()
    .single<DailyLog>();
}

export async function fetchReport(weekId: string) {
  return supabase.from('reports').select('*').eq('week_id', weekId).single<Report>();
}

export async function fetchRecentReports(userId: string, limit = 4) {
  return supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<Report[]>();
}

export async function generateReport(weekId: string) {
  return supabase.functions.invoke('generate-report', { body: { weekId } });
}

export async function fetchStreak(userId: string) {
  return supabase.from('streaks').select('*').eq('user_id', userId).single<Streak>();
}

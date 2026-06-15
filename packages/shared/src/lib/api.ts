import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { Week, Task, DailyLog, Report, Streak, CreateTaskInput, Profile, NotificationPrefs } from '../types';

type TaskPatch = Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'week_id'>>;

// ─── Weeks ───────────────────────────────────────────────────────────────────

export async function getWeek(weekId: string) {
  return getSupabase().from('weeks').select('*').eq('id', weekId).single<Week>();
}

export async function upsertWeek(week: Partial<Week> & { id: string; user_id: string }) {
  return getSupabase().from('weeks').upsert(week, { onConflict: 'user_id,id' }).select().single<Week>();
}

export async function getAllWeeks(userId: string) {
  return getSupabase()
    .from('weeks')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })
    .returns<Week[]>();
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasksForWeek(weekId: string) {
  return getSupabase()
    .from('tasks')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: true })
    .returns<Task[]>();
}

export async function createTask(input: CreateTaskInput & { user_id: string }) {
  return getSupabase().from('tasks').insert(input).select().single<Task>();
}

export async function updateTask(id: string, patch: TaskPatch) {
  return getSupabase().from('tasks').update(patch).eq('id', id).select().single<Task>();
}

export async function deleteTask(id: string) {
  return getSupabase().from('tasks').delete().eq('id', id);
}

export async function getUnfinishedTasksFromWeek(weekId: string) {
  return getSupabase()
    .from('tasks')
    .select('*')
    .eq('week_id', weekId)
    .eq('done', false)
    .returns<Task[]>();
}

// ─── Daily Logs ──────────────────────────────────────────────────────────────

export async function getLogsForWeek(weekId: string) {
  return getSupabase()
    .from('daily_logs')
    .select('*')
    .eq('week_id', weekId)
    .order('log_date', { ascending: true })
    .returns<DailyLog[]>();
}

export async function upsertDailyLog(weekId: string, date: string, content: string) {
  const { data: { user } } = await getSupabase().auth.getUser();
  if (!user) {
    return {
      data: null,
      error: { message: 'Not authenticated', details: '', hint: '', code: '401' } as PostgrestError,
    };
  }
  return getSupabase()
    .from('daily_logs')
    .upsert(
      { week_id: weekId, user_id: user.id, log_date: date, content },
      { onConflict: 'user_id,log_date' },
    )
    .select()
    .single<DailyLog>();
}

// ─── Tasks (bulk) ────────────────────────────────────────────────────────────

export async function getAllTasks(userId: string) {
  return getSupabase()
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .returns<Task[]>();
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function getReport(weekId: string) {
  return getSupabase().from('reports').select('*').eq('week_id', weekId).single<Report>();
}

export async function saveReport(report: Omit<Report, 'id' | 'created_at'> & { id?: string }) {
  return getSupabase()
    .from('reports')
    .upsert(report, { onConflict: 'user_id,week_id' })
    .select()
    .single<Report>();
}

export async function getAllReports(userId: string) {
  return getSupabase()
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('week_id', { ascending: false })
    .returns<Report[]>();
}

export async function generateReport(weekId: string) {
  return getSupabase().functions.invoke('generate-report', { body: { weekId } });
}

// ─── Profiles ────────────────────────────────────────────────────────────────

type ProfilePatch = Partial<Pick<Profile, 'display_name' | 'notification_prefs'>>;

export async function getProfile(userId: string) {
  return getSupabase().from('profiles').select('*').eq('id', userId).single<Profile>();
}

export async function upsertProfile(id: string, patch: ProfilePatch) {
  return getSupabase()
    .from('profiles')
    .upsert({ id, ...patch }, { onConflict: 'id' })
    .select()
    .single<Profile>();
}

// ─── Streaks ─────────────────────────────────────────────────────────────────

export async function getStreak(userId: string) {
  return getSupabase().from('streaks').select('*').eq('user_id', userId).single<Streak>();
}

export async function upsertStreak(streak: Streak) {
  return getSupabase()
    .from('streaks')
    .upsert(streak, { onConflict: 'user_id' })
    .select()
    .single<Streak>();
}

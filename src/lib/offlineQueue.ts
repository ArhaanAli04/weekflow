import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOGGLE_QUEUE_KEY = 'offline_queue_toggles';
const LOG_QUEUE_KEY = 'offline_queue_logs';

export interface PendingToggle {
  taskId: string;
  weekId: string;
  done: boolean;
  done_at: string | null;
}

export interface PendingLog {
  date: string;
  content: string;
  week_id: string;
}

async function storeRead(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function storeWrite(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function storeRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await storeRead(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    await storeWrite(key, JSON.stringify(value));
  } catch {
    // Ignore cache write failures silently
  }
}

export async function enqueueToggle(toggle: PendingToggle): Promise<void> {
  const raw = await storeRead(TOGGLE_QUEUE_KEY);
  const queue: PendingToggle[] = raw ? (JSON.parse(raw) as PendingToggle[]) : [];
  const idx = queue.findIndex((q) => q.taskId === toggle.taskId);
  if (idx !== -1) {
    queue[idx] = toggle;
  } else {
    queue.push(toggle);
  }
  await storeWrite(TOGGLE_QUEUE_KEY, JSON.stringify(queue));
}

export async function dequeueToggles(): Promise<PendingToggle[]> {
  const raw = await storeRead(TOGGLE_QUEUE_KEY);
  if (!raw) return [];
  const queue = JSON.parse(raw) as PendingToggle[];
  await storeRemove(TOGGLE_QUEUE_KEY);
  return queue;
}

export async function enqueueLog(log: PendingLog): Promise<void> {
  const raw = await storeRead(LOG_QUEUE_KEY);
  const queue: PendingLog[] = raw ? (JSON.parse(raw) as PendingLog[]) : [];
  const idx = queue.findIndex((q) => q.date === log.date);
  if (idx !== -1) {
    queue[idx] = log;
  } else {
    queue.push(log);
  }
  await storeWrite(LOG_QUEUE_KEY, JSON.stringify(queue));
}

export async function dequeueLogs(): Promise<PendingLog[]> {
  const raw = await storeRead(LOG_QUEUE_KEY);
  if (!raw) return [];
  const queue = JSON.parse(raw) as PendingLog[];
  await storeRemove(LOG_QUEUE_KEY);
  return queue;
}

export async function clearAllLocalCache(): Promise<void> {
  await Promise.all([
    storeRemove(TOGGLE_QUEUE_KEY),
    storeRemove(LOG_QUEUE_KEY),
    storeRemove('carryover_shown_week'),
  ]);
}

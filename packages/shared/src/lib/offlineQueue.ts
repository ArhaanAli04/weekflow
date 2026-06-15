import { StorageAdapter, localStorageAdapter } from './storage';

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

let _storage: StorageAdapter = localStorageAdapter;

export function initOfflineStorage(storage: StorageAdapter): void {
  _storage = storage;
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await _storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    await _storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore cache write failures silently
  }
}

export async function enqueueToggle(toggle: PendingToggle): Promise<void> {
  const raw = await _storage.getItem(TOGGLE_QUEUE_KEY);
  const queue: PendingToggle[] = raw ? (JSON.parse(raw) as PendingToggle[]) : [];
  const idx = queue.findIndex((q) => q.taskId === toggle.taskId);
  if (idx !== -1) {
    queue[idx] = toggle;
  } else {
    queue.push(toggle);
  }
  await _storage.setItem(TOGGLE_QUEUE_KEY, JSON.stringify(queue));
}

export async function dequeueToggles(): Promise<PendingToggle[]> {
  const raw = await _storage.getItem(TOGGLE_QUEUE_KEY);
  if (!raw) return [];
  const queue = JSON.parse(raw) as PendingToggle[];
  await _storage.removeItem(TOGGLE_QUEUE_KEY);
  return queue;
}

export async function enqueueLog(log: PendingLog): Promise<void> {
  const raw = await _storage.getItem(LOG_QUEUE_KEY);
  const queue: PendingLog[] = raw ? (JSON.parse(raw) as PendingLog[]) : [];
  const idx = queue.findIndex((q) => q.date === log.date);
  if (idx !== -1) {
    queue[idx] = log;
  } else {
    queue.push(log);
  }
  await _storage.setItem(LOG_QUEUE_KEY, JSON.stringify(queue));
}

export async function dequeueLogs(): Promise<PendingLog[]> {
  const raw = await _storage.getItem(LOG_QUEUE_KEY);
  if (!raw) return [];
  const queue = JSON.parse(raw) as PendingLog[];
  await _storage.removeItem(LOG_QUEUE_KEY);
  return queue;
}

export async function clearAllLocalCache(): Promise<void> {
  await Promise.all([
    _storage.removeItem(TOGGLE_QUEUE_KEY),
    _storage.removeItem(LOG_QUEUE_KEY),
    _storage.removeItem('carryover_shown_week'),
  ]);
}

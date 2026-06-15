import {
  createClient,
  type SupabaseClient,
  type AuthChangeEvent,
  type AuthError,
  type Session,
  type User,
} from '@supabase/supabase-js';
import { StorageAdapter, localStorageAdapter } from './storage';

export type { StorageAdapter };

let _client: SupabaseClient | null = null;

export function initSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string,
  storage: StorageAdapter = localStorageAdapter,
): void {
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetch,
      headers: {},
    },
  });
}

export function getSupabase(): SupabaseClient {
  if (!_client) {
    throw new Error('[weekflow] Supabase not initialized. Call initSupabase() before using the app.');
  }
  return _client;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  return { user: data.user, error };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await getSupabase().auth.signOut();
  return { error };
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const { data } = getSupabase().auth.onAuthStateChange(callback);
  return data.subscription;
}

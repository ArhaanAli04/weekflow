import 'react-native-url-polyfill/auto';
import { createClient, type AuthChangeEvent, type AuthError, type Session, type User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetch,
    headers: {},
  },
});

// Auth helpers

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signUp({
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}

import { create } from 'zustand';
import { type AuthError, type Session, type User } from '@supabase/supabase-js';
import { supabase, signIn as apiSignIn, signUp as apiSignUp } from '@/lib/supabase';
import { Profile } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, isLoading: false });
  },

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  setProfile: (profile) => set({ profile }),

  signIn: async (email, password) => {
    const { user, session, error } = await apiSignIn(email, password);
    if (!error) set({ user, session });
    return { error };
  },

  signUp: async (email, password, displayName) => {
    const { user, error } = await apiSignUp(email, password, displayName);
    if (!error && user) set({ user });
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));

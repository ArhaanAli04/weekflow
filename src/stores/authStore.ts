import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
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

export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    session: null,
    user: null,
    profile: null,
    isLoading: true,

    initialize: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      set((draft) => {
        draft.session = session;
        draft.user = session?.user ?? null;
        draft.isLoading = false;
      });
    },

    setSession: (session) =>
      set((draft) => {
        draft.session = session;
        draft.user = session?.user ?? null;
        draft.isLoading = false;
      }),

    setProfile: (profile) =>
      set((draft) => {
        draft.profile = profile;
      }),

    signIn: async (email, password) => {
      const { user, session, error } = await apiSignIn(email, password);
      if (!error) {
        set((draft) => {
          draft.user = user;
          draft.session = session;
        });
      }
      return { error };
    },

    signUp: async (email, password, displayName) => {
      const { user, error } = await apiSignUp(email, password, displayName);
      if (!error && user) {
        set((draft) => {
          draft.user = user;
        });
      }
      return { error };
    },

    signOut: async () => {
      await supabase.auth.signOut();
      set((draft) => {
        draft.session = null;
        draft.user = null;
        draft.profile = null;
      });
    },
  }))
);

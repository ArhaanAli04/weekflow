import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { type AuthError, type Session, type User } from '@supabase/supabase-js';
import { supabase, signIn as apiSignIn, signUp as apiSignUp } from '@/lib/supabase';
import { Profile, NotificationPrefs } from '@/types';
import * as api from '@/lib/api';
import { useWeekStore } from '@/stores/weekStore';
import { useReportStore } from '@/stores/reportStore';
import { useJournalStore } from '@/stores/journalStore';

type ProfilePatch = Partial<Pick<Profile, 'display_name' | 'notification_prefs'>>;

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  loadProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    session: null,
    user: null,
    profile: null,
    isLoading: true,

    initialize: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      let profile: Profile | null = null;
      if (user) {
        const { data } = await api.getProfile(user.id);
        profile = data ?? null;
      }
      set((draft) => {
        draft.session = session;
        draft.user = user;
        draft.profile = profile;
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

    loadProfile: async () => {
      const user = get().user;
      if (!user) return;
      const { data } = await api.getProfile(user.id);
      set((draft) => { draft.profile = data ?? null; });
    },

    updateProfile: async (patch) => {
      const user = get().user;
      if (!user) return;
      const prev = get().profile;
      if (prev) {
        set((draft) => { draft.profile = { ...prev, ...patch }; });
      }
      const { data, error } = await api.upsertProfile(user.id, patch);
      if (error) {
        set((draft) => { draft.profile = prev; });
      } else if (data) {
        set((draft) => { draft.profile = data; });
      }
    },

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
      useWeekStore.getState().reset();
      useReportStore.getState().reset();
      useJournalStore.getState().reset();
      set((draft) => {
        draft.session = null;
        draft.user = null;
        draft.profile = null;
      });
    },
  }))
);

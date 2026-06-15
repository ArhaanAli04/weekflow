import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { onAuthStateChange, initSupabase } from '@weekflow/shared/lib/supabase';
import { initOfflineStorage } from '@weekflow/shared/lib/offlineQueue';
import { useAuthStore } from '@weekflow/shared/stores';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  setupNotificationHandler,
  requestPermissions,
  applyNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
} from '@/lib/notifications';
import { nativeStorageAdapter } from '../src/lib/storageAdapter';

initSupabase(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  nativeStorageAdapter,
);
initOfflineStorage(nativeStorageAdapter);

setupNotificationHandler();

export default function RootLayout() {
  const { isLoading, initialize, setSession, session, profile } = useAuthStore();

  useEffect(() => {
    initialize();

    const subscription = onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Once auth initializes, request notification permissions and apply saved prefs.
  useEffect(() => {
    if (!isLoading && session) {
      const prefs = profile?.notification_prefs ?? DEFAULT_NOTIFICATION_PREFS;
      requestPermissions()
        .then((granted) => { if (granted) return applyNotificationPrefs(prefs); })
        .catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="history/[weekId]" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
      <Toast />
    </>
  );
}

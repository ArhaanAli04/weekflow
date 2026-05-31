import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChange } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function RootLayout() {
  const { isLoading, initialize, setSession } = useAuthStore();

  useEffect(() => {
    initialize();

    const subscription = onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    </>
  );
}

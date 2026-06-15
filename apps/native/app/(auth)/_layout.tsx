import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@weekflow/shared/stores';

export default function AuthLayout() {
  const { session } = useAuthStore();
  if (session) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

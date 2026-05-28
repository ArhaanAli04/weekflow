import { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText size="2xl" weight="bold" style={styles.header}>Dashboard</AppText>

        <AppCard style={styles.card}>
          <AppText variant="secondary" size="sm" style={styles.label}>Current Streak</AppText>
          <AppText size="3xl" weight="bold" style={{ color: COLORS.ACCENT }}>—</AppText>
          <AppText variant="muted" size="sm">weeks</AppText>
        </AppCard>

        <AppCard style={styles.card}>
          <AppText variant="secondary" size="sm" style={styles.label}>Longest Streak</AppText>
          <AppText size="3xl" weight="bold">—</AppText>
          <AppText variant="muted" size="sm">weeks</AppText>
        </AppCard>

        <AppCard>
          <AppText weight="semibold" style={styles.label}>Performance Trend</AppText>
          <AppText variant="muted" size="sm">
            Charts will appear once you have generated reports.
          </AppText>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, gap: 12 },
  header: { marginBottom: 8 },
  card: { alignItems: 'center', gap: 4 },
  label: { marginBottom: 4 },
});

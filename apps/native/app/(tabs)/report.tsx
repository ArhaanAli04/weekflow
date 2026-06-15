import { useEffect } from 'react';
export { RouteErrorFallback as ErrorBoundary } from '@/components/ScreenErrorBoundary';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { ReportView } from '@/components/ReportView';
import { ReportSkeleton } from '@/components/SkeletonLoader';
import { COLORS } from '@weekflow/shared/lib/constants';
import { useReportStore } from '@weekflow/shared/stores';
import { useWeekStore } from '@weekflow/shared/stores';

export default function ReportScreen() {
  const router = useRouter();
  const { currentWeekId, weeks, tasks } = useWeekStore();
  const { reports, loading, loadReport } = useReportStore();

  const report = reports[currentWeekId];
  const week = weeks[currentWeekId];
  const weekTasks = tasks[currentWeekId] ?? [];
  const focusHours = week?.focus_hours ?? 0;

  useEffect(() => {
    loadReport(currentWeekId);
  }, [currentWeekId]);

  if (loading && !report) {
    return (
      <SafeAreaView style={styles.container}>
        <ReportSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!report ? (
        <EmptyState
          icon="bar-chart-outline"
          title="No report yet"
          description="Generate your report from the This Week tab"
          actionLabel="Go to This Week"
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ReportView
            report={report}
            weekId={currentWeekId}
            tasks={weekTasks}
            focusHours={focusHours}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, paddingBottom: 32 },
});

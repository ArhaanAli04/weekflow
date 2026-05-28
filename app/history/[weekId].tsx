import { useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { COLORS, CATEGORY_COLORS, PRIORITY_COLORS } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';
import { useReportStore } from '@/stores/reportStore';
import { getWeekLabel } from '@/utils/weekUtils';

export default function PastWeekScreen() {
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  const router = useRouter();
  const { weeks, tasks, isLoading, loadWeek } = useWeekStore();
  const { reports, fetchReport } = useReportStore();

  useEffect(() => {
    if (!weekId) return;
    loadWeek(weekId);
    fetchReport(weekId);
  }, [weekId]);

  if (isLoading || !weekId) return <LoadingScreen />;

  const week = weeks[weekId];
  const weekTasks = tasks[weekId] ?? [];
  const report = reports[weekId];
  const completed = weekTasks.filter((t) => t.done).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <AppText weight="semibold">{getWeekLabel(weekId)}</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {report && (
          <AppCard style={styles.scoreCard}>
            <AppText size="3xl" weight="bold" style={{ color: COLORS.ACCENT }}>
              {report.grade}
            </AppText>
            <AppText variant="secondary">{report.overall_score}/100</AppText>
            <AppText variant="secondary" size="sm" style={styles.headline}>
              {report.headline}
            </AppText>
          </AppCard>
        )}

        <AppCard>
          <AppText weight="semibold" style={styles.sectionTitle}>
            Tasks ({completed}/{weekTasks.length})
          </AppText>
          {weekTasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Ionicons
                name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={task.done ? COLORS.SUCCESS : COLORS.TEXT_MUTED}
              />
              <AppText
                variant={task.done ? 'muted' : 'primary'}
                style={[styles.taskTitle, task.done && styles.doneText]}
              >
                {task.title}
              </AppText>
            </View>
          ))}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  scroll: { padding: 16, gap: 12 },
  scoreCard: { alignItems: 'center', gap: 4 },
  headline: { textAlign: 'center' },
  sectionTitle: { marginBottom: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  taskTitle: { flex: 1 },
  doneText: { textDecorationLine: 'line-through' },
});

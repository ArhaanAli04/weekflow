import { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { AppBadge } from '@/components/AppBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ReportView } from '@/components/ReportView';
import { COLORS, CATEGORY_COLORS, PRIORITY_COLORS } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';
import { useReportStore } from '@/stores/reportStore';
import { useJournalStore } from '@/stores/journalStore';
import { getWeekLabel } from '@/utils/weekUtils';

const ENERGY_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very High',
};

function EnergyDot({ value }: { value: number }) {
  const colors = [COLORS.DANGER, '#F97316', COLORS.WARNING, COLORS.ACCENT, COLORS.SUCCESS];
  return (
    <View style={energyStyles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View
          key={n}
          style={[
            energyStyles.dot,
            { backgroundColor: n <= value ? colors[value - 1] : COLORS.BORDER },
          ]}
        />
      ))}
      <AppText variant="muted" size="xs">{ENERGY_LABELS[value] ?? ''}</AppText>
    </View>
  );
}

const energyStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export default function PastWeekScreen() {
  const { weekId } = useLocalSearchParams<{ weekId: string }>();
  const router = useRouter();

  const { weeks, tasks, loading, loadWeek } = useWeekStore();
  const { reports, loadReport } = useReportStore();
  const { logs, loadWeekLogs } = useJournalStore();

  useEffect(() => {
    if (!weekId) return;
    loadWeek(weekId);
    loadReport(weekId);
    loadWeekLogs(weekId);
  }, [weekId]);

  if (loading || !weekId) return <LoadingScreen />;

  const week = weeks[weekId];
  const weekTasks = tasks[weekId] ?? [];
  const report = reports[weekId];
  const completedCount = weekTasks.filter((t) => t.done).length;

  const weekLogs = Object.values(logs)
    .filter((l) => l.week_id === weekId)
    .sort((a, b) => a.log_date.localeCompare(b.log_date));

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Navigation header ─────────────────────────── */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.TEXT_PRIMARY} />
          <AppText weight="medium">History</AppText>
        </Pressable>
        <AppText variant="muted" size="sm">{getWeekLabel(weekId)}</AppText>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Report ───────────────────────────────────── */}
        {report ? (
          <ReportView
            report={report}
            weekId={weekId}
            tasks={weekTasks}
            focusHours={week?.focus_hours ?? 0}
          />
        ) : (
          <AppCard style={styles.noReport}>
            <Ionicons name="bar-chart-outline" size={32} color={COLORS.TEXT_MUTED} />
            <AppText variant="muted" style={{ textAlign: 'center' }}>
              No report was generated for this week
            </AppText>
          </AppCard>
        )}

        {/* ── Week stats ───────────────────────────────── */}
        {week && (
          <AppCard style={styles.section}>
            <AppText weight="semibold" style={styles.sectionTitle}>Week Overview</AppText>

            {week.intention ? (
              <View style={styles.statRow}>
                <AppText variant="muted" size="sm" style={styles.statLabel}>Intention</AppText>
                <AppText variant="secondary" size="sm" style={styles.statValue}>
                  {week.intention}
                </AppText>
              </View>
            ) : null}

            <View style={styles.statRow}>
              <AppText variant="muted" size="sm" style={styles.statLabel}>Focus time</AppText>
              <AppText variant="secondary" size="sm">{week.focus_hours}h</AppText>
            </View>

            {week.energy_start !== null && (
              <View style={styles.statRow}>
                <AppText variant="muted" size="sm" style={styles.statLabel}>Energy start</AppText>
                <EnergyDot value={week.energy_start} />
              </View>
            )}

            {week.energy_end !== null && (
              <View style={styles.statRow}>
                <AppText variant="muted" size="sm" style={styles.statLabel}>Energy end</AppText>
                <EnergyDot value={week.energy_end} />
              </View>
            )}
          </AppCard>
        )}

        {/* ── Tasks ────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText weight="semibold" style={styles.sectionTitle}>
              Tasks
            </AppText>
            <AppText variant="muted" size="sm">
              {completedCount}/{weekTasks.length} done
            </AppText>
          </View>

          {weekTasks.length === 0 ? (
            <AppText variant="muted" size="sm">No tasks for this week</AppText>
          ) : (
            weekTasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <Ionicons
                  name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={task.done ? COLORS.SUCCESS : COLORS.TEXT_MUTED}
                />
                <View style={styles.taskBody}>
                  <AppText
                    variant={task.done ? 'muted' : 'primary'}
                    style={task.done ? styles.doneText : undefined}
                    numberOfLines={2}
                  >
                    {task.title}
                  </AppText>
                  <View style={styles.taskBadges}>
                    <AppBadge label={task.category} color={CATEGORY_COLORS[task.category]} />
                    <AppBadge label={task.priority} color={PRIORITY_COLORS[task.priority]} />
                    {task.estimated_hours > 0 && (
                      <AppBadge
                        label={`${task.estimated_hours}h`}
                        color={COLORS.TEXT_MUTED}
                      />
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </AppCard>

        {/* ── Journal entries ──────────────────────────── */}
        <AppCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText weight="semibold" style={styles.sectionTitle}>Journal</AppText>
            <AppText variant="muted" size="sm">{weekLogs.length} entries</AppText>
          </View>

          {weekLogs.length === 0 ? (
            <AppText variant="muted" size="sm">No journal entries for this week</AppText>
          ) : (
            weekLogs.map((log) => (
              <View key={log.id} style={styles.logEntry}>
                <View style={styles.logDateRow}>
                  <View style={styles.logDot} />
                  <AppText size="xs" weight="semibold" style={styles.logDate}>
                    {new Date(log.log_date + 'T12:00:00').toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </AppText>
                </View>
                <AppText variant="secondary" size="sm" style={styles.logContent}>
                  {log.content}
                </AppText>
              </View>
            ))
          )}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 80 },

  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  noReport: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },

  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { marginBottom: 0 },

  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  statLabel: { width: 88 },
  statValue: { flex: 1 },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  taskBody: { flex: 1, gap: 6 },
  taskBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  doneText: { textDecorationLine: 'line-through' },

  logEntry: { gap: 4 },
  logDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ACCENT,
  },
  logDate: { color: COLORS.ACCENT },
  logContent: { paddingLeft: 14, lineHeight: 20 },
});

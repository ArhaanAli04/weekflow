import { useCallback, useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
export { RouteErrorFallback as ErrorBoundary } from '@/components/ScreenErrorBoundary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { EmptyState } from '@/components/EmptyState';
import { HistoryListSkeleton } from '@/components/SkeletonLoader';
import { COLORS } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';
import { useReportStore } from '@/stores/reportStore';
import { getWeekLabel } from '@/utils/weekUtils';
import { qualifiesForStreak } from '@/utils/reportUtils';
import type { WeekGrade } from '@/types';

type GradeFilter = 'All' | WeekGrade;
type DateRangeFilter = 'all' | '1m' | '3m';

const GRADE_COLORS: Record<WeekGrade, string> = {
  S: '#EAB308',
  A: COLORS.SUCCESS,
  B: COLORS.ACCENT,
  C: '#F97316',
  D: COLORS.DANGER,
};

const GRADE_OPTIONS: GradeFilter[] = ['All', 'S', 'A', 'B', 'C', 'D'];
const DATE_OPTIONS: { label: string; value: DateRangeFilter }[] = [
  { label: 'All time', value: 'all' },
  { label: '1 month', value: '1m' },
  { label: '3 months', value: '3m' },
];

function MiniProgressBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? COLORS.SUCCESS : pct >= 50 ? COLORS.WARNING : COLORS.ACCENT;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    overflow: 'hidden',
    flex: 1,
  },
  fill: { height: 4, borderRadius: 2 },
});

interface WeekCardProps {
  weekId: string;
  index: number;
}

function WeekCard({ weekId, index }: WeekCardProps) {
  const router = useRouter();
  const { weeks, tasks } = useWeekStore();
  const { reports } = useReportStore();

  const week = weeks[weekId];
  const weekTasks = tasks[weekId] ?? [];
  const report = reports[weekId];

  const completedCount = weekTasks.filter((t) => t.done).length;
  const completionPct =
    weekTasks.length > 0 ? Math.round((completedCount / weekTasks.length) * 100) : 0;
  const isStreakWeek = qualifiesForStreak(
    weekTasks.length > 0 ? completedCount / weekTasks.length : 0,
  );

  const gradeColor = report ? GRADE_COLORS[report.grade] : COLORS.TEXT_MUTED;

  const translateX = useSharedValue(40);
  const opacity = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    const delay = index * 50;
    translateX.value = withDelay(delay, withTiming(0, { duration: 280 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
  }, []);

  return (
    <Animated.View style={animStyle}>
      <AppCard style={styles.weekCard} onPress={() => router.push(`/history/${weekId}`)}>
        {/* Row 1: label + grade badge */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <AppText weight="semibold">{getWeekLabel(weekId)}</AppText>
            {week?.label ? (
              <AppText variant="muted" size="xs" numberOfLines={1} style={styles.weekLabel}>
                {week.label}
              </AppText>
            ) : null}
          </View>
          <View style={[styles.gradeBadge, { borderColor: gradeColor + '66' }]}>
            <AppText weight="bold" size="lg" style={{ color: gradeColor }}>
              {report?.grade ?? '—'}
            </AppText>
          </View>
        </View>

        {/* Row 2: progress bar + task count */}
        <View style={styles.progressRow}>
          <MiniProgressBar pct={completionPct} />
          <AppText variant="muted" size="xs" style={styles.taskCount}>
            {completedCount}/{weekTasks.length}
          </AppText>
        </View>

        {/* Row 3: focus hours + completion % + streak */}
        <View style={styles.cardFooter}>
          <View style={styles.footerStat}>
            <Ionicons name="time-outline" size={12} color={COLORS.TEXT_MUTED} />
            <AppText variant="muted" size="xs">{week?.focus_hours ?? 0}h focus</AppText>
          </View>
          <View style={styles.footerStat}>
            <Ionicons name="checkmark-circle-outline" size={12} color={COLORS.TEXT_MUTED} />
            <AppText variant="muted" size="xs">{completionPct}% done</AppText>
          </View>
          {isStreakWeek && weekTasks.length > 0 && (
            <View style={styles.footerStat}>
              <AppText size="xs">🔥</AppText>
              <AppText size="xs" style={{ color: '#F97316' }}>Streak week</AppText>
            </View>
          )}
        </View>
      </AppCard>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { allWeekIds, loading, loadAllWeeks, loadAllTasks } = useWeekStore();
  const { reports, loadAllReports } = useReportStore();

  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllWeeks();
    loadAllTasks();
    loadAllReports();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAllWeeks(), loadAllTasks(), loadAllReports()]);
    setRefreshing(false);
  }, []);

  const filtered = useMemo(() => {
    let ids = allWeekIds;

    if (dateFilter !== 'all') {
      const cutoff = new Date();
      if (dateFilter === '1m') cutoff.setMonth(cutoff.getMonth() - 1);
      if (dateFilter === '3m') cutoff.setMonth(cutoff.getMonth() - 3);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      ids = ids.filter((id) => id >= cutoffStr);
    }

    if (gradeFilter !== 'All') {
      ids = ids.filter((id) => reports[id]?.grade === gradeFilter);
    }

    return ids;
  }, [allWeekIds, gradeFilter, dateFilter, reports]);

  if (loading && allWeekIds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <HistoryListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.ACCENT}
            colors={[COLORS.ACCENT]}
          />
        }
      >
        {/* ── Sticky header + filters ─────────────────── */}
        <View style={styles.headerBlock}>
          <AppText size="2xl" weight="bold" style={styles.title}>History</AppText>

          {/* Grade filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {GRADE_OPTIONS.map((g) => {
              const active = gradeFilter === g;
              const color = g === 'All' ? COLORS.ACCENT : GRADE_COLORS[g as WeekGrade];
              return (
                <Pressable
                  key={g}
                  onPress={() => setGradeFilter(g)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? color + '22' : 'transparent',
                      borderColor: active ? color : COLORS.BORDER,
                    },
                  ]}
                >
                  <AppText
                    size="sm"
                    weight={active ? 'semibold' : 'normal'}
                    style={{ color: active ? color : COLORS.TEXT_SECONDARY }}
                  >
                    {g}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Date range chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {DATE_OPTIONS.map(({ label, value }) => {
              const active = dateFilter === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setDateFilter(value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? COLORS.ACCENT + '22' : 'transparent',
                      borderColor: active ? COLORS.ACCENT : COLORS.BORDER,
                    },
                  ]}
                >
                  <AppText
                    size="sm"
                    weight={active ? 'semibold' : 'normal'}
                    style={{ color: active ? COLORS.ACCENT : COLORS.TEXT_SECONDARY }}
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Week list ─────────────────────────────────── */}
        {filtered.length === 0 ? (
          allWeekIds.length === 0 ? (
            <EmptyState
              icon="time-outline"
              title="No history yet"
              description="Complete your first week to see it here"
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No weeks match"
              description="Try adjusting the grade or date filter"
            />
          )
        ) : (
          <View style={styles.list}>
            {filtered.map((weekId, index) => (
              <WeekCard key={weekId} weekId={weekId} index={index} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { flexGrow: 1 },

  headerBlock: {
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: { paddingHorizontal: 16 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },

  list: { padding: 16, gap: 12 },

  weekCard: { gap: 10 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: { flex: 1, gap: 2, marginRight: 8 },
  weekLabel: { marginTop: 1 },
  gradeBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskCount: { minWidth: 32, textAlign: 'right' },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

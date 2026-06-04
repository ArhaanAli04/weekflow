import { useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryStack,
  VictoryAxis,
  VictoryPie,
} from 'victory';
import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { COLORS, CATEGORY_COLORS } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';
import { useReportStore } from '@/stores/reportStore';
import { getPreviousWeekId } from '@/utils/weekUtils';
import type { TaskCategory } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: TaskCategory[] = ['Work', 'Health', 'Personal', 'Learning', 'Other'];
const CHART_W = Dimensions.get('window').width - 48;
const CHART_H = 200;

const AXIS_X_STYLE = {
  axis: { stroke: COLORS.BORDER },
  grid: { stroke: 'transparent' },
  tickLabels: {
    fill: COLORS.TEXT_MUTED,
    fontSize: 8,
    angle: -40,
    textAnchor: 'end' as const,
    padding: 0,
  },
};

const AXIS_Y_STYLE = {
  axis: { stroke: COLORS.BORDER },
  grid: { stroke: COLORS.BORDER, strokeDasharray: '4,4', strokeOpacity: 0.4 },
  tickLabels: { fill: COLORS.TEXT_MUTED, fontSize: 9, padding: 4 },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ScorePoint = { x: string; y: number };
type CompletionPoint = { x: string; y: number; fill: string };
type CategoryPoint = { x: string; y: number };
type PiePoint = { x: string; y: number };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shortLabel(weekId: string): string {
  const [, m, d] = weekId.split('-').map(Number);
  return `${m}/${d}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ height }: { height: number }) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.65, { duration: 850 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ height, borderRadius: 12, backgroundColor: COLORS.SURFACE }, animStyle]}
    />
  );
}

// ─── Pulsing streak dot ───────────────────────────────────────────────────────

function PulsingDot({ qualifying }: { qualifying: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 650 }),
        withTiming(1.0, { duration: 650 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        dotStyles.base,
        qualifying ? dotStyles.filledCurrent : dotStyles.activeCurrent,
        animStyle,
      ]}
    />
  );
}

const dotStyles = StyleSheet.create({
  base: { width: 14, height: 14, borderRadius: 7 },
  filled: { backgroundColor: COLORS.SUCCESS },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  filledCurrent: { backgroundColor: COLORS.SUCCESS },
  activeCurrent: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.ACCENT,
  },
});

// ─── Legend row ───────────────────────────────────────────────────────────────

function ChartLegend({ items }: { items: { label: string; color: string; count?: number }[] }) {
  return (
    <View style={legendStyles.row}>
      {items.map(({ label, color, count }) => (
        <View key={label} style={legendStyles.item}>
          <View style={[legendStyles.dot, { backgroundColor: color }]} />
          <AppText variant="muted" size="xs">{label}</AppText>
          {count !== undefined && (
            <AppText size="xs" weight="semibold" style={{ color }}>{count}</AppText>
          )}
        </View>
      ))}
    </View>
  );
}

const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { allWeekIds, currentWeekId, tasks, loading, loadAllWeeks, loadAllTasks } = useWeekStore();
  const { reports, streaks, loadAllReports, loadStreak } = useReportStore();

  useEffect(() => {
    loadAllWeeks();
    loadAllTasks();
    loadAllReports();
    loadStreak();
  }, []);

  // ── Sorted week IDs ────────────────────────────────────────────────────────
  const sortedIds = useMemo(() => [...allWeekIds].sort(), [allWeekIds]);
  const chart12 = useMemo(() => sortedIds.slice(-12), [sortedIds]);
  const chart8 = useMemo(() => sortedIds.slice(-8), [sortedIds]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const scoreData = useMemo<ScorePoint[]>(
    () =>
      chart12
        .filter((id) => reports[id] !== undefined)
        .map((id) => ({ x: shortLabel(id), y: reports[id].overall_score })),
    [chart12, reports],
  );

  const completionData = useMemo<CompletionPoint[]>(
    () =>
      chart12.map((id) => {
        const t = tasks[id] ?? [];
        const y =
          t.length > 0
            ? Math.round((t.filter((x) => x.done).length / t.length) * 100)
            : 0;
        const fill =
          y >= 80 ? COLORS.SUCCESS : y >= 50 ? COLORS.WARNING : COLORS.DANGER;
        return { x: shortLabel(id), y, fill };
      }),
    [chart12, tasks],
  );

  const stackData = useMemo<CategoryPoint[][]>(
    () =>
      CATEGORIES.map((cat) =>
        chart8.map((id) => ({
          x: shortLabel(id),
          y: (tasks[id] ?? []).filter((t) => t.category === cat).length,
        })),
      ),
    [chart8, tasks],
  );

  const pieData = useMemo<PiePoint[]>(() => {
    const counts: Record<TaskCategory, number> = {
      Work: 0,
      Health: 0,
      Personal: 0,
      Learning: 0,
      Other: 0,
    };
    Object.values(tasks)
      .flat()
      .filter((t) => t.done)
      .forEach((t) => {
        counts[t.category] += 1;
      });
    return CATEGORIES.filter((c) => counts[c] > 0).map((c) => ({ x: c, y: counts[c] }));
  }, [tasks]);

  const totalDone = useMemo(
    () => Object.values(tasks).flat().filter((t) => t.done).length,
    [tasks],
  );

  // ── Streak dots: 10 most recent weeks ─────────────────────────────────────
  const streakDotIds = useMemo<string[]>(() => {
    const ids: string[] = [];
    let id = currentWeekId;
    for (let i = 0; i < 10; i++) {
      ids.unshift(id);
      id = getPreviousWeekId(id);
    }
    return ids;
  }, [currentWeekId]);

  function qualifies(weekId: string): boolean {
    const t = tasks[weekId] ?? [];
    return t.length > 0 && t.filter((x) => x.done).length / t.length >= 0.8;
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading && allWeekIds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <AppText size="2xl" weight="bold" style={styles.header}>Dashboard</AppText>
          <SkeletonBlock height={148} />
          <SkeletonBlock height={248} />
          <SkeletonBlock height={248} />
          <SkeletonBlock height={268} />
          <SkeletonBlock height={228} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentStreak = streaks?.current_streak ?? 0;
  const longestStreak = streaks?.longest_streak ?? 0;
  const streakColor = currentStreak > 0 ? '#F97316' : COLORS.TEXT_MUTED;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText size="2xl" weight="bold" style={styles.header}>Dashboard</AppText>

        {/* ── Streak card ──────────────────────────────────────────────── */}
        <AppCard style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View style={styles.streakHero}>
              <AppText style={styles.fire}>🔥</AppText>
              <View style={styles.streakNumbers}>
                <AppText size="3xl" weight="bold" style={{ color: streakColor }}>
                  {currentStreak}
                </AppText>
                <AppText variant="muted" size="sm">
                  week{currentStreak !== 1 ? 's' : ''} streak
                </AppText>
              </View>
            </View>
            <View style={styles.longestBlock}>
              <AppText variant="muted" size="xs">Longest ever</AppText>
              <AppText weight="semibold" style={{ color: COLORS.ACCENT }}>
                {longestStreak}w
              </AppText>
            </View>
          </View>

          <AppText variant="muted" size="xs" style={styles.streakHint}>
            Qualifying = 80%+ task completion
          </AppText>

          {/* Streak dots */}
          <View style={styles.dotsRow}>
            {streakDotIds.map((id) => {
              const q = qualifies(id);
              const isCurrent = id === currentWeekId;
              return (
                <View key={id} style={styles.dotSlot}>
                  {isCurrent ? (
                    <PulsingDot qualifying={q} />
                  ) : (
                    <View
                      style={[dotStyles.base, q ? dotStyles.filled : dotStyles.outline]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.dotsLabels}>
            <AppText variant="muted" size="xs">10w ago</AppText>
            <AppText variant="muted" size="xs">Now</AppText>
          </View>
        </AppCard>

        {/* ── Weekly Score (line chart) ─────────────────────────────────── */}
        <AppCard style={styles.chartCard}>
          <AppText weight="semibold" style={styles.chartTitle}>Weekly Score</AppText>
          <AppText variant="muted" size="xs" style={styles.chartSub}>
            AI-generated score per week (0–100), last 12 weeks
          </AppText>

          {scoreData.length < 2 ? (
            <AppText variant="muted" size="sm" style={styles.noData}>
              Generate at least 2 weekly reports to see your score trend
            </AppText>
          ) : (
            <VictoryChart
              width={CHART_W}
              height={CHART_H}
              padding={{ bottom: 52, left: 44, top: 12, right: 16 }}
              domain={{ y: [0, 100] }}
            >
              <VictoryAxis style={AXIS_X_STYLE} />
              <VictoryAxis
                dependentAxis
                style={AXIS_Y_STYLE}
                tickCount={5}
                tickFormat={(t: number) => String(t)}
              />
              <VictoryLine
                data={scoreData}
                style={{ data: { stroke: COLORS.ACCENT, strokeWidth: 2.5 } }}
                interpolation="monotoneX"
              />
            </VictoryChart>
          )}
        </AppCard>

        {/* ── Completion Rate (bar chart) ───────────────────────────────── */}
        <AppCard style={styles.chartCard}>
          <AppText weight="semibold" style={styles.chartTitle}>Completion Rate</AppText>
          <AppText variant="muted" size="xs" style={styles.chartSub}>
            % tasks completed per week, last 12 weeks
          </AppText>

          {completionData.length === 0 ? (
            <AppText variant="muted" size="sm" style={styles.noData}>
              Complete tasks to see your weekly completion rate
            </AppText>
          ) : (
            <>
              <VictoryChart
                width={CHART_W}
                height={CHART_H}
                padding={{ bottom: 52, left: 44, top: 12, right: 16 }}
                domain={{ y: [0, 100] }}
                domainPadding={{ x: 14 }}
              >
                <VictoryAxis style={AXIS_X_STYLE} />
                <VictoryAxis
                  dependentAxis
                  style={AXIS_Y_STYLE}
                  tickCount={5}
                  tickFormat={(t: number) => `${String(t)}%`}
                />
                <VictoryBar
                  data={completionData}
                  style={{
                    data: {
                      fill: ({ datum }: { datum?: unknown }): string =>
                        (datum as CompletionPoint | undefined)?.fill ?? COLORS.DANGER,
                    },
                  }}
                  barRatio={0.7}
                  cornerRadius={{ top: 2 }}
                />
              </VictoryChart>
              <View style={styles.barLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.SUCCESS }]} />
                  <AppText variant="muted" size="xs">≥80% great</AppText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.WARNING }]} />
                  <AppText variant="muted" size="xs">50–79% ok</AppText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.DANGER }]} />
                  <AppText variant="muted" size="xs">{'<50% low'}</AppText>
                </View>
              </View>
            </>
          )}
        </AppCard>

        {/* ── Tasks by Category (stacked bar) ──────────────────────────── */}
        <AppCard style={styles.chartCard}>
          <AppText weight="semibold" style={styles.chartTitle}>Tasks by Category</AppText>
          <AppText variant="muted" size="xs" style={styles.chartSub}>
            Task counts stacked by category, last 8 weeks
          </AppText>

          {chart8.length === 0 ? (
            <AppText variant="muted" size="sm" style={styles.noData}>
              Add tasks to see your category distribution
            </AppText>
          ) : (
            <>
              <VictoryChart
                width={CHART_W}
                height={220}
                padding={{ bottom: 52, left: 44, top: 12, right: 16 }}
                domainPadding={{ x: 14 }}
              >
                <VictoryAxis style={AXIS_X_STYLE} />
                <VictoryAxis
                  dependentAxis
                  style={AXIS_Y_STYLE}
                  tickCount={4}
                  tickFormat={(t: number) => String(Math.round(t))}
                />
                <VictoryStack>
                  {CATEGORIES.map((cat, i) => (
                    <VictoryBar
                      key={cat}
                      data={stackData[i]}
                      style={{ data: { fill: CATEGORY_COLORS[cat] } }}
                      barRatio={0.7}
                    />
                  ))}
                </VictoryStack>
              </VictoryChart>
              <ChartLegend
                items={CATEGORIES.map((c) => ({ label: c, color: CATEGORY_COLORS[c] }))}
              />
            </>
          )}
        </AppCard>

        {/* ── All-time Category Split (donut) ──────────────────────────── */}
        <AppCard style={styles.chartCard}>
          <AppText weight="semibold" style={styles.chartTitle}>All-Time Category Split</AppText>
          <AppText variant="muted" size="xs" style={styles.chartSub}>
            {totalDone} tasks completed across all weeks
          </AppText>

          {pieData.length === 0 ? (
            <AppText variant="muted" size="sm" style={styles.noData}>
              Complete tasks to see your all-time category split
            </AppText>
          ) : (
            <>
              <VictoryPie
                data={pieData}
                width={CHART_W}
                height={220}
                innerRadius={68}
                padding={28}
                colorScale={pieData.map((d) => CATEGORY_COLORS[d.x as TaskCategory])}
                labels={({ datum }: { datum?: unknown }): string =>
                  String((datum as PiePoint | undefined)?.y ?? '')}
                style={{
                  labels: { fill: COLORS.TEXT_PRIMARY, fontSize: 11, fontWeight: '700' },
                }}
              />
              <ChartLegend
                items={pieData.map(({ x, y }) => ({
                  label: x,
                  color: CATEGORY_COLORS[x as TaskCategory],
                  count: y,
                }))}
              />
            </>
          )}
        </AppCard>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  header: { marginBottom: 4 },

  // Streak
  streakCard: { gap: 12 },
  streakTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  streakHero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fire: { fontSize: 36 },
  streakNumbers: { gap: 0 },
  longestBlock: { alignItems: 'flex-end', gap: 2 },
  streakHint: { marginTop: -4 },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dotSlot: { alignItems: 'center', justifyContent: 'center', width: 20, height: 20 },
  dotsLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },

  // Charts
  chartCard: { gap: 8 },
  chartTitle: {},
  chartSub: {},
  noData: { paddingVertical: 24, textAlign: 'center' },

  barLegend: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});

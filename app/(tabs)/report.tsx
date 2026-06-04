import { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { COLORS } from '@/lib/constants';
import { useReportStore } from '@/stores/reportStore';
import { useWeekStore } from '@/stores/weekStore';
import { gradeToLabel } from '@/utils/reportUtils';
import { getWeekLabel } from '@/utils/weekUtils';
import type { WeekGrade } from '@/types';

const GRADE_COLORS: Record<WeekGrade, string> = {
  S: '#EAB308',
  A: COLORS.SUCCESS,
  B: COLORS.ACCENT,
  C: '#F97316',
  D: COLORS.DANGER,
};

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function ReportScreen() {
  const router = useRouter();
  const { currentWeekId, weeks, tasks } = useWeekStore();
  const { reports, loading, loadReport } = useReportStore();

  const report = reports[currentWeekId];
  const week = weeks[currentWeekId];
  const weekTasks = tasks[currentWeekId] ?? [];
  const completedCount = weekTasks.filter((t) => t.done).length;
  const completionPct =
    weekTasks.length > 0 ? Math.round((completedCount / weekTasks.length) * 100) : 0;
  const focusHours = week?.focus_hours ?? 0;

  const dailyInsight =
    typeof report?.raw_json?.dailyActivityInsight === 'string'
      ? report.raw_json.dailyActivityInsight
      : '';
  const priorityAnalysis =
    typeof report?.raw_json?.priorityAnalysis === 'string'
      ? report.raw_json.priorityAnalysis
      : '';

  const opacity = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    loadReport(currentWeekId);
  }, [currentWeekId]);

  useEffect(() => {
    if (report) {
      opacity.value = withTiming(1, { duration: 450 });
    } else {
      opacity.value = 0;
    }
  }, [report]);

  if (loading && !report) return <LoadingScreen />;

  const gradeColor = report ? GRADE_COLORS[report.grade] : COLORS.ACCENT;

  const insights = report
    ? [
        { label: 'Capacity', value: report.capacity_insight, color: COLORS.ACCENT_SECONDARY },
        { label: 'Focus Time', value: report.focus_suggestion, color: COLORS.PINK },
        { label: 'Next Week Goal', value: report.next_week_goal, color: COLORS.SUCCESS },
      ]
    : [];

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
          <Animated.View style={[styles.content, animStyle]}>

            <AppText size="2xl" weight="bold" style={styles.header}>Weekly Report</AppText>

            {/* ── Grade Hero ─────────────────────────────── */}
            <AppCard style={styles.heroCard}>
              <AppText style={[styles.gradeLetter, { color: gradeColor }]}>
                {report.grade}
              </AppText>
              <AppText variant="secondary">{gradeToLabel(report.grade)}</AppText>
              <AppText size="lg" weight="semibold" style={{ color: gradeColor }}>
                {report.overall_score}/100
              </AppText>
              <AppText variant="muted" size="sm">{getWeekLabel(currentWeekId)}</AppText>
              <AppText variant="secondary" style={styles.headline}>{report.headline}</AppText>
            </AppCard>

            {/* ── Stats Row ──────────────────────────────── */}
            <View style={styles.statsRow}>
              <AppCard style={styles.statCard}>
                <AppText size="2xl" weight="bold" style={{ color: COLORS.ACCENT }}>
                  {completionPct}%
                </AppText>
                <AppText variant="muted" size="xs">Completion</AppText>
              </AppCard>
              <AppCard style={styles.statCard}>
                <AppText size="2xl" weight="bold">
                  {completedCount}/{weekTasks.length}
                </AppText>
                <AppText variant="muted" size="xs">Tasks Done</AppText>
              </AppCard>
              <AppCard style={styles.statCard}>
                <AppText size="2xl" weight="bold" style={{ color: COLORS.SUCCESS }}>
                  {focusHours}h
                </AppText>
                <AppText variant="muted" size="xs">Focus Time</AppText>
              </AppCard>
            </View>

            {/* ── Wins ───────────────────────────────────── */}
            <AppCard style={styles.section}>
              <AppText weight="semibold" style={styles.sectionTitle}>Wins</AppText>
              {report.wins.map((win, i) => (
                <View key={i} style={styles.bulletRow}>
                  <AppText style={styles.winBullet}>♦</AppText>
                  <AppText variant="secondary" style={styles.bulletText}>{win}</AppText>
                </View>
              ))}
            </AppCard>

            {/* ── Improvements ───────────────────────────── */}
            <AppCard style={styles.section}>
              <AppText weight="semibold" style={styles.sectionTitle}>Improvements</AppText>
              {report.improvements.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <AppText style={styles.improveBullet}>♦</AppText>
                  <AppText variant="secondary" style={styles.bulletText}>{item}</AppText>
                </View>
              ))}
            </AppCard>

            {/* ── AI Insights ────────────────────────────── */}
            <AppText weight="semibold" style={styles.sectionLabel}>AI Insights</AppText>
            {insights.map(({ label, value, color }) => (
              <View
                key={label}
                style={[
                  styles.insightBox,
                  { borderColor: color, backgroundColor: rgba(color, 0.08) },
                ]}
              >
                <AppText size="xs" weight="bold" style={[styles.insightLabel, { color }]}>
                  {label.toUpperCase()}
                </AppText>
                <AppText variant="secondary" size="sm">{value}</AppText>
              </View>
            ))}

            {/* ── Daily Activity Insight ─────────────────── */}
            {dailyInsight !== '' && (
              <AppCard style={styles.section}>
                <AppText weight="semibold" style={styles.sectionTitle}>Daily Activity</AppText>
                <AppText variant="secondary">{dailyInsight}</AppText>
              </AppCard>
            )}

            {/* ── Priority Analysis ──────────────────────── */}
            {priorityAnalysis !== '' && (
              <AppCard style={styles.section}>
                <AppText weight="semibold" style={styles.sectionTitle}>Priority Analysis</AppText>
                <AppText variant="secondary">{priorityAnalysis}</AppText>
              </AppCard>
            )}

            {/* ── Motivational Note ──────────────────────── */}
            <LinearGradient
              colors={[rgba(COLORS.ACCENT, 0.18), rgba(COLORS.ACCENT_SECONDARY, 0.18)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.motiCard}
            >
              <AppText variant="secondary" style={styles.motiText}>
                {report.motivational_note}
              </AppText>
            </LinearGradient>

          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { flexGrow: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { marginBottom: 4 },

  heroCard: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  gradeLetter: { fontSize: 80, lineHeight: 92, fontWeight: '800' },
  headline: { textAlign: 'center', paddingHorizontal: 8, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },

  section: { gap: 10 },
  sectionTitle: { marginBottom: 2 },
  sectionLabel: { paddingHorizontal: 4 },

  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  winBullet: { color: COLORS.SUCCESS, lineHeight: 22, marginTop: 1 },
  improveBullet: { color: COLORS.WARNING, lineHeight: 22, marginTop: 1 },
  bulletText: { flex: 1, lineHeight: 22 },

  insightBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  insightLabel: { letterSpacing: 0.8 },

  motiCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: rgba(COLORS.ACCENT, 0.2),
  },
  motiText: { fontStyle: 'italic', textAlign: 'center', lineHeight: 26 },
});

import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from './AppText';
import { AppCard } from './AppCard';
import { COLORS } from '@/lib/constants';
import { gradeToLabel } from '@/utils/reportUtils';
import { getWeekLabel } from '@/utils/weekUtils';
import type { Report, Task, WeekGrade } from '@/types';

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

interface ReportViewProps {
  report: Report;
  weekId: string;
  tasks: Task[];
  focusHours: number;
}

const ENTER = (index: number) => FadeInDown.delay(index * 100).duration(350);

export function ReportView({ report, weekId, tasks, focusHours }: ReportViewProps) {
  const completedCount = tasks.filter((t) => t.done).length;
  const completionPct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const gradeColor = GRADE_COLORS[report.grade];

  const dailyInsight =
    typeof report.raw_json?.dailyActivityInsight === 'string'
      ? report.raw_json.dailyActivityInsight
      : '';
  const priorityAnalysis =
    typeof report.raw_json?.priorityAnalysis === 'string'
      ? report.raw_json.priorityAnalysis
      : '';

  const insights = [
    { label: 'Capacity', value: report.capacity_insight, color: COLORS.ACCENT_SECONDARY },
    { label: 'Focus Time', value: report.focus_suggestion, color: COLORS.PINK },
    { label: 'Next Week Goal', value: report.next_week_goal, color: COLORS.SUCCESS },
  ];

  return (
    <View style={styles.container}>

      {/* ── 0: Grade Hero ─────────────────────────────── */}
      <Animated.View entering={ENTER(0)}>
        <AppCard style={styles.heroCard}>
          <AppText style={[styles.gradeLetter, { color: gradeColor }]}>
            {report.grade}
          </AppText>
          <AppText variant="secondary">{gradeToLabel(report.grade)}</AppText>
          <AppText size="lg" weight="semibold" style={{ color: gradeColor }}>
            {report.overall_score}/100
          </AppText>
          <AppText variant="muted" size="sm">{getWeekLabel(weekId)}</AppText>
          <AppText variant="secondary" style={styles.headline}>{report.headline}</AppText>
        </AppCard>
      </Animated.View>

      {/* ── 1: Stats Row ──────────────────────────────── */}
      <Animated.View entering={ENTER(1)}>
        <View style={styles.statsRow}>
          <AppCard style={styles.statCard}>
            <AppText size="2xl" weight="bold" style={{ color: COLORS.ACCENT }}>
              {completionPct}%
            </AppText>
            <AppText variant="muted" size="xs">Completion</AppText>
          </AppCard>
          <AppCard style={styles.statCard}>
            <AppText size="2xl" weight="bold">
              {completedCount}/{tasks.length}
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
      </Animated.View>

      {/* ── 2: Wins ───────────────────────────────────── */}
      <Animated.View entering={ENTER(2)}>
        <AppCard style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>Wins</AppText>
          {report.wins.map((win, i) => (
            <View key={i} style={styles.bulletRow}>
              <AppText style={styles.winBullet}>♦</AppText>
              <AppText variant="secondary" style={styles.bulletText}>{win}</AppText>
            </View>
          ))}
        </AppCard>
      </Animated.View>

      {/* ── 3: Improvements ───────────────────────────── */}
      <Animated.View entering={ENTER(3)}>
        <AppCard style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>Improvements</AppText>
          {report.improvements.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <AppText style={styles.improveBullet}>♦</AppText>
              <AppText variant="secondary" style={styles.bulletText}>{item}</AppText>
            </View>
          ))}
        </AppCard>
      </Animated.View>

      {/* ── 4: AI Insights ────────────────────────────── */}
      <Animated.View entering={ENTER(4)} style={styles.insightsGroup}>
        <AppText weight="semibold" style={styles.sectionLabel}>AI Insights</AppText>
        {insights.map(({ label, value, color }) => (
          <View
            key={label}
            style={[styles.insightBox, { borderColor: color, backgroundColor: rgba(color, 0.08) }]}
          >
            <AppText size="xs" weight="bold" style={[styles.insightLabel, { color }]}>
              {label.toUpperCase()}
            </AppText>
            <AppText variant="secondary" size="sm">{value}</AppText>
          </View>
        ))}
      </Animated.View>

      {/* ── 5: Daily Activity (conditional) ───────────── */}
      {dailyInsight !== '' && (
        <Animated.View entering={ENTER(5)}>
          <AppCard style={styles.section}>
            <AppText weight="semibold" style={styles.sectionTitle}>Daily Activity</AppText>
            <AppText variant="secondary">{dailyInsight}</AppText>
          </AppCard>
        </Animated.View>
      )}

      {/* ── 6: Priority Analysis (conditional) ────────── */}
      {priorityAnalysis !== '' && (
        <Animated.View entering={ENTER(6)}>
          <AppCard style={styles.section}>
            <AppText weight="semibold" style={styles.sectionTitle}>Priority Analysis</AppText>
            <AppText variant="secondary">{priorityAnalysis}</AppText>
          </AppCard>
        </Animated.View>
      )}

      {/* ── 7: Motivational Note ──────────────────────── */}
      <Animated.View entering={ENTER(7)}>
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },

  heroCard: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  gradeLetter: { fontSize: 80, lineHeight: 92, fontWeight: '800' },
  headline: { textAlign: 'center', paddingHorizontal: 8, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },

  section: { gap: 10 },
  sectionTitle: { marginBottom: 2 },
  sectionLabel: { paddingHorizontal: 4 },

  insightsGroup: { gap: 12 },

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

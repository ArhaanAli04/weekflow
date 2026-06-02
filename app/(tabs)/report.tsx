import { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { COLORS } from '@/lib/constants';
import { useReportStore } from '@/stores/reportStore';
import { useWeekStore } from '@/stores/weekStore';
import { gradeToLabel } from '@/utils/reportUtils';

export default function ReportScreen() {
  const { currentWeekId } = useWeekStore();
  const { reports, loading, error, loadReport, generateReport, clearError } =
    useReportStore();

  const report = reports[currentWeekId];

  useEffect(() => {
    loadReport(currentWeekId);
  }, [currentWeekId]);

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText size="2xl" weight="bold" style={styles.header}>Weekly Report</AppText>

        {!report ? (
          <EmptyState
            title="No report yet"
            description="Generate your AI-powered performance report for this week."
            actionLabel="Generate Report"
            onAction={() => generateReport(currentWeekId)}
          />
        ) : (
          <>
            <AppCard style={styles.scoreCard}>
              <AppText size="3xl" weight="bold" style={styles.grade}>
                {report.grade}
              </AppText>
              <AppText variant="secondary">{gradeToLabel(report.grade)}</AppText>
              <AppText size="lg" weight="semibold" style={styles.score}>
                {report.overall_score}/100
              </AppText>
              <AppText variant="secondary" style={styles.headline}>
                {report.headline}
              </AppText>
            </AppCard>

            <AppCard style={styles.section}>
              <AppText weight="semibold" style={styles.sectionTitle}>Wins</AppText>
              {report.wins.map((win, i) => (
                <AppText key={i} variant="secondary" style={styles.bullet}>
                  • {win}
                </AppText>
              ))}
            </AppCard>

            <AppCard style={styles.section}>
              <AppText weight="semibold" style={styles.sectionTitle}>Improvements</AppText>
              {report.improvements.map((item, i) => (
                <AppText key={i} variant="secondary" style={styles.bullet}>
                  • {item}
                </AppText>
              ))}
            </AppCard>

            <AppCard style={styles.section}>
              <AppText weight="semibold" style={styles.sectionTitle}>Next Week Goal</AppText>
              <AppText variant="secondary">{report.next_week_goal}</AppText>
            </AppCard>

            <AppCard style={styles.section}>
              <AppText variant="secondary" style={styles.motivational}>
                {report.motivational_note}
              </AppText>
            </AppCard>
          </>
        )}

        {error !== null && (
          <View style={styles.errorRow}>
            <AppText style={{ color: COLORS.DANGER }}>{error}</AppText>
            <AppButton label="Retry" variant="secondary" size="sm" onPress={() => { clearError(); generateReport(currentWeekId); }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, gap: 12, flexGrow: 1 },
  header: { marginBottom: 8 },
  scoreCard: { alignItems: 'center', gap: 6 },
  grade: { color: COLORS.ACCENT, fontSize: 56 },
  score: { color: COLORS.TEXT_SECONDARY },
  headline: { textAlign: 'center' },
  section: { gap: 8 },
  sectionTitle: { marginBottom: 4 },
  bullet: { lineHeight: 22 },
  motivational: { fontStyle: 'italic', textAlign: 'center' },
  errorRow: { gap: 8, alignItems: 'center' },
});

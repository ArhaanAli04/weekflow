import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { COLORS } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';
import { getWeekLabel, getPreviousWeekId } from '@/utils/weekUtils';

export default function HistoryScreen() {
  const router = useRouter();
  const { currentWeekId, weeks } = useWeekStore();

  const pastWeekIds: string[] = [];
  let id = getPreviousWeekId(currentWeekId);
  for (let i = 0; i < 12; i++) {
    pastWeekIds.push(id);
    id = getPreviousWeekId(id);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText size="2xl" weight="bold" style={styles.header}>History</AppText>

        {pastWeekIds.map((weekId) => (
          <TouchableOpacity
            key={weekId}
            onPress={() => router.push(`/history/${weekId}`)}
            activeOpacity={0.7}
          >
            <AppCard style={styles.card}>
              <AppText weight="medium">{getWeekLabel(weekId)}</AppText>
              {weeks[weekId] ? (
                <AppText variant="secondary" size="sm">
                  {weeks[weekId].label}
                </AppText>
              ) : null}
            </AppCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, gap: 12 },
  header: { marginBottom: 8 },
  card: { gap: 4 },
});

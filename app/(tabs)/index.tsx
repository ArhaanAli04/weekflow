import { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { COLORS } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';
import { useAuthStore } from '@/stores/authStore';
import { getWeekLabel } from '@/utils/weekUtils';

export default function ThisWeekScreen() {
  const { user } = useAuthStore();
  const { currentWeekId, weeks, tasks, isLoading, loadCurrentWeek } = useWeekStore();

  useEffect(() => {
    loadCurrentWeek();
  }, [currentWeekId]);

  if (isLoading) return <LoadingScreen />;

  const week = weeks[currentWeekId];
  const weekTasks = tasks[currentWeekId] ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <AppText size="2xl" weight="bold">This Week</AppText>
          <AppText variant="secondary" size="sm">
            {getWeekLabel(currentWeekId)}
          </AppText>
        </View>

        {weekTasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Add tasks to start tracking your week."
          />
        ) : (
          weekTasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <AppText
                variant={task.done ? 'muted' : 'primary'}
                style={task.done ? styles.doneText : undefined}
              >
                {task.title}
              </AppText>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, flexGrow: 1 },
  header: { marginBottom: 24, gap: 4 },
  taskRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  doneText: { textDecorationLine: 'line-through' },
});

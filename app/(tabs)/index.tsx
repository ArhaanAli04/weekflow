import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
export { RouteErrorFallback as ErrorBoundary } from '@/components/ScreenErrorBoundary';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import {
  AppText,
  AppCard,
  WeekProgressBar,
  CategoryBreakdown,
  TaskCard,
  AddTaskModal,
  CarryOverModal,
  TaskListSkeleton,
} from '@/components';
import { COLORS, PRIORITY_COLORS } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';
import { useReportStore } from '@/stores/reportStore';
import { useJournalStore } from '@/stores/journalStore';
import { getWeekLabel, getDatesInWeek, getPreviousWeekId } from '@/utils/weekUtils';
import type { TaskPriority } from '@/types';

const CARRYOVER_STORE_KEY = 'carryover_shown_week';

const storage = {
  getItem: (key: string): Promise<string | null> =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    Platform.OS === 'web'
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
};

const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

function toDateString(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export default function ThisWeekScreen() {
  const router = useRouter();
  const {
    currentWeekId,
    weeks,
    tasks,
    lastWeekUnfinished,
    loading,
    loadCurrentWeek,
    createWeekIfNotExists,
    updateWeek,
    toggleTask,
    deleteTask,
    loadTasksForWeek,
    loadLastWeekUnfinished,
  } = useWeekStore();
  const {
    streaks,
    loadStreak,
    generateReport,
    updateStreak,
    loading: reportLoading,
    error: reportError,
    clearError,
  } = useReportStore();
  const { logs, loadWeekLogs } = useJournalStore();

  const week = weeks[currentWeekId];
  const weekTasks = tasks[currentWeekId] ?? [];

  const [intentionText, setIntentionText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCarryOver, setShowCarryOver] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const prevWeekId = getPreviousWeekId(currentWeekId);

  const intentionDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      await createWeekIfNotExists(currentWeekId);
      await loadCurrentWeek();
      await loadTasksForWeek(currentWeekId);

      const shown = await storage.getItem(CARRYOVER_STORE_KEY);
      if (shown !== currentWeekId) {
        await loadLastWeekUnfinished(prevWeekId);
        const unfinished = useWeekStore.getState().lastWeekUnfinished;
        if (unfinished.length > 0) {
          await storage.setItem(CARRYOVER_STORE_KEY, currentWeekId);
          setShowCarryOver(true);
        }
      }
    })();
    loadStreak();
    loadWeekLogs(currentWeekId);
  }, [currentWeekId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadCurrentWeek(),
      loadTasksForWeek(currentWeekId),
      loadStreak(),
      loadWeekLogs(currentWeekId),
    ]);
    setRefreshing(false);
  }, [currentWeekId]);

  const handleReviewLastWeek = async () => {
    await loadLastWeekUnfinished(prevWeekId);
    setShowCarryOver(true);
  };

  useEffect(() => {
    setIntentionText(week?.intention ?? '');
  }, [week?.intention]);

  useEffect(() => {
    if (week?.timer_running && week.timer_started_at) {
      const startMs = new Date(week.timer_started_at).getTime();
      const tick = () => setTimerSeconds(Math.floor((Date.now() - startMs) / 1000));
      tick();
      timerInterval.current = setInterval(tick, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
      setTimerSeconds(0);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [week?.timer_running, week?.timer_started_at]);

  useEffect(() => {
    return () => {
      if (intentionDebounce.current) clearTimeout(intentionDebounce.current);
    };
  }, []);

  const handleIntentionChange = (text: string) => {
    setIntentionText(text);
    if (intentionDebounce.current) clearTimeout(intentionDebounce.current);
    intentionDebounce.current = setTimeout(() => {
      updateWeek(currentWeekId, { intention: text });
    }, 500);
  };

  const handleStartTimer = () => {
    updateWeek(currentWeekId, {
      timer_running: true,
      timer_started_at: new Date().toISOString(),
    });
  };

  const handleStopTimer = () => {
    if (!week?.timer_started_at) return;
    const elapsedHours = (Date.now() - new Date(week.timer_started_at).getTime()) / 3_600_000;
    const rounded = Math.round(elapsedHours * 2) / 2;
    updateWeek(currentWeekId, {
      timer_running: false,
      timer_started_at: null,
      focus_hours: (week.focus_hours ?? 0) + rounded,
    });
  };

  const handleAdjustHours = (delta: number) => {
    if (!week) return;
    const next = Math.max(0, +((week.focus_hours ?? 0) + delta).toFixed(1));
    updateWeek(currentWeekId, { focus_hours: next });
  };

  const handleGenerateReport = async () => {
    if (!week) {
      Toast.show({
        type: 'error',
        text1: 'Week not ready',
        text2: 'Pull down to refresh and try again.',
        visibilityTime: 3000,
      });
      return;
    }
    if (weekTasks.length === 0) {
      Alert.alert(
        'No tasks yet',
        'Add some tasks first before generating your report.',
        [{ text: 'OK' }],
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await generateReport(currentWeekId);
    const { error: genError } = useReportStore.getState();
    if (genError) {
      Toast.show({
        type: 'error',
        text1: 'Report generation failed',
        text2: genError,
        visibilityTime: 4000,
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Report generated!',
        text2: 'Your weekly report is ready',
        visibilityTime: 3000,
      });
      await updateStreak(currentWeekId, completionRate);
      router.push('/(tabs)/report');
    }
  };

  const formatTimer = () => {
    const h = Math.floor(timerSeconds / 3600);
    const m = Math.floor((timerSeconds % 3600) / 60);
    const s = timerSeconds % 60;
    return h > 0
      ? `+${h}h ${m}m running`
      : `+${m}m ${String(s).padStart(2, '0')}s running`;
  };

  const weekDates = getDatesInWeek(currentWeekId).map(toDateString);
  const journalledDays = weekDates.filter((d) => !!logs[d]).length;
  const completedCount = weekTasks.filter((t) => t.done).length;
  const completionRate = weekTasks.length > 0 ? Math.round((completedCount / weekTasks.length) * 100) : 0;
  const totalHours = weekTasks.reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0);
  const canGenerate = !reportLoading && !!week;

  if (loading && !week) {
    return (
      <SafeAreaView style={styles.container}>
        <TaskListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.ACCENT}
            colors={[COLORS.ACCENT]}
          />
        }
      >

        {/* ── Header ──────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <AppText size="2xl" weight="bold">This Week</AppText>
            <AppText variant="secondary" size="sm">{getWeekLabel(currentWeekId)}</AppText>
          </View>
          <View style={styles.headerRight}>
            {streaks !== null && streaks.current_streak >= 2 && (
              <View style={styles.streakBadge}>
                <AppText size="xs" weight="semibold" style={styles.streakText}>
                  🔥 {streaks.current_streak} week streak
                </AppText>
              </View>
            )}
            <Pressable onPress={handleReviewLastWeek} hitSlop={8} style={styles.reviewBtn}>
              <AppText size="xs" weight="semibold" style={styles.reviewText}>↩ Last Week</AppText>
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
              <Ionicons name="settings-outline" size={24} color={COLORS.TEXT_SECONDARY} />
            </Pressable>
          </View>
        </View>

        {/* ── Progress ────────────────────────────────── */}
        <AppCard style={styles.card}>
          <WeekProgressBar
            completed={completedCount}
            total={weekTasks.length}
            totalHours={totalHours}
          />
          {weekTasks.length > 0 && <CategoryBreakdown tasks={weekTasks} />}
          <AppText variant="muted" size="xs">
            {journalledDays}/7 days journaled
          </AppText>
        </AppCard>

        {/* ── Intention ───────────────────────────────── */}
        <AppCard style={styles.card}>
          <AppText size="sm" weight="semibold" variant="secondary">Weekly Intention</AppText>
          <TextInput
            value={intentionText}
            onChangeText={handleIntentionChange}
            placeholder="What do you want to focus on this week?"
            placeholderTextColor={COLORS.TEXT_MUTED}
            style={styles.intentionInput}
            multiline
            maxLength={200}
          />
          <AppText variant="muted" size="xs" style={styles.right}>
            {intentionText.length}/200
          </AppText>
        </AppCard>

        {/* ── Energy ──────────────────────────────────── */}
        <AppCard style={styles.card}>
          <AppText size="sm" weight="semibold" variant="secondary">Energy this week</AppText>
          {(['start', 'end'] as const).map((kind) => {
            const stored = kind === 'start' ? week?.energy_start : week?.energy_end;
            const onSelect = (val: number) =>
              updateWeek(
                currentWeekId,
                kind === 'start' ? { energy_start: val } : { energy_end: val },
              );
            return (
              <View key={kind} style={styles.energyRow}>
                <AppText variant="muted" size="xs" style={styles.energyLabel}>
                  {kind === 'start' ? 'Start' : 'End'}
                </AppText>
                <View style={styles.energyBtns}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <Pressable
                      key={val}
                      onPress={() => onSelect(val)}
                      style={[styles.energyBtn, stored === val && styles.energyBtnActive]}
                    >
                      <AppText
                        size="sm"
                        weight={stored === val ? 'bold' : 'normal'}
                        style={stored === val ? { color: COLORS.ACCENT } : undefined}
                      >
                        {val}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </AppCard>

        {/* ── Focus Time ──────────────────────────────── */}
        <AppCard style={styles.card}>
          <AppText size="sm" weight="semibold" variant="secondary">Focus Time</AppText>
          <View style={styles.focusRow}>
            <Pressable onPress={() => handleAdjustHours(-0.5)} hitSlop={12} style={styles.adjBtn}>
              <AppText size="xl" weight="bold" variant="secondary">−</AppText>
            </Pressable>
            <View style={styles.focusCenter}>
              <AppText size="3xl" weight="bold">{week?.focus_hours ?? 0}h</AppText>
              {week?.timer_running === true && (
                <AppText size="xs" style={styles.timerLive}>{formatTimer()}</AppText>
              )}
            </View>
            <Pressable onPress={() => handleAdjustHours(0.5)} hitSlop={12} style={styles.adjBtn}>
              <AppText size="xl" weight="bold" variant="secondary">+</AppText>
            </Pressable>
          </View>
          <Pressable
            onPress={week?.timer_running ? handleStopTimer : handleStartTimer}
            style={[styles.timerBtn, week?.timer_running === true && styles.timerBtnStop]}
          >
            <Ionicons
              name={week?.timer_running ? 'stop-circle-outline' : 'play-circle-outline'}
              size={16}
              color={week?.timer_running ? COLORS.DANGER : COLORS.SUCCESS}
            />
            <AppText
              size="sm"
              weight="semibold"
              style={{ color: week?.timer_running ? COLORS.DANGER : COLORS.SUCCESS }}
            >
              {week?.timer_running ? 'Stop Timer' : 'Start Timer'}
            </AppText>
          </Pressable>
        </AppCard>

        {/* ── Tasks by priority ───────────────────────── */}
        {PRIORITIES.map((priority) => {
          const pt = weekTasks.filter((t) => t.priority === priority);
          return (
            <View key={priority} style={styles.prioritySection}>
              <View style={styles.priorityHeader}>
                <View
                  style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[priority] }]}
                />
                <AppText weight="semibold" style={{ color: PRIORITY_COLORS[priority] }}>
                  {priority}
                </AppText>
                <AppText variant="muted" size="xs">
                  {pt.filter((t) => t.done).length}/{pt.length}
                </AppText>
              </View>
              {pt.length === 0 ? (
                <View style={styles.emptyGroup}>
                  <AppText variant="muted" size="sm">
                    No {priority.toLowerCase()} tasks yet
                  </AppText>
                </View>
              ) : (
                <View style={styles.taskList}>
                  {pt.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      onToggle={(id) => toggleTask(id, currentWeekId)}
                      onDelete={(id) => deleteTask(id, currentWeekId)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Generate Report ─────────────────────────── */}
        {reportError !== null && (
          <View style={styles.errorRow}>
            <AppText size="sm" style={[{ color: COLORS.DANGER }, styles.errorText]} numberOfLines={2}>
              {reportError}
            </AppText>
            <View style={styles.errorActions}>
              <Pressable onPress={handleGenerateReport} hitSlop={8}>
                <AppText size="xs" weight="semibold" style={{ color: COLORS.ACCENT }}>Retry</AppText>
              </Pressable>
              <Pressable onPress={clearError} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={COLORS.DANGER} />
              </Pressable>
            </View>
          </View>
        )}
        <Pressable
          onPress={canGenerate ? handleGenerateReport : undefined}
          disabled={!canGenerate}
          accessibilityRole="button"
          accessibilityLabel="Generate weekly report"
        >
          <LinearGradient
            colors={canGenerate ? ['#6366F1', '#EC4899'] : ['#2a2a3a', '#2a2a3a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBtn}
          >
            <Ionicons name="sparkles-outline" size={18} color={COLORS.TEXT_PRIMARY} />
            <AppText weight="semibold">Generate Report</AppText>
          </LinearGradient>
        </Pressable>

        <View style={styles.fabSpacer} />
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────── */}
      <Pressable
        onPress={() => setShowModal(true)}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Add task"
      >
        <Ionicons name="add" size={28} color={COLORS.TEXT_PRIMARY} />
      </Pressable>

      <Modal visible={reportLoading} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={COLORS.ACCENT} />
            <AppText weight="semibold" style={styles.overlayTitle}>Analysing your week...</AppText>
            <AppText variant="muted" size="sm">This may take a moment</AppText>
          </View>
        </View>
      </Modal>

      <AddTaskModal
        visible={showModal}
        weekId={currentWeekId}
        onClose={() => setShowModal(false)}
      />

      <CarryOverModal
        visible={showCarryOver}
        tasks={lastWeekUnfinished}
        currentWeekId={currentWeekId}
        lastWeekId={prevWeekId}
        onClose={() => setShowCarryOver(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, gap: 12 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  streakBadge: {
    backgroundColor: 'rgba(255,107,0,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: { color: '#FF6B00' },
  reviewBtn: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reviewText: { color: COLORS.ACCENT },

  card: { gap: 10 },
  right: { textAlign: 'right' },

  intentionInput: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: 4,
  },

  energyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  energyLabel: { width: 28 },
  energyBtns: { flexDirection: 'row', gap: 8 },
  energyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyBtnActive: {
    borderColor: COLORS.ACCENT,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },

  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusCenter: { alignItems: 'center', gap: 2 },
  timerLive: { color: COLORS.SUCCESS },
  adjBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
  },
  timerBtnStop: { borderColor: 'rgba(239,68,68,0.4)' },

  prioritySection: { gap: 0 },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  emptyGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  taskList: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: { flex: 1 },
  errorActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    minWidth: 240,
  },
  overlayTitle: { color: COLORS.TEXT_PRIMARY },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSpacer: { height: 80 },
});

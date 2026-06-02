import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, AppCard, LoadingScreen } from '@/components';
import { COLORS, VALIDATION } from '@/lib/constants';
import { useJournalStore } from '@/stores/journalStore';
import { useWeekStore } from '@/stores/weekStore';
import { getDatesInWeek, getDayLabel, getWeekLabel } from '@/utils/weekUtils';

const DAY_PLACEHOLDERS: Record<string, string> = {
  Monday: 'e.g. Had a productive morning, skipped gym',
  Tuesday: 'e.g. Finished the project draft, went for a run',
  Wednesday: 'e.g. Watched a movie, played FIFA with friends',
  Thursday: 'e.g. Team lunch, late coding session',
  Friday: 'e.g. Wrapped up the week, went out for dinner',
  Saturday: 'e.g. Weekend chores, visited family',
  Sunday: 'e.g. Rest day, meal prepped for the week',
};

function toDateString(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export default function JournalScreen() {
  const { currentWeekId } = useWeekStore();
  const { logs, loading, loadWeekLogs, upsertLog } = useJournalStore();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const today = toDateString(new Date());
  const weekDates = getDatesInWeek(currentWeekId).map(toDateString);

  useEffect(() => {
    loadWeekLogs(currentWeekId);
  }, [currentWeekId]);

  // Populate drafts from loaded logs, but never overwrite a value the user
  // has already typed in this session (undefined means untouched).
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const [date, log] of Object.entries(logs)) {
        if (next[date] === undefined) {
          next[date] = log.content;
        }
      }
      return next;
    });
  }, [logs]);

  useEffect(() => {
    return () => {
      Object.values(debounceRefs.current).forEach(clearTimeout);
    };
  }, []);

  const handleChange = (date: string, text: string) => {
    setDrafts((prev) => ({ ...prev, [date]: text }));
  };

  const handleBlur = (date: string) => {
    const content = drafts[date] ?? '';
    if (debounceRefs.current[date]) clearTimeout(debounceRefs.current[date]);
    debounceRefs.current[date] = setTimeout(() => {
      if (content.trim()) upsertLog(date, content);
    }, 300);
  };

  const daysWithEntries = weekDates.filter((d) => (drafts[d] ?? '').trim().length > 0).length;
  const totalChars = weekDates.reduce((sum, d) => sum + (drafts[d] ?? '').length, 0);

  if (loading && Object.keys(logs).length === 0) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <AppText size="2xl" weight="bold">Daily Journal</AppText>
            <AppText variant="secondary" size="sm">{getWeekLabel(currentWeekId)}</AppText>
          </View>

          {weekDates.map((date) => {
            const isToday = date === today;
            const isFuture = date > today;
            // Parse at local noon to avoid DST-driven day shifts
            const dayName = getDayLabel(new Date(date + 'T12:00:00'));
            const value = drafts[date] ?? '';
            const charCount = value.length;
            const nearLimit = charCount >= VALIDATION.JOURNAL_MAX - 50;
            const atLimit = charCount >= VALIDATION.JOURNAL_MAX;

            return (
              <View
                key={date}
                style={[
                  styles.dayCard,
                  isToday && styles.dayCardToday,
                  isFuture && styles.dayCardFuture,
                ]}
              >
                <View style={styles.dayHeader}>
                  <AppText
                    weight={isToday ? 'bold' : 'semibold'}
                    style={isToday ? { color: COLORS.ACCENT } : undefined}
                  >
                    {dayName}
                  </AppText>
                  <AppText variant="muted" size="xs">{date}</AppText>
                </View>

                <TextInput
                  value={value}
                  onChangeText={(text) => handleChange(date, text)}
                  onBlur={() => handleBlur(date)}
                  placeholder={DAY_PLACEHOLDERS[dayName] ?? 'What happened today?'}
                  placeholderTextColor={COLORS.TEXT_MUTED}
                  style={[styles.input, isFuture && styles.inputFuture]}
                  multiline
                  maxLength={VALIDATION.JOURNAL_MAX}
                  editable={!isFuture}
                  textAlignVertical="top"
                  scrollEnabled={false}
                />

                <AppText
                  size="xs"
                  style={[
                    styles.charCount,
                    nearLimit && !atLimit ? { color: COLORS.WARNING } : undefined,
                    atLimit ? { color: COLORS.DANGER } : undefined,
                  ]}
                >
                  {charCount}/{VALIDATION.JOURNAL_MAX}
                </AppText>
              </View>
            );
          })}

          <AppCard style={styles.summary}>
            <AppText variant="secondary" size="sm" weight="semibold">Week Summary</AppText>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <AppText size="2xl" weight="bold" style={{ color: COLORS.ACCENT }}>
                  {daysWithEntries}
                </AppText>
                <AppText variant="muted" size="xs">days journaled</AppText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <AppText size="2xl" weight="bold">
                  {totalChars}
                </AppText>
                <AppText variant="muted" size="xs">chars written</AppText>
              </View>
            </View>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  flex: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  header: { gap: 2, marginBottom: 4 },

  dayCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: 14,
    gap: 8,
  },
  dayCardToday: {
    borderColor: COLORS.ACCENT,
    borderWidth: 1.5,
  },
  dayCardFuture: {
    opacity: 0.45,
  },

  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  input: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 64,
    paddingTop: 2,
  },
  inputFuture: {
    color: COLORS.TEXT_MUTED,
  },

  charCount: {
    color: COLORS.TEXT_MUTED,
    textAlign: 'right',
  },

  summary: {
    gap: 12,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.BORDER,
  },
});

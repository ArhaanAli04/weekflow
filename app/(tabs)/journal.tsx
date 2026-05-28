import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { COLORS, VALIDATION } from '@/lib/constants';
import { useJournalStore } from '@/stores/journalStore';
import { useAuthStore } from '@/stores/authStore';
import { useWeekStore } from '@/stores/weekStore';

export default function JournalScreen() {
  const { user } = useAuthStore();
  const { currentWeekId } = useWeekStore();
  const { logs, isLoading, loadLogs, saveLog } = useJournalStore();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const weekLogs = logs[currentWeekId] ?? [];
  const todayLog = weekLogs.find((l) => l.log_date === today);

  useEffect(() => {
    loadLogs(currentWeekId);
  }, [currentWeekId]);

  useEffect(() => {
    setContent(todayLog?.content ?? '');
  }, [todayLog?.content]);

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    setIsSaving(true);
    await saveLog({
      week_id: currentWeekId,
      user_id: user.id,
      log_date: today,
      content: content.trim(),
    });
    setIsSaving(false);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <AppText size="2xl" weight="bold" style={styles.header}>Daily Journal</AppText>

          <AppCard style={styles.card}>
            <AppText variant="secondary" size="sm" style={styles.dateLabel}>
              Today — {today}
            </AppText>
            <AppInput
              value={content}
              onChangeText={setContent}
              placeholder="What happened today? Movies watched, workouts, social events..."
              multiline
              numberOfLines={5}
              maxLength={VALIDATION.JOURNAL_MAX}
              showCharCount
              style={styles.textArea}
            />
            <AppButton
              label="Save Entry"
              onPress={handleSave}
              loading={isSaving}
              style={styles.saveBtn}
            />
          </AppCard>

          {weekLogs.filter((l) => l.log_date !== today).map((log) => (
            <AppCard key={log.id} style={styles.card}>
              <AppText variant="secondary" size="sm" style={styles.dateLabel}>
                {log.log_date}
              </AppText>
              <AppText>{log.content}</AppText>
            </AppCard>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  flex: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  header: { marginBottom: 16 },
  card: { gap: 12 },
  dateLabel: { marginBottom: 4 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  saveBtn: { alignSelf: 'flex-end' },
});

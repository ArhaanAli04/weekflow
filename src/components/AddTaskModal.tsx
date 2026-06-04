import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { AppText } from './AppText';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { COLORS, CATEGORY_COLORS, PRIORITY_COLORS, VALIDATION } from '@/lib/constants';
import { useWeekStore } from '@/stores/weekStore';
import type { TaskCategory, TaskPriority } from '@/types';

const CATEGORIES: TaskCategory[] = ['Work', 'Health', 'Personal', 'Learning', 'Other'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

interface AddTaskModalProps {
  visible: boolean;
  weekId: string;
  onClose: () => void;
}

export function AddTaskModal({ visible, weekId, onClose }: AddTaskModalProps) {
  const { addTask } = useWeekStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();

  const reset = () => {
    setTitle('');
    setCategory('Work');
    setPriority('Medium');
    setEstimatedHours(1);
    setTitleError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Task title is required');
      return;
    }
    setTitleError(undefined);
    setLoading(true);
    await addTask(weekId, {
      week_id: weekId,
      title: trimmed,
      category,
      priority,
      estimated_hours: estimatedHours,
    });
    setLoading(false);
    Toast.show({ type: 'success', text1: 'Task added', visibilityTime: 2000 });
    handleClose();
  };

  const stepHours = (delta: number) => {
    setEstimatedHours((h) => {
      const next = +(h + delta).toFixed(1);
      return Math.max(0.5, Math.min(24, next));
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText size="xl" weight="bold">Add Task</AppText>
            <Pressable onPress={handleClose} hitSlop={8}>
              <AppText variant="muted">Cancel</AppText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <AppInput
              label="Task title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Finish quarterly report"
              maxLength={VALIDATION.TASK_TITLE_MAX}
              showCharCount
              error={titleError}
              returnKeyType="done"
            />

            <AppText size="sm" weight="medium" style={styles.fieldLabel}>Category</AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {CATEGORIES.map((cat) => (
                <Pressable key={cat} onPress={() => setCategory(cat)}>
                  <View
                    style={[
                      styles.pill,
                      { borderColor: CATEGORY_COLORS[cat] },
                      category === cat && { backgroundColor: CATEGORY_COLORS[cat] + '33' },
                    ]}
                  >
                    <AppText
                      size="sm"
                      weight={category === cat ? 'semibold' : 'normal'}
                      style={{ color: CATEGORY_COLORS[cat] }}
                    >
                      {cat}
                    </AppText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <AppText size="sm" weight="medium" style={styles.fieldLabel}>Priority</AppText>
            <View style={styles.pillRow}>
              {PRIORITIES.map((pri) => (
                <Pressable key={pri} onPress={() => setPriority(pri)}>
                  <View
                    style={[
                      styles.pill,
                      { borderColor: PRIORITY_COLORS[pri] },
                      priority === pri && { backgroundColor: PRIORITY_COLORS[pri] + '33' },
                    ]}
                  >
                    <AppText
                      size="sm"
                      weight={priority === pri ? 'semibold' : 'normal'}
                      style={{ color: PRIORITY_COLORS[pri] }}
                    >
                      {pri}
                    </AppText>
                  </View>
                </Pressable>
              ))}
            </View>

            <AppText size="sm" weight="medium" style={styles.fieldLabel}>Estimated Hours</AppText>
            <View style={styles.stepper}>
              <Pressable onPress={() => stepHours(-0.5)} style={styles.stepBtn} hitSlop={12}>
                <AppText size="xl" weight="bold" style={styles.stepSymbol}>−</AppText>
              </Pressable>
              <AppText size="lg" weight="semibold" style={styles.stepValue}>
                {estimatedHours}h
              </AppText>
              <Pressable onPress={() => stepHours(0.5)} style={styles.stepBtn} hitSlop={12}>
                <AppText size="xl" weight="bold" style={styles.stepSymbol}>+</AppText>
              </Pressable>
            </View>
          </ScrollView>

          <AppButton
            label="Add Task"
            onPress={handleAdd}
            loading={loading}
            style={styles.addBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.BORDER,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '85%' as unknown as number,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  body: {
    padding: 20,
    gap: 4,
  },
  fieldLabel: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: 16,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepBtn: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSymbol: {
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 24,
  },
  stepValue: {
    minWidth: 48,
    textAlign: 'center',
  },
  addBtn: {
    marginHorizontal: 20,
    marginTop: 8,
  },
});

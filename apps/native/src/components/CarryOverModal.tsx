import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { AppBadge } from './AppBadge';
import { COLORS, CATEGORY_COLORS, PRIORITY_COLORS } from '@weekflow/shared/lib/constants';
import { useWeekStore } from '@weekflow/shared/stores';
import { getWeekLabel } from '@weekflow/shared/utils/weekUtils';
import type { Task } from '@weekflow/shared/types';

interface CarryOverModalProps {
  visible: boolean;
  tasks: Task[];
  currentWeekId: string;
  lastWeekId: string;
  onClose: () => void;
}

export function CarryOverModal({
  visible,
  tasks,
  currentWeekId,
  lastWeekId,
  onClose,
}: CarryOverModalProps) {
  const { carryOverTasks } = useWeekStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Pre-select all tasks whenever the modal opens with a new task list
  useEffect(() => {
    if (visible) {
      setSelected(new Set(tasks.map((t) => t.id)));
    }
  }, [visible, tasks]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCarryOver = async () => {
    const picked = tasks.filter((t) => selected.has(t.id));
    if (picked.length === 0) return;
    setLoading(true);
    await carryOverTasks(currentWeekId, picked);
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText size="xl" weight="bold">Carry Over Tasks</AppText>
            <AppText variant="muted" size="xs">{getWeekLabel(lastWeekId)}</AppText>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={COLORS.TEXT_SECONDARY} />
          </Pressable>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="secondary" style={styles.emptyText}>
              No unfinished tasks from last week.
            </AppText>
          </View>
        ) : (
          <>
            <AppText variant="muted" size="xs" style={styles.hint}>
              {selected.size} of {tasks.length} selected
            </AppText>

            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {tasks.map((task) => {
                const isSelected = selected.has(task.id);
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => toggle(task.id)}
                    style={[styles.row, isSelected && styles.rowSelected]}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? COLORS.ACCENT : COLORS.TEXT_MUTED}
                    />
                    <View style={styles.rowContent}>
                      <AppText
                        weight="medium"
                        variant={isSelected ? 'primary' : 'secondary'}
                      >
                        {task.title}
                      </AppText>
                      <View style={styles.rowMeta}>
                        <AppBadge label={task.category} color={CATEGORY_COLORS[task.category]} />
                        <AppBadge label={task.priority} color={PRIORITY_COLORS[task.priority]} />
                        <AppText variant="muted" size="xs">~{task.estimated_hours}h</AppText>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                label={`Carry Over Selected (${selected.size})`}
                onPress={handleCarryOver}
                loading={loading}
                disabled={selected.size === 0}
                style={styles.confirmBtn}
              />
              <Pressable onPress={onClose} hitSlop={8} style={styles.skipBtn}>
                <AppText variant="muted" size="sm">Skip for now</AppText>
              </Pressable>
            </View>
          </>
        )}
      </View>
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
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.BORDER,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '80%' as unknown as number,
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerText: { gap: 2 },
  hint: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  rowSelected: {
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  rowContent: { flex: 1, gap: 5 },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  confirmBtn: {},
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});

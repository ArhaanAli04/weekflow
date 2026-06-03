import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppBadge } from './AppBadge';
import { COLORS, CATEGORY_COLORS, PRIORITY_COLORS } from '@/lib/constants';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  index?: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, index = 0, onToggle, onDelete }: TaskCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const checkScale = useSharedValue(1);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleToggle = () => {
    checkScale.value = withSpring(0.65, { damping: 8 }, () => {
      checkScale.value = withSpring(1, { damping: 12 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(task.id);
  };

  const handleLongPress = () => {
    Alert.alert(task.title, undefined, [
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(task.id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderRightActions = () => (
    <Pressable
      style={styles.deleteAction}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete(task.id);
      }}
    >
      <Ionicons name="trash-outline" size={20} color={COLORS.TEXT_PRIMARY} />
    </Pressable>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        <Pressable
          onLongPress={handleLongPress}
          style={[styles.card, task.done && styles.cardDone]}
        >
          <Animated.View style={checkAnimStyle}>
            <Pressable onPress={handleToggle} hitSlop={8}>
              <Ionicons
                name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={task.done ? COLORS.SUCCESS : COLORS.TEXT_MUTED}
              />
            </Pressable>
          </Animated.View>

          <View style={styles.content}>
            <AppText
              weight="medium"
              variant={task.done ? 'muted' : 'primary'}
              style={task.done ? styles.doneText : undefined}
            >
              {task.title}
            </AppText>
            <View style={styles.meta}>
              <AppBadge label={task.category} color={CATEGORY_COLORS[task.category]} />
              <AppBadge label={task.priority} color={PRIORITY_COLORS[task.priority]} />
              <AppText variant="muted" size="xs">~{task.estimated_hours}h</AppText>
              {task.carried_over_from !== null && (
                <View style={styles.carriedBadge}>
                  <AppText size="xs" style={styles.carriedText}>↩ Carried over</AppText>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  cardDone: {
    opacity: 0.55,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  doneText: {
    textDecorationLine: 'line-through',
  },
  deleteAction: {
    backgroundColor: COLORS.DANGER,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },
  carriedBadge: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  carriedText: {
    color: COLORS.ACCENT,
  },
});

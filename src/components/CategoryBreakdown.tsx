import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { CATEGORY_COLORS } from '@/lib/constants';
import type { Task, TaskCategory } from '@/types';

const CATEGORY_ORDER: TaskCategory[] = ['Work', 'Health', 'Personal', 'Learning', 'Other'];

interface CategoryBreakdownProps {
  tasks: Task[];
}

export function CategoryBreakdown({ tasks }: CategoryBreakdownProps) {
  const activeCategories = CATEGORY_ORDER.filter((cat) =>
    tasks.some((t) => t.category === cat)
  );

  if (activeCategories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {activeCategories.map((cat, i) => {
        const catTasks = tasks.filter((t) => t.category === cat);
        const done = catTasks.filter((t) => t.done).length;
        const color = CATEGORY_COLORS[cat];

        return (
          <React.Fragment key={cat}>
            <View style={styles.item}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <AppText size="xs" weight="medium" style={{ color }}>
                {cat}
              </AppText>
              <AppText size="xs" variant="secondary">
                {done}/{catTasks.length}
              </AppText>
            </View>
            {i < activeCategories.length - 1 && (
              <AppText variant="muted" size="xs" style={styles.sep}>·</AppText>
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sep: {
    marginHorizontal: 6,
  },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { COLORS } from '@/lib/constants';

interface WeekProgressBarProps {
  completed: number;
  total: number;
  totalHours: number;
}

export function WeekProgressBar({ completed, total, totalHours }: WeekProgressBarProps) {
  const pct = total > 0 ? completed / total : 0;
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming(trackWidth * pct, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  const barColor =
    pct >= 0.8 ? COLORS.SUCCESS : pct >= 0.5 ? COLORS.WARNING : COLORS.ACCENT;

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText weight="medium">
          {completed}/{total} tasks complete
        </AppText>
        <AppText variant="muted" size="sm">{totalHours}h estimated</AppText>
      </View>

      <View style={styles.track} onLayout={handleLayout}>
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: barColor }]} />
      </View>

      <AppText variant="muted" size="xs" style={styles.pct}>
        {Math.round(pct * 100)}%
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 8,
    backgroundColor: COLORS.BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  pct: {
    textAlign: 'right',
  },
});

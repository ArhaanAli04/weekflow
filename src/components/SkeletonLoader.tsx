import { useEffect } from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';

interface ShimmerProps {
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function Shimmer({ height, borderRadius = 12, style }: ShimmerProps) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.65, { duration: 850 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ height, borderRadius, backgroundColor: COLORS.SURFACE }, style, animStyle]}
    />
  );
}

// ─── Task List Skeleton (This Week screen) ────────────────────────────────────

export function TaskListSkeleton() {
  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Progress + category card */}
      <Shimmer height={112} />
      {/* Priority section header */}
      <View style={s.sectionRow}>
        <Shimmer height={10} borderRadius={5} style={{ width: 52 }} />
        <Shimmer height={10} borderRadius={5} style={{ width: 28 }} />
      </View>
      {/* 3 task card rows */}
      <Shimmer height={64} />
      <Shimmer height={64} />
      <Shimmer height={64} />
    </ScrollView>
  );
}

// ─── Report Skeleton ──────────────────────────────────────────────────────────

export function ReportSkeleton() {
  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Grade hero */}
      <Shimmer height={192} />
      {/* Stats mini-cards row */}
      <View style={s.row}>
        <Shimmer height={76} style={{ flex: 1 }} />
        <Shimmer height={76} style={{ flex: 1 }} />
        <Shimmer height={76} style={{ flex: 1 }} />
      </View>
      {/* 4 section cards: wins, improvements, insights, motivational */}
      <Shimmer height={100} />
      <Shimmer height={100} />
      <Shimmer height={84} />
      <Shimmer height={84} />
    </ScrollView>
  );
}

// ─── History List Skeleton ─────────────────────────────────────────────────────

export function HistoryListSkeleton() {
  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Shimmer key={i} height={104} />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 8 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
});

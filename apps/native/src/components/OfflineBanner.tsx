import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';

const BANNER_H = 44;

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-(BANNER_H + 60));

  useEffect(() => {
    const hiddenY = -(BANNER_H + insets.top);
    translateY.value = withTiming(isOnline ? hiddenY : 0, { duration: 320 });
  }, [isOnline, insets.top]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[styles.banner, { paddingTop: insets.top }, animStyle]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Ionicons name="cloud-offline-outline" size={15} color="#1a1a2e" />
        <AppText size="xs" weight="semibold" style={styles.text}>
          No internet connection — changes will sync when back online
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    zIndex: 999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: BANNER_H,
  },
  text: { color: '#1a1a2e', flexShrink: 1 },
});

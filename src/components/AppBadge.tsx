import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';

interface AppBadgeProps {
  label: string;
  color: string;
}

export function AppBadge({ label, color }: AppBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + '22', borderColor: color + '55' },
      ]}
    >
      <AppText size="xs" weight="medium" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/constants';

export function AppCard({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: 16,
  },
});

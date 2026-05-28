import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/constants';

type TextVariant = 'primary' | 'secondary' | 'muted';
type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  size?: TextSize;
  weight?: TextWeight;
}

const SIZE_MAP: Record<TextSize, number> = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
};

const WEIGHT_MAP: Record<TextWeight, '400' | '500' | '600' | '700'> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

const COLOR_MAP: Record<TextVariant, string> = {
  primary: COLORS.TEXT_PRIMARY,
  secondary: COLORS.TEXT_SECONDARY,
  muted: COLORS.TEXT_MUTED,
};

export function AppText({
  variant = 'primary',
  size = 'base',
  weight = 'normal',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        styles.base,
        {
          color: COLOR_MAP[variant],
          fontSize: SIZE_MAP[size],
          fontWeight: WEIGHT_MAP[weight],
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
  },
});

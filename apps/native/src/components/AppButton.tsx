import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { AppText } from './AppText';
import { COLORS } from '@weekflow/shared/lib/constants';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: COLORS.ACCENT },
  secondary: { backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: COLORS.BORDER },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: COLORS.DANGER },
};

const SIZE_STYLES: Record<ButtonSize, ViewStyle> = {
  sm: { paddingHorizontal: 12, paddingVertical: 6 },
  md: { paddingHorizontal: 16, paddingVertical: 10 },
  lg: { paddingHorizontal: 20, paddingVertical: 14 },
};

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, VARIANT_STYLES[variant], SIZE_STYLES[size], style]}
      activeOpacity={0.7}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.TEXT_PRIMARY} />
      ) : (
        <AppText weight="semibold">{label}</AppText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

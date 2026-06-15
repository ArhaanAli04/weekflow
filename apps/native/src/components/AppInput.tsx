import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { COLORS } from '@weekflow/shared/lib/constants';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  showCharCount?: boolean;
}

export function AppInput({ label, error, maxLength, showCharCount, style, value, ...props }: AppInputProps) {
  return (
    <View>
      {label !== undefined && (
        <AppText size="sm" weight="medium" style={styles.label}>{label}</AppText>
      )}
      <TextInput
        style={[styles.input, error !== undefined && styles.inputError, style]}
        placeholderTextColor={COLORS.TEXT_MUTED}
        selectionColor={COLORS.ACCENT}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      <View style={styles.footer}>
        {error !== undefined ? (
          <AppText size="xs" style={styles.errorText}>{error}</AppText>
        ) : (
          <View />
        )}
        {showCharCount && maxLength !== undefined && (
          <AppText variant="muted" size="xs">
            {(value?.length ?? 0)}/{maxLength}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    color: COLORS.TEXT_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputError: {
    borderColor: COLORS.DANGER,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  errorText: {
    color: COLORS.DANGER,
  },
});

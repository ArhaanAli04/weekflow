import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { COLORS } from '@/lib/constants';

interface AppInputProps extends TextInputProps {
  showCharCount?: boolean;
}

export function AppInput({ maxLength, showCharCount, style, value, ...props }: AppInputProps) {
  return (
    <View>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={COLORS.TEXT_MUTED}
        selectionColor={COLORS.ACCENT}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {showCharCount && maxLength !== undefined && (
        <AppText variant="muted" size="xs" style={styles.counter}>
          {(value?.length ?? 0)}/{maxLength}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  counter: {
    textAlign: 'right',
    marginTop: 4,
  },
});

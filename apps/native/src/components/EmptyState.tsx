import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { COLORS } from '@weekflow/shared/lib/constants';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon?: IoniconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon !== undefined && (
        <Ionicons name={icon} size={48} color={COLORS.TEXT_MUTED} style={styles.iconStyle} />
      )}
      <AppText size="xl" weight="semibold" style={styles.title}>
        {title}
      </AppText>
      {description !== undefined && (
        <AppText variant="secondary" style={styles.description}>
          {description}
        </AppText>
      )}
      {actionLabel !== undefined && onAction !== undefined && (
        <AppButton label={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconStyle: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 160,
  },
});

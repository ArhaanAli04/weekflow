import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { COLORS } from '@/lib/constants';

interface FallbackProps {
  error: Error;
  retry: () => void;
}

function ErrorCard({ error, retry }: FallbackProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="warning-outline" size={40} color={COLORS.DANGER} />
        <AppText size="lg" weight="bold" style={styles.title}>
          Something went wrong
        </AppText>
        <AppText variant="secondary" size="sm" style={styles.message} numberOfLines={3}>
          {error.message}
        </AppText>
        <Pressable onPress={retry} style={styles.retryBtn}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.TEXT_PRIMARY} />
          <AppText weight="semibold">Try Again</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// For Expo Router's named ErrorBoundary export from route files.
// Each tab screen adds: export { RouteErrorFallback as ErrorBoundary }
export function RouteErrorFallback({ error, retry }: FallbackProps) {
  return <ErrorCard error={error} retry={retry} />;
}

interface BoundaryState {
  error: Error | null;
}

// Class-based boundary for manual wrapping in non-route contexts.
export class ScreenErrorBoundary extends React.Component<
  React.PropsWithChildren<Record<string, unknown>>,
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorCard error={this.state.error} retry={this.retry} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    padding: 28,
    alignItems: 'center',
    gap: 12,
    maxWidth: 360,
    width: '100%' as unknown as number,
  },
  title: { color: COLORS.TEXT_PRIMARY, textAlign: 'center' },
  message: { textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
});

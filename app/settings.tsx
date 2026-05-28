import { View, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText size="2xl" weight="bold">Settings</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <AppCard style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>Account</AppText>
          <AppText variant="secondary">{user?.email}</AppText>
        </AppCard>

        <AppCard style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>Notifications</AppText>
          <View style={styles.row}>
            <AppText variant="secondary">Weekly report reminder</AppText>
            <Switch
              value={false}
              thumbColor={COLORS.ACCENT}
              trackColor={{ true: COLORS.ACCENT + '55', false: COLORS.BORDER }}
              onValueChange={() => {}}
            />
          </View>
          <View style={styles.row}>
            <AppText variant="secondary">Mid-week check-in</AppText>
            <Switch
              value={false}
              thumbColor={COLORS.ACCENT}
              trackColor={{ true: COLORS.ACCENT + '55', false: COLORS.BORDER }}
              onValueChange={() => {}}
            />
          </View>
        </AppCard>

        <AppButton
          label="Sign Out"
          variant="danger"
          size="lg"
          onPress={async () => { await signOut(); router.replace('/(auth)/login'); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  scroll: { padding: 16, gap: 12 },
  section: { gap: 12 },
  sectionTitle: { marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

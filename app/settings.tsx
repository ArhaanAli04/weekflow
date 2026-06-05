import { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message';
import { AppText } from '@/components/AppText';
import { AppCard } from '@/components/AppCard';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import {
  applyNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
} from '@/lib/notifications';
import { clearAllLocalCache } from '@/lib/offlineQueue';
import type { NotificationPrefs } from '@/types';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile, loadProfile } = useAuthStore();

  const prefs: NotificationPrefs = profile?.notification_prefs ?? DEFAULT_NOTIFICATION_PREFS;

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local display name in sync if profile loads after mount
  useEffect(() => {
    if (profile?.display_name != null) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name]);

  useEffect(() => {
    if (!profile) loadProfile();
    return () => {
      if (nameDebounce.current) clearTimeout(nameDebounce.current);
    };
  }, []);

  const handleDisplayNameChange = (text: string) => {
    setDisplayName(text);
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(async () => {
      setSavingName(true);
      await updateProfile({ display_name: text.trim() });
      setSavingName(false);
    }, 700);
  };

  const handleToggle = async (key: keyof NotificationPrefs, value: boolean) => {
    const newPrefs: NotificationPrefs = { ...prefs, [key]: value };
    await updateProfile({ notification_prefs: newPrefs });
    await applyNotificationPrefs(newPrefs).catch(() => {});
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear local cache',
      'This will discard any queued offline changes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllLocalCache();
            Toast.show({ type: 'success', text1: 'Cache cleared', visibilityTime: 2000 });
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <AppText size="xl" weight="bold">Settings</AppText>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.TEXT_SECONDARY} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Account ── */}
          <AppText style={styles.sectionLabel}>ACCOUNT</AppText>
          <AppCard style={styles.section}>
            <View style={styles.fieldRow}>
              <AppText variant="secondary" size="sm" style={styles.fieldLabel}>Display name</AppText>
              <View style={styles.nameInputRow}>
                <TextInput
                  value={displayName}
                  onChangeText={handleDisplayNameChange}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.TEXT_MUTED}
                  style={styles.nameInput}
                  returnKeyType="done"
                  maxLength={50}
                />
                {savingName && (
                  <AppText variant="muted" size="xs">saving…</AppText>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <AppText variant="secondary" size="sm" style={styles.fieldLabel}>Email</AppText>
              <AppText style={styles.fieldValue}>{user?.email ?? '—'}</AppText>
            </View>
          </AppCard>

          {/* ── Notifications ── */}
          <AppText style={styles.sectionLabel}>NOTIFICATIONS</AppText>
          <AppCard style={styles.section}>
            <ToggleRow
              label="Weekly report reminder"
              description="Sunday at 8pm"
              value={prefs.weekly_report}
              onValueChange={(v) => handleToggle('weekly_report', v)}
            />
            <View style={styles.divider} />
            <ToggleRow
              label="Mid-week check-in"
              description="Wednesday at 7pm"
              value={prefs.midweek_checkin}
              onValueChange={(v) => handleToggle('midweek_checkin', v)}
            />
            {Platform.OS !== 'web' && (
              <AppText variant="muted" size="xs" style={styles.notifHint}>
                Notifications must be allowed in your device settings.
              </AppText>
            )}
          </AppCard>

          {/* ── Data ── */}
          <AppText style={styles.sectionLabel}>DATA</AppText>
          <AppCard style={styles.section}>
            <Pressable onPress={handleClearCache} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Ionicons name="trash-outline" size={18} color={COLORS.WARNING} />
                <View>
                  <AppText weight="medium">Clear local cache</AppText>
                  <AppText variant="muted" size="xs">Discards queued offline changes</AppText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_MUTED} />
            </Pressable>
          </AppCard>

          {/* ── App ── */}
          <AppText style={styles.sectionLabel}>APP</AppText>
          <AppCard style={styles.section}>
            <View style={styles.fieldRow}>
              <AppText variant="secondary" size="sm">Version</AppText>
              <AppText variant="muted" size="sm">{APP_VERSION}</AppText>
            </View>
            <View style={styles.divider} />
            <Pressable onPress={handleSignOut} style={styles.signOutRow}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.DANGER} />
              <AppText weight="semibold" style={styles.signOutText}>Sign out</AppText>
            </Pressable>
          </AppCard>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

function ToggleRow({ label, description, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <AppText weight="medium">{label}</AppText>
        <AppText variant="muted" size="xs">{description}</AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? COLORS.ACCENT : COLORS.TEXT_MUTED}
        trackColor={{ true: COLORS.ACCENT + '55', false: COLORS.BORDER }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  scroll: { padding: 16, gap: 6, paddingBottom: 40 },

  sectionLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  section: { gap: 0, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' },

  divider: { height: 1, backgroundColor: COLORS.BORDER, marginHorizontal: 16 },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  fieldLabel: { minWidth: 100 },
  fieldValue: { color: COLORS.TEXT_SECONDARY, flex: 1, textAlign: 'right' },

  nameInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' },
  nameInput: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    textAlign: 'right',
    minWidth: 120,
    maxWidth: 200,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  toggleText: { flex: 1, gap: 2 },
  notifHint: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: -4,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  signOutText: { color: COLORS.DANGER },

  bottomSpacer: { height: 24 },
});

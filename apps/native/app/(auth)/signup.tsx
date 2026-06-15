import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuthStore } from '@weekflow/shared/stores';
import { AppText } from '@/components/AppText';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { COLORS } from '@weekflow/shared/lib/constants';

export default function SignupScreen() {
  const { signUp } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) Alert.alert('Sign up failed', error.message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <AppText size="3xl" weight="bold" style={styles.title}>Create Account</AppText>

        <View style={styles.form}>
          <AppInput
            placeholder="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            style={styles.input}
          />
          <AppInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <AppInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <AppButton label="Create Account" onPress={handleSignup} loading={loading} size="lg" />
        </View>

        <Link href="/(auth)/login" style={styles.link}>
          <AppText variant="secondary">
            Already have an account?{' '}
            <AppText style={{ color: COLORS.ACCENT }}>Sign in</AppText>
          </AppText>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 40 },
  form: { gap: 12, marginBottom: 24 },
  input: { width: '100%' },
  link: { alignSelf: 'center' },
});

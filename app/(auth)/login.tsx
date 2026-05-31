import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { AppText } from '@/components/AppText';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { COLORS } from '@/lib/constants';

export default function LoginScreen() {
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <AppText size="3xl" weight="bold" style={styles.title}>WeekFlow</AppText>
        <AppText variant="secondary" style={styles.subtitle}>
          Plan better. Perform better.
        </AppText>

        <View style={styles.form}>
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
          <AppButton label="Sign In" onPress={handleLogin} loading={loading} size="lg" />
        </View>

        <Link href="/(auth)/signup" style={styles.link}>
          <AppText variant="secondary">
            Don't have an account?{' '}
            <AppText style={{ color: COLORS.ACCENT }}>Sign up</AppText>
          </AppText>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 40 },
  form: { gap: 12, marginBottom: 24 },
  input: { width: '100%' },
  link: { alignSelf: 'center' },
});

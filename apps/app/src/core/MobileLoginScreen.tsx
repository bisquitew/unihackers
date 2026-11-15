import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, Field, PrimaryButton, SecondaryButton, Segmented, Text, TextButton, colors, radii, useKeyboardHeight } from '@hub/ui';
import { useAuth } from './auth';

const NEIGHBOURHOODS = [
  'Cetate',
  'Fabric',
  'Iosefin',
  'Elisabetin',
  'Mehala',
  'Complex Studențesc',
  'Circumvalațiunii',
];

const TABS = [
  { id: 'login', label: 'Log in' },
  { id: 'register', label: 'Register' },
] as const;

type AuthTab = (typeof TABS)[number]['id'];

export function MobileLoginScreen() {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const { signIn, register, loginWithAuth0, authError, clearAuthError } = useAuth();

  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('Cetate');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const resetErrors = () => {
    clearAuthError();
    setNote('');
  };

  const handleAuth0 = async () => {
    setBusy(true);
    resetErrors();
    const result = await loginWithAuth0();
    if (!result.ok && result.error) setNote(result.error);
    setBusy(false);
  };

  const handleLogin = async () => {
    if (!email.trim()) return;
    setBusy(true);
    resetErrors();
    const result = await signIn('email', email.trim(), password.trim() || undefined);
    if (!result.ok && result.error) setNote(result.error);
    setBusy(false);
  };

  const handleRegister = async () => {
    if (!email.trim() || !name.trim()) return;
    setBusy(true);
    resetErrors();
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password: password.trim() || undefined,
      neighbourhood,
    });
    if (!result.ok && result.error) setNote(result.error);
    setBusy(false);
  };

  const message = note || authError;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: keyboard > 0 ? keyboard : Math.max(insets.bottom, 16) }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="display" accessibilityRole="header" style={styles.wordmark}>
            hop
          </Text>
          <Text variant="bodyLarge" color="mutedForeground" style={{ marginTop: 2 }}>
            Your city, in one place.
          </Text>
        </View>

        <View style={{ marginVertical: 18 }}>
          <Segmented
            options={TABS as any}
            value={tab}
            onChange={(next) => {
              setTab(next as AuthTab);
              resetErrors();
            }}
            accessibilityLabel="Login or Register tabs"
          />
        </View>

        {message ? (
          <View style={styles.errorBox}>
            <Text variant="label" color="danger" accessibilityRole="alert">
              {message}
            </Text>
          </View>
        ) : null}

        {tab === 'login' ? (
          <View style={styles.form}>
            <PrimaryButton
              label="Continue with Auth0"
              size="lg"
              loading={busy}
              onPress={handleAuth0}
            />
            <Text variant="caption" color="mutedForeground" style={{ textAlign: 'center', marginTop: -4 }}>
              Google, Email & Passkey unified
            </Text>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="caption" color="mutedForeground" style={{ paddingHorizontal: 10 }}>
                or with email
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <Field
              label="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); resetErrors(); }}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <Field
              label="Password"
              value={password}
              onChangeText={(v) => { setPassword(v); resetErrors(); }}
              placeholder="••••••••"
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            <PrimaryButton
              label="Log in"
              size="lg"
              loading={busy}
              disabled={!email.trim()}
              onPress={handleLogin}
            />

            <View style={styles.switchRow}>
              <Text variant="body" color="mutedForeground">
                No account yet?
              </Text>
              <TextButton
                label="Register"
                size="md"
                onPress={() => {
                  setTab('register');
                  resetErrors();
                }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <PrimaryButton
              label="Sign up with Auth0"
              size="lg"
              loading={busy}
              onPress={handleAuth0}
            />
            <Text variant="caption" color="mutedForeground" style={{ textAlign: 'center', marginTop: -4 }}>
              Google, Email & Passkey unified
            </Text>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="caption" color="mutedForeground" style={{ paddingHorizontal: 10 }}>
                or with email
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <Field
              label="Full Name"
              value={name}
              onChangeText={(v) => { setName(v); resetErrors(); }}
              placeholder="Andrei Timișan"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Field
              label="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); resetErrors(); }}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <View style={{ gap: 8 }}>
              <Text variant="caption" color="mutedForeground" style={{ paddingLeft: 4 }}>
                Neighbourhood
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {NEIGHBOURHOODS.map((n) => (
                  <Chip
                    key={n}
                    label={n}
                    selected={neighbourhood === n}
                    onPress={() => setNeighbourhood(n)}
                  />
                ))}
              </ScrollView>
            </View>

            <Field
              label="Password (optional)"
              value={password}
              onChangeText={(v) => { setPassword(v); resetErrors(); }}
              placeholder="••••••••"
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleRegister}
            />

            <PrimaryButton
              label="Create account"
              size="lg"
              loading={busy}
              disabled={!email.trim() || !name.trim()}
              onPress={handleRegister}
            />

            <View style={styles.switchRow}>
              <Text variant="body" color="mutedForeground">
                Already have an account?
              </Text>
              <TextButton
                label="Log in"
                size="md"
                onPress={() => {
                  setTab('login');
                  resetErrors();
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  header: { marginTop: 8 },
  wordmark: { fontSize: 48, lineHeight: 52 },
  form: { gap: 14, marginTop: 4 },
  errorBox: {
    backgroundColor: 'rgba(255, 61, 127, 0.1)',
    borderRadius: radii.input,
    padding: 12,
    marginBottom: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairline,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
});

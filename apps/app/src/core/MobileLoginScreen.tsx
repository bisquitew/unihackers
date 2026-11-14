import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field, PrimaryButton, SecondaryButton, Text, TextButton, colors, moduleArt, useKeyboardHeight } from '@hub/ui';
import { STAFF_MESSAGE, useAuth } from './auth';

const looksLikeStaff = (email: string) => {
  const e = email.trim().toLowerCase();
  return e.includes('admin') || e.endsWith('@timisoara-hub.ro');
};

/**
 * The mobile app's front door. The app is for residents and is only usable once signed in. Staff accounts sign in on the
 * web dashboard, so this screen has no admin option. Sign-in is simulated in this build (no real Auth0 yet).
 */
export function MobileLoginScreen() {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const { loginAsResident, authError, clearAuthError } = useAuth();
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    clearAuthError();
    setNote('');
    await loginAsResident();
    setBusy(false);
  };

  const submitEmail = async () => {
    if (!email.trim()) return;
    if (looksLikeStaff(email)) {
      setNote(STAFF_MESSAGE);
      return;
    }
    await signIn();
  };

  const Events = moduleArt.events;
  const Buddy = moduleArt.buddy;
  const Parkie = moduleArt.parkie;
  const message = note || authError;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: keyboard > 0 ? keyboard : Math.max(insets.bottom, 16) }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text variant="display" accessibilityRole="header" style={styles.wordmark}>
          hop
        </Text>
        <Text variant="bodyLarge" color="mutedForeground" style={{ marginTop: 4 }}>
          Your city, in one place.
        </Text>

        <View style={styles.points}>
          <Point art={<Events size={52} />} title="Events and tickets" detail="Find something on, and keep your tickets with you." />
          <Point art={<Buddy size={52} />} title="People to go with" detail="Match with others heading to the same event." />
          <Point art={<Parkie size={52} />} title="The city, live" detail="Parking, transit and alerts near you." />
        </View>
      </ScrollView>

      <View style={styles.actions}>
        {emailOpen ? (
          <View style={{ gap: 12 }}>
            <Field label="Email" value={email} onChangeText={(v) => { setEmail(v); setNote(''); clearAuthError(); }} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" returnKeyType="go" onSubmitEditing={submitEmail} />
            {message ? (
              <Text variant="label" color="danger" accessibilityRole="alert">
                {message}
              </Text>
            ) : null}
            <PrimaryButton label="Continue" size="lg" loading={busy} disabled={!email.trim()} onPress={submitEmail} />
            <TextButton label="Back" size="md" onPress={() => { setEmailOpen(false); setNote(''); clearAuthError(); }} />
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {message ? (
              <Text variant="label" color="danger" accessibilityRole="alert">
                {message}
              </Text>
            ) : null}
            <PrimaryButton label="Continue with Google" size="lg" loading={busy} onPress={signIn} />
            <SecondaryButton label="Continue with email" size="lg" onPress={() => setEmailOpen(true)} />
          </View>
        )}
        <Text variant="caption" color="mutedForeground" style={{ textAlign: 'center', marginTop: 14 }}>
          City staff? Sign in on the web dashboard. Sign-in is simulated in this demo build.
        </Text>
      </View>
    </View>
  );
}

function Point({ art, title, detail }: { art: React.ReactNode; title: string; detail: string }) {
  return (
    <View style={styles.point}>
      {art}
      <View style={{ flex: 1 }}>
        <Text variant="rowTitle">{title}</Text>
        <Text variant="rowDetail" color="mutedForeground">
          {detail}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingBottom: 16 },
  wordmark: { fontSize: 56, lineHeight: 60 },
  points: { marginTop: 36, gap: 22 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actions: { paddingHorizontal: 24, paddingTop: 8 },
});

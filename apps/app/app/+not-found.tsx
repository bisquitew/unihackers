import * as React from 'react';
import { useRouter } from 'expo-router';
import { PrimaryButton, Screen, Text } from '@hub/ui';

/** A link to somewhere that is not in the app (an old link, a mistyped address). */
export default function NotFound() {
  const router = useRouter();
  return (
    <Screen tabBar={false}>
      <Text variant="heading" accessibilityRole="header">
        This page is not here
      </Text>
      <Text variant="body" color="mutedForeground" style={{ marginTop: 8, marginBottom: 20 }}>
        The link may be old, or the page may have moved.
      </Text>
      <PrimaryButton label="Go to Home" size="lg" onPress={() => router.replace('/' as any)} />
    </Screen>
  );
}

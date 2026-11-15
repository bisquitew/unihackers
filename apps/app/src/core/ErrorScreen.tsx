import * as React from 'react';
import { View } from 'react-native';
import { PrimaryButton, SecondaryButton, Text, colors, icons } from '@hub/ui';

/**
 * Shown when a screen crashes, instead of a red error page or a blank screen. The person gets a plain sentence and two ways
 * out: try the screen again, or go back to Home. The technical text is kept in the console only.
 */
export function ErrorScreen({ error, retry, home }: { error: Error; retry: () => void; home?: () => void }) {
  React.useEffect(() => {
    console.warn('[screen crashed]', error);
  }, [error]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center', gap: 12 }}>
      <icons.WarningCircle size={44} weight="fill" color={colors.warning} />
      <Text variant="heading" accessibilityRole="header">
        Something went wrong
      </Text>
      <Text variant="body" color="mutedForeground">
        This screen could not open. Nothing you did was lost. Try again, and if it keeps happening, go back to Home.
      </Text>
      <View style={{ gap: 10, marginTop: 8 }}>
        <PrimaryButton label="Try again" size="lg" onPress={retry} />
        {home ? <SecondaryButton label="Go to Home" size="lg" onPress={home} /> : null}
      </View>
    </View>
  );
}

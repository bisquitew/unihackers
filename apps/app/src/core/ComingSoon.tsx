import * as React from 'react';
import { Screen, Text } from '@hub/ui';

/** Placeholder for tabs whose screens are not built yet. */
export function ComingSoon({ title, line }: { title: string; line: string }) {
  return (
    <Screen>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" color="mutedForeground" style={{ marginTop: 8 }}>
        {line}
      </Text>
    </Screen>
  );
}

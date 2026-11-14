import * as React from 'react';
import { useRouter } from 'expo-router';
import { BackLink, Screen, Text } from '@hub/ui';

/**
 * Wraps a module screen so the same content works in two places:
 *  - inside the Community tab (`embedded`): bare content, the tab already provides the page and the section switcher;
 *  - as its own page (a /m/... route): a white page with a back link and the module's title.
 */
export function ModulePage({ title, embedded, children }: { title: string; embedded?: boolean; children: React.ReactNode }) {
  const router = useRouter();
  if (embedded) return <>{children}</>;
  return (
    <Screen tabBar={false}>
      <BackLink label="Back" onPress={() => router.back()} />
      <Text variant="heading" accessibilityRole="header" style={{ marginBottom: 6 }}>
        {title}
      </Text>
      {children}
    </Screen>
  );
}

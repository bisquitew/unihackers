import React from 'react';
import { View } from 'react-native';
import { Text, moduleArt, type ModuleArtId } from '@hub/ui';
import { ModulePage } from './ModulePage';

/** What a resident sees on a screen that is part of the city staff tools. Those live on the website dashboard. */
export function StaffOnly({ title, art }: { title: string; art: ModuleArtId }) {
  const Art = moduleArt[art];
  return (
    <ModulePage title={title}>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 12 }}>
        <Art size={88} />
        <Text variant="subheading" accessibilityRole="header" style={{ textAlign: 'center' }}>
          This is for city staff
        </Text>
        <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
          Staff accounts sign in on the website dashboard, not in the app.
        </Text>
      </View>
    </ModulePage>
  );
}

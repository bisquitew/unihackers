import React from 'react';
import { Stack } from 'expo-router';
import { ChangelogScreen } from '../../../src/modules/m11-feedback/ChangelogScreen';

export default function ChangelogRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Schimbări' }} />
      <ChangelogScreen />
    </>
  );
}

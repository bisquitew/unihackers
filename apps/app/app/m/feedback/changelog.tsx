import React from 'react';
import { Stack } from 'expo-router';
import { ChangelogScreen } from '../../../src/modules/m11-feedback/ChangelogScreen';
import { darkHeader } from '../../../src/modules/m11-feedback/header';

export default function ChangelogRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Schimbări')} />
      <ChangelogScreen />
    </>
  );
}

import React from 'react';
import { Stack } from 'expo-router';
import { TourScreen } from '../../../src/modules/m10-assistant/voice/TourScreen';
import { darkHeader } from '../../../src/modules/m10-assistant/header';

export default function TourRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Tur ghidat')} />
      <TourScreen />
    </>
  );
}

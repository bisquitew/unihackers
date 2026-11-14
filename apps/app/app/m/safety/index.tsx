import React from 'react';
import { Stack } from 'expo-router';
import { SafetyScreen } from '../../../src/modules/m03-safety/SafetyScreen';
import { darkHeader } from '../../../src/modules/m03-safety/header';

export default function SafetyRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Siguranță Urbană')} />
      <SafetyScreen />
    </>
  );
}

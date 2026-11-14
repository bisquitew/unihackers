import React from 'react';
import { Stack } from 'expo-router';
import { SmellScreen } from '../../../src/modules/m06-smell/SmellScreen';
import { darkHeader } from '../../../src/modules/m06-smell/header';

export default function SmellRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Sesizări de Miros')} />
      <SmellScreen />
    </>
  );
}

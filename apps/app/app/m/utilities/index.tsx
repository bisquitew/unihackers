import React from 'react';
import { Stack } from 'expo-router';
import { UtilitiesScreen } from '../../../src/modules/m04-utilities/UtilitiesScreen';
import { darkHeader } from '../../../src/modules/m06-smell/header';

export default function UtilitiesRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Avarii & Utilități')} />
      <UtilitiesScreen />
    </>
  );
}

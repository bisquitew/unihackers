import React from 'react';
import { Stack } from 'expo-router';
import { TransitScreen } from '../../../src/modules/m05-transit/TransitScreen';
import { darkHeader } from '../../../src/modules/m06-smell/header';

export default function TransitRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Transport Public STPT')} />
      <TransitScreen />
    </>
  );
}

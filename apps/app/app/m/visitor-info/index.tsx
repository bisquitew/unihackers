import React from 'react';
import { Stack } from 'expo-router';
import { VisitorInfoScreen } from '../../../src/modules/m02-visitor-info/VisitorInfoScreen';
import { darkHeader } from '../../../src/modules/m02-visitor-info/header';

export default function VisitorInfoRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Ghid pentru Vizitatori')} />
      <VisitorInfoScreen />
    </>
  );
}

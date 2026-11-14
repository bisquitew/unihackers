import React from 'react';
import { Stack } from 'expo-router';
import { DashboardScreen } from '../../../src/modules/m12-dashboard/DashboardScreen';
import { darkHeader } from '../../../src/modules/m06-smell/header';

export default function DashboardRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Panou Municipal — Tiger Data')} />
      <DashboardScreen />
    </>
  );
}

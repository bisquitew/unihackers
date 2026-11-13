import React from 'react';
import { Stack } from 'expo-router';
import { AssistantScreen } from '../../../src/modules/m10-assistant/AssistantScreen';

export default function AssistantRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Asistentul Orașului' }} />
      <AssistantScreen />
    </>
  );
}

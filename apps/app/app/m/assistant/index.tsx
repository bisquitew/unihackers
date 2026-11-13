import React from 'react';
import { Stack } from 'expo-router';
import { AssistantScreen } from '../../../src/modules/m10-assistant/AssistantScreen';
import { darkHeader } from '../../../src/modules/m10-assistant/header';

export default function AssistantRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Asistentul Orașului')} />
      <AssistantScreen />
    </>
  );
}

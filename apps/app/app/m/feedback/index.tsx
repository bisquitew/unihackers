import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { FeedbackScreen } from '../../../src/modules/m11-feedback/FeedbackScreen';
import { darkHeader } from '../../../src/modules/m11-feedback/header';

export default function FeedbackRoute() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={darkHeader('Părerea Ta')} />
      <FeedbackScreen onOpenChangelog={() => router.push('/m/feedback/changelog')} />
    </>
  );
}

import React from 'react';
import { useRouter } from 'expo-router';
import { FeedbackScreen } from '../../../src/modules/m11-feedback/FeedbackScreen';

export default function FeedbackRoute() {
  const router = useRouter();
  return (
    <>
      <FeedbackScreen onOpenChangelog={() => router.push('/m/feedback/changelog')} />
    </>
  );
}

import React from 'react';
import { Stack } from 'expo-router';
import { NoticeScanScreen } from '../../../src/modules/m10-assistant/notice/NoticeScanScreen';
import { darkHeader } from '../../../src/modules/m10-assistant/header';

export default function NoticeRoute() {
  return (
    <>
      <Stack.Screen options={darkHeader('Scanează un anunț')} />
      {/* Same server as the Utilities screen (P2's UtilitiesScreen reads outages from server.ts on 8000), so a published alert appears there. */}
      <NoticeScanScreen apiBaseUrl="http://localhost:8000" />
    </>
  );
}

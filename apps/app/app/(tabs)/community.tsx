import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Segmented, Text } from '@hub/ui';
import { EventsScreen } from '../../src/modules/m01-events/EventsScreen';
import { ForumScreen } from '../../src/modules/m08-forum/ForumScreen';
import { BuddyScreen } from '../../src/modules/m07-buddy/BuddyScreen';
import { WalletScreen } from '../../src/modules/m09-wallet/WalletScreen';
import { WebAccessGate } from '../../src/core/WebAccessGate';

type Section = 'events' | 'forum' | 'buddies' | 'wallet';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'forum', label: 'Forum' },
  { id: 'buddies', label: 'Buddies' },
  { id: 'wallet', label: 'Wallet' },
];

/**
 * Community: the four social modules as sections of one white page. Each section is its own module's screen, rendered
 * as bare content; the page, the title and the section switcher live here. Links in (from the map, from Home) pick the
 * section with ?tab= and an event with ?event=.
 */
export default function CommunityTab() {
  return (
    <WebAccessGate featureName="comunitatea, forumul civic și portofelul Solana">
      <CommunityContent />
    </WebAccessGate>
  );
}

function CommunityContent() {
  const params = useLocalSearchParams<{ tab?: string; event?: string }>();
  const [section, setSection] = useState<Section>('events');

  useEffect(() => {
    if (params.tab && SECTIONS.some((s) => s.id === params.tab)) setSection(params.tab as Section);
  }, [params.tab]);

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 34, paddingHorizontal: 4 }}>
        Community
      </Text>
      <View style={{ marginTop: 14 }}>
        <Segmented options={SECTIONS} value={section} onChange={setSection} accessibilityLabel="Community sections" />
      </View>

      {section === 'events' ? <EventsScreen embedded openEventId={params.event} onOpenWallet={() => setSection('wallet')} /> : null}
      {section === 'forum' ? <ForumScreen embedded /> : null}
      {section === 'buddies' ? <BuddyScreen embedded /> : null}
      {section === 'wallet' ? <WalletScreen embedded onOpenEvents={() => setSection('events')} /> : null}
    </Screen>
  );
}

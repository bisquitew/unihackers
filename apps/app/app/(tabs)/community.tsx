import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WalletScreen } from '../../src/modules/m09-wallet/WalletScreen';
import { EventsScreen } from '../../src/modules/m01-events/EventsScreen';
import { BuddyScreen } from '../../src/modules/m07-buddy/BuddyScreen';
import { ForumScreen } from '../../src/modules/m08-forum/ForumScreen';
import { BuddyModal } from '../../src/modules/m07-buddy/BuddyModal';
import { WebAccessGate } from '../../src/core/WebAccessGate';

export default function CommunityTab() {
  return (
    <WebAccessGate featureName="comunitatea, forumul civic și portofelul Solana">
      <CommunityContent />
    </WebAccessGate>
  );
}

function CommunityContent() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [subTab, setSubTab] = useState<'events' | 'forum' | 'buddies' | 'wallet'>('events');
  const [buddyModalData, setBuddyModalData] = useState<{ eventId: string; eventTitle: string } | null>(null);

  useEffect(() => {
    if (params.tab && ['events', 'forum', 'buddies', 'wallet'].includes(params.tab)) {
      setSubTab(params.tab as any);
    }
  }, [params.tab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Top 4-Module Navigation Switcher */}
      <View style={styles.header}>
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTabItem, subTab === 'events' && styles.subTabItemActive]}
            onPress={() => setSubTab('events')}
          >
            <Text style={[styles.subTabText, subTab === 'events' && styles.subTabTextActive]}>
              🎭 Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, subTab === 'forum' && styles.subTabItemActive]}
            onPress={() => setSubTab('forum')}
          >
            <Text style={[styles.subTabText, subTab === 'forum' && styles.subTabTextActive]}>
              💬 Forum
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, subTab === 'buddies' && styles.subTabItemActive]}
            onPress={() => setSubTab('buddies')}
          >
            <Text style={[styles.subTabText, subTab === 'buddies' && styles.subTabTextActive]}>
              🤝 Buddies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, subTab === 'wallet' && styles.subTabItemActive]}
            onPress={() => setSubTab('wallet')}
          >
            <Text style={[styles.subTabText, subTab === 'wallet' && styles.subTabTextActive]}>
              🎟️ Wallet
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Active Slice Content */}
      <View style={styles.content}>
        {subTab === 'events' && (
          <EventsScreen
            onSelectBuddyForEvent={(eventId, eventTitle) =>
              setBuddyModalData({ eventId, eventTitle })
            }
          />
        )}
        {subTab === 'forum' && <ForumScreen />}
        {subTab === 'buddies' && <BuddyScreen />}
        {subTab === 'wallet' && <WalletScreen />}
      </View>

      {/* Quick Event Buddy Modal */}
      {buddyModalData && (
        <BuddyModal
          visible={!!buddyModalData}
          eventId={buddyModalData.eventId}
          eventTitle={buddyModalData.eventTitle}
          onClose={() => setBuddyModalData(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    backgroundColor: '#09090b',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabItemActive: {
    backgroundColor: '#3b0764',
    borderWidth: 1,
    borderColor: '#7e22ce',
  },
  subTabText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#f3e8ff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#09090b',
  },
});

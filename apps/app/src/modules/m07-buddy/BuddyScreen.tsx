import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Avatar, Chip, PrimaryButton, Row, RowGroup, Segmented, Sheet, Text, TextButton, colors } from '@hub/ui';
import { ModulePage } from '../../core/ModulePage';
import { initialsOf, toneFor } from '../../core/people';
import { eventsStore } from '../m01-events/eventsStore';
import { BuddyProfile, BuddyRequestForm, BuddyRow } from './BuddyParts';
import { buddyStore, type BuddyListing } from './buddyStore';
import { ChatRoom } from './ChatRoom';
import { chatStore, formatChatTime } from './chatStore';

export type { BuddyListing } from './buddyStore';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'cinema', label: 'Cinema' },
  { id: 'music', label: 'Music' },
  { id: 'workshop', label: 'Workshops' },
];

export function BuddyScreen({ embedded }: { embedded?: boolean }) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetMax = Math.round(windowHeight * 0.72);

  const [buddies, setBuddies] = useState<BuddyListing[]>(buddyStore.list());
  useEffect(() => buddyStore.subscribe(() => setBuddies(buddyStore.list())), []);
  const events = eventsStore.getEvents();
  useSyncExternalStore(
    (cb) => chatStore.subscribe(cb),
    () => chatStore.getVersion(),
  );
  const chats = chatStore.list();
  const unread = chatStore.unreadTotal();

  const [view, setView] = useState<'find' | 'chats'>('find');
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => {
    if (filter === 'all') return buddies;
    return buddies.filter((b) => events.find((e) => e.id === b.eventId)?.category === filter);
  }, [buddies, events, filter]);

  const [openId, setOpenId] = useState<string | null>(null);
  const open = buddies.find((b) => b.id === openId) ?? null;
  const [chatId, setChatId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // iOS cannot present a screen while a sheet is still closing, so the chat opens once the profile sheet has gone
  const startChat = (buddy: BuddyListing) => {
    chatStore.open(buddy);
    setOpenId(null);
    setTimeout(() => setChatId(buddy.id), 450);
  };

  return (
    <ModulePage title="Buddies" embedded={embedded}>
      <View style={styles.head}>
        <Segmented
          accessibilityLabel="Buddies sections"
          value={view}
          onChange={setView}
          options={[
            { id: 'find', label: 'Find company' },
            { id: 'chats', label: unread > 0 ? `Chats (${unread})` : 'Chats' },
          ]}
        />
      </View>

      {view === 'find' ? (
        <>
          <View style={styles.sub}>
            <Text variant="rowDetail" color="mutedForeground" style={{ flex: 1 }}>
              People going to events who would like company
            </Text>
            <PrimaryButton label="Post" size="md" onPress={() => setPosting(true)} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
            {FILTERS.map((f) => (
              <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
            ))}
          </ScrollView>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="subheading" accessibilityRole="header">
                No one yet
              </Text>
              <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
                Be the first to ask for company at an event.
              </Text>
              <TextButton label="Find company" size="md" onPress={() => setPosting(true)} />
            </View>
          ) : (
            <RowGroup>
              {filtered.map((b) => (
                <BuddyRow key={b.id} buddy={b} onPress={() => setOpenId(b.id)} />
              ))}
            </RowGroup>
          )}
        </>
      ) : chats.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="subheading" accessibilityRole="header">
            No chats yet
          </Text>
          <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
            Open a profile and tap Message. Your conversations live here.
          </Text>
          <TextButton label="Find someone to go with" size="md" onPress={() => setView('find')} />
        </View>
      ) : (
        <View style={{ marginTop: 14 }}>
          <RowGroup>
            {chats.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <Row key={c.id} onPress={() => setChatId(c.id)} accessibilityLabel={`${c.buddy.userName}${c.unread ? `, ${c.unread} new` : ''}. ${last?.text ?? ''}`}>
                  <Avatar initials={initialsOf(c.buddy.userName)} tone={toneFor(c.buddy.id)} size={44} />
                  <Row.Body>
                    <Row.Title>{c.buddy.userName}</Row.Title>
                    <Text variant="rowDetail" color={c.unread ? 'foreground' : 'mutedForeground'} numberOfLines={1} style={c.unread ? { fontWeight: '700' } : undefined}>
                      {last?.from === 'me' ? 'You: ' : ''}
                      {last?.text}
                    </Text>
                  </Row.Body>
                  <Row.Trailing>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text variant="caption" color="mutedForeground">
                        {last ? formatChatTime(last.at) : ''}
                      </Text>
                      {c.unread ? <View style={styles.dot} /> : null}
                    </View>
                  </Row.Trailing>
                </Row>
              );
            })}
          </RowGroup>
        </View>
      )}

      {/* a person's profile */}
      <Sheet modal visible={!!open} onClose={() => setOpenId(null)} accessibilityLabel="Buddy profile">
        {open ? (
          <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
            <BuddyProfile buddy={open} />
            <PrimaryButton label={chatStore.get(open.id) ? 'Open chat' : `Message ${open.userName.split(' ')[0]}`} size="lg" onPress={() => startChat(open)} />
          </ScrollView>
        ) : null}
      </Sheet>

      {/* the conversation, full screen */}
      <ChatRoom chatId={chatId} onClose={() => setChatId(null)} />

      {/* ask for company */}
      <Sheet modal visible={posting} onClose={() => setPosting(false)} accessibilityLabel="Find company">
        <ScrollView style={{ maxHeight: sheetMax }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BuddyRequestForm
            events={events}
            onSubmit={(v) => {
              buddyStore.add(v);
              setPosting(false);
              setFilter('all');
            }}
          />
        </ScrollView>
      </Sheet>
    </ModulePage>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: 14 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, paddingHorizontal: 4 },
  chips: { marginTop: 14, marginHorizontal: -16, flexGrow: 0 },
  chipsContent: { gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.foreground },
});

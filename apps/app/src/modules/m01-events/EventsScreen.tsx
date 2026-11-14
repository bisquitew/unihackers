import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { mapHref } from '@hub/map';
import { AvatarStack, Chip, Field, IconButton, PrimaryButton, Row, RowGroup, SecondaryButton, Sheet, Text, TextButton, colors, icons, radii } from '@hub/ui';
import { useAuth } from '../../core/auth';
import { ModulePage } from '../../core/ModulePage';
import { WhenBlock } from '../../core/WhenBlock';
import { BuddyModal } from '../m07-buddy/BuddyModal';
import { ChatRoom } from '../m07-buddy/ChatRoom';
import { chatStore } from '../m07-buddy/chatStore';
import { ticketStore } from '../m09-wallet/ticketStore';
import { eventsStore, type EventItem } from './eventsStore';
import { eventCoordinate } from './mapLayer';

interface EventsScreenProps {
  /** Inside the Community tab: render bare content. */
  embedded?: boolean;
  /** Open the wallet. Inside the Community tab this switches section; on its own page it opens /m/wallet. */
  onOpenWallet?: () => void;
  /** Kept for callers that open their own buddy sheet. By default this screen opens it itself. */
  onSelectBuddyForEvent?: (eventId: string, eventTitle: string) => void;
  /** Open this event's detail straight away (a link from the map). */
  openEventId?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'cinema', label: 'Cinema' },
  { id: 'music', label: 'Music' },
  { id: 'workshop', label: 'Workshops' },
] as const;
const AREAS = ['Fabric', 'Cetate', 'Iosefin', 'Elisabetin'];
const AGES = [
  { id: 'all', label: 'All ages' },
  { id: 'students', label: 'Students' },
  { id: 'family', label: 'Family' },
];
const NEW_CATEGORIES: { id: EventItem['category']; label: string }[] = [
  { id: 'cinema', label: 'Cinema' },
  { id: 'music', label: 'Music' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'social', label: 'Social' },
];

export function EventsScreen({ embedded, onOpenWallet, onSelectBuddyForEvent, openEventId }: EventsScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  // reload from the server whenever the events are opened
  useEffect(() => {
    void eventsStore.refresh();
  }, []);
  const { height: windowHeight } = useWindowDimensions();
  const sheetMax = Math.round(windowHeight * 0.72);

  const [events, setEvents] = useState<EventItem[]>(eventsStore.getEvents());
  const [heldIds, setHeldIds] = useState<string[]>(() => ticketStore.getState().tickets.map((t) => t.eventId));
  useEffect(() => eventsStore.subscribe(() => setEvents(eventsStore.getEvents())), []);
  useEffect(() => ticketStore.subscribe(() => setHeldIds(ticketStore.getState().tickets.map((t) => t.eventId))), []);

  // filters
  const [category, setCategory] = useState<string>('all');
  const [area, setArea] = useState<string>('all');
  const [age, setAge] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilters = (area !== 'all' ? 1 : 0) + (age !== 'all' ? 1 : 0);

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (category === 'all' || e.category === category) &&
          (area === 'all' || e.neighbourhood.toLowerCase() === area.toLowerCase()) &&
          (age === 'all' || e.ageGroup === age || e.ageGroup === 'all'),
      ),
    [events, category, area, age],
  );

  // the open event, the ticket step, and the buddy sheet
  const [openId, setOpenId] = useState<string | null>(openEventId ?? null);
  const open = events.find((e) => e.id === openId) ?? null;
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState(false);
  const [justBooked, setJustBooked] = useState<string | null>(null);
  const [buddyFor, setBuddyFor] = useState<{ eventId: string; eventTitle: string } | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    if (openEventId) setOpenId(openEventId);
  }, [openEventId]);

  const closeEvent = () => {
    setOpenId(null);
    setJustBooked(null);
    setMintError(false);
  };
  const goWallet = () => {
    closeEvent();
    if (onOpenWallet) onOpenWallet();
    else router.push('/m/wallet' as any);
  };
  const reserve = async (event: EventItem) => {
    if (minting) return;
    setMinting(true);
    setMintError(false);
    try {
      await ticketStore.addTicketFromRsvp(event.id, event.title);
      eventsStore.rsvpEvent(event.id, user?.name);
      setJustBooked(event.id);
    } catch {
      setMintError(true);
    } finally {
      setMinting(false);
    }
  };
  const findBuddy = (event: EventItem) => {
    closeEvent();
    if (onSelectBuddyForEvent) onSelectBuddyForEvent(event.id, event.title);
    // iOS cannot present a sheet while another is still closing, so wait for the first to finish
    else setTimeout(() => setBuddyFor({ eventId: event.id, eventTitle: event.title }), 450);
  };
  const showOnMap = (event: EventItem) => {
    closeEvent();
    router.push(mapHref({ pin: `events:${event.id}` }) as any);
  };

  // hosting an event
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', when: '', venue: '', description: '', area: 'Fabric', category: 'cinema' as EventItem['category'], paid: false, price: '' });
  const canPublish = draft.title.trim().length > 0 && draft.venue.trim().length > 0;
  const publish = () => {
    if (!canPublish) return;
    const created = eventsStore.createEvent({
      organizerName: user?.name,
      title: draft.title,
      category: draft.category,
      locationName: draft.venue,
      neighbourhood: draft.area,
      dateTime: draft.when,
      description: draft.description || 'Join us for this community gathering.',
      isFree: !draft.paid,
      priceAmount: draft.paid ? parseInt(draft.price || '15', 10) : undefined,
      ageGroup: 'all',
    });
    setCreateOpen(false);
    setDraft({ title: '', when: '', venue: '', description: '', area: 'Fabric', category: 'cinema', paid: false, price: '' });
    setOpenId(created.id);
  };

  return (
    <ModulePage title="Events" embedded={embedded}>
      <View style={styles.head}>
        <Text variant="rowDetail" color="mutedForeground">
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </Text>
        <View style={styles.headActions}>
          <View>
            <IconButton label={activeFilters ? `Filters, ${activeFilters} on` : 'Filters'} tone="glass" size={44} onPress={() => setFilterOpen(true)}>
              <icons.SlidersHorizontal size={22} weight="bold" color={colors.foreground} />
            </IconButton>
            {activeFilters ? <View style={styles.filterDot} /> : null}
          </View>
          <PrimaryButton label="Host an event" size="md" onPress={() => setCreateOpen(true)} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="subheading" accessibilityRole="header">
            Nothing matches yet
          </Text>
          <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
            Try another type or area, or host the first one.
          </Text>
          {category !== 'all' || activeFilters ? (
            <TextButton
              label="Clear filters"
              size="md"
              onPress={() => {
                setCategory('all');
                setArea('all');
                setAge('all');
              }}
            />
          ) : null}
        </View>
      ) : (
        <RowGroup>
          {filtered.map((e) => {
            const held = heldIds.includes(e.id);
            return (
              <Row key={e.id} onPress={() => setOpenId(e.id)} accessibilityLabel={`${e.title}, ${e.dateTime}, ${e.locationName}, ${e.isFree ? 'free' : `${e.priceAmount} lei`}${held ? ', you have a ticket' : ''}`}>
                <WhenBlock dateTime={e.dateTime} />
                <Row.Body>
                  <Row.Title>{e.title}</Row.Title>
                  <Row.Detail>
                    {e.locationName}, {e.neighbourhood}
                  </Row.Detail>
                  <Row.Detail>{e.attendeeCount} going</Row.Detail>
                </Row.Body>
                <Row.Trailing>
                  {held ? (
                    <View style={styles.going}>
                      <icons.CheckCircle size={18} weight="fill" color={colors.success} />
                      <Text variant="label" color="success">
                        Going
                      </Text>
                    </View>
                  ) : (
                    <Text variant="label" color={e.isFree ? 'success' : 'foreground'}>
                      {e.isFree ? 'Free' : `${e.priceAmount} lei`}
                    </Text>
                  )}
                </Row.Trailing>
              </Row>
            );
          })}
        </RowGroup>
      )}

      {/* one event: details, ticket, buddy, map */}
      <Sheet modal visible={!!open} onClose={closeEvent} accessibilityLabel="Event details">
        {open ? (
          justBooked === open.id ? (
            <View style={styles.sheetBody}>
              <icons.CheckCircle size={40} weight="fill" color={colors.success} />
              <Text variant="heading" accessibilityRole="header">
                You are going
              </Text>
              <Text variant="body" color="mutedForeground">
                {open.title}, {open.dateTime}. Your ticket is in the wallet, ready to scan at the door.
              </Text>
              <View style={styles.stack}>
                <PrimaryButton label="View my ticket" size="lg" onPress={goWallet} />
                <TextButton label="Done" size="lg" onPress={closeEvent} />
              </View>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {open.imageUrl ? <Image source={{ uri: open.imageUrl }} accessibilityLabel={`Photo for ${open.title}`} style={styles.photo} /> : null}
              <Text variant="heading" accessibilityRole="header">
                {open.title}
              </Text>
              <Text variant="body" color="mutedForeground">
                {open.dateTime}, {open.locationName}, {open.neighbourhood}
              </Text>
              <Text variant="body">{open.description}</Text>
              <View style={styles.goingRow}>
                <AvatarStack label={`${open.attendeeCount} people are going`} people={[{ initials: 'MA' }, { initials: 'DR' }, { initials: 'IO' }]} />
                <Text variant="label">{open.attendeeCount} going</Text>
                <Text variant="label" color={open.isFree ? 'success' : 'foreground'} style={{ marginLeft: 'auto' }}>
                  {open.isFree ? 'Free' : `${open.priceAmount} lei`}
                </Text>
              </View>
              {mintError ? (
                <Text variant="rowDetail" color="danger">
                  We could not reserve your spot. Check your connection and try again.
                </Text>
              ) : null}
              <View style={styles.stack}>
                {heldIds.includes(open.id) ? (
                  <PrimaryButton label="View my ticket" size="lg" onPress={goWallet} />
                ) : (
                  <PrimaryButton label="Get a ticket" size="lg" loading={minting} onPress={() => reserve(open)} />
                )}
                <SecondaryButton label="Find a buddy" size="lg" onPress={() => findBuddy(open)} />
                {eventCoordinate(open) ? <TextButton label="Show on the map" size="lg" onPress={() => showOnMap(open)} /> : null}
              </View>
            </ScrollView>
          )
        ) : null}
      </Sheet>

      {/* filters */}
      <Sheet modal visible={filterOpen} onClose={() => setFilterOpen(false)} accessibilityLabel="Filter events">
        <View style={styles.sheetBody}>
          <Text variant="subheading" accessibilityRole="header">
            Area
          </Text>
          <View style={styles.wrap}>
            <Chip label="Anywhere" selected={area === 'all'} onPress={() => setArea('all')} />
            {AREAS.map((a) => (
              <Chip key={a} label={a} selected={area === a} onPress={() => setArea(a)} />
            ))}
          </View>
          <Text variant="subheading" accessibilityRole="header">
            Who it is for
          </Text>
          <View style={styles.wrap}>
            {AGES.map((a) => (
              <Chip key={a.id} label={a.label} selected={age === a.id} onPress={() => setAge(a.id)} />
            ))}
          </View>
          <View style={styles.stack}>
            <PrimaryButton label={`Show ${filtered.length} ${filtered.length === 1 ? 'event' : 'events'}`} size="lg" onPress={() => setFilterOpen(false)} />
            <TextButton
              label="Reset"
              size="lg"
              onPress={() => {
                setArea('all');
                setAge('all');
              }}
            />
          </View>
        </View>
      </Sheet>

      {/* host an event */}
      <Sheet modal visible={createOpen} onClose={() => setCreateOpen(false)} accessibilityLabel="Host an event">
        <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text variant="heading" accessibilityRole="header">
            Host an event
          </Text>
          <Field label="Title" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} placeholder="Acoustic night on the canal" maxLength={70} />
          <Field label="When" value={draft.when} onChangeText={(when) => setDraft({ ...draft, when })} placeholder="Saturday at 18:00" maxLength={40} />
          <Field label="Venue" value={draft.venue} onChangeText={(venue) => setDraft({ ...draft, venue })} placeholder="Faber Community Yard" maxLength={60} />
          <Text variant="subheading">Type</Text>
          <View style={styles.wrap}>
            {NEW_CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} selected={draft.category === c.id} onPress={() => setDraft({ ...draft, category: c.id })} />
            ))}
          </View>
          <Text variant="subheading">Area</Text>
          <View style={styles.wrap}>
            {AREAS.map((a) => (
              <Chip key={a} label={a} selected={draft.area === a} onPress={() => setDraft({ ...draft, area: a })} />
            ))}
          </View>
          <Field label="What will happen" value={draft.description} onChangeText={(description) => setDraft({ ...draft, description })} multiline maxLength={240} />
          <Text variant="subheading">Price</Text>
          <View style={styles.wrap}>
            <Chip label="Free" selected={!draft.paid} onPress={() => setDraft({ ...draft, paid: false })} />
            <Chip label="Paid" selected={draft.paid} onPress={() => setDraft({ ...draft, paid: true })} />
          </View>
          {draft.paid ? <Field label="Price in lei" value={draft.price} onChangeText={(price) => setDraft({ ...draft, price: price.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={4} /> : null}
          <View style={styles.stack}>
            <PrimaryButton label="Publish event" size="lg" disabled={!canPublish} onPress={publish} />
            {!canPublish ? (
              <Text variant="rowDetail" color="mutedForeground" style={{ textAlign: 'center' }}>
                Add a title and a venue to publish.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </Sheet>

      {buddyFor ? (
        <BuddyModal
          visible
          eventId={buddyFor.eventId}
          eventTitle={buddyFor.eventTitle}
          onClose={() => setBuddyFor(null)}
          onChat={(buddy) => {
            chatStore.open(buddy);
            setBuddyFor(null);
            setTimeout(() => setChatId(buddy.id), 450);
          }}
        />
      ) : null}
      <ChatRoom chatId={chatId} onClose={() => setChatId(null)} />
    </ModulePage>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingHorizontal: 4 },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterDot: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.successDot, borderWidth: 2, borderColor: colors.background },
  chips: { marginTop: 14, marginHorizontal: -16, flexGrow: 0 },
  chipsContent: { gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  going: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  sheetBody: { gap: 12 },
  photo: { width: '100%', height: 160, borderRadius: radii.group, backgroundColor: colors.secondary },
  goingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stack: { gap: 8, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

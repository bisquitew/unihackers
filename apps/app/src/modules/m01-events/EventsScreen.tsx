import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { mapHref } from '@hub/map';
import {
  AvatarStack,
  Chip,
  Field,
  IconButton,
  PrimaryButton,
  Row,
  RowGroup,
  SecondaryButton,
  Sheet,
  Text,
  TextButton,
  colors,
  icons,
  radii,
} from '@hub/ui';
import { ModulePage } from '../../core/ModulePage';
import { WhenBlock } from '../../core/WhenBlock';
import { BuddyModal } from '../m07-buddy/BuddyModal';
import { ChatRoom } from '../m07-buddy/ChatRoom';
import { chatStore } from '../m07-buddy/chatStore';
import { ticketStore } from '../m09-wallet/ticketStore';
import { eventsStore, type EventItem } from './eventsStore';
import { eventCoordinate } from './mapLayer';
import { useAuth } from '../../core/auth';

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
  const { isLoggedIn, loginAsResident } = useAuth();
  const isGuestWeb = Platform.OS === 'web' && !isLoggedIn;

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

  const displayedEvents = isGuestWeb ? filtered.slice(0, 3) : filtered;

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
    if (isGuestWeb) {
      Alert.alert(
        'Autentificare Necesară',
        'Pentru a rezerva un bilet pe blockchain Solana și a primi un POAP, te rugăm să te conectezi ca Cetățean.',
        [
          { text: 'Anulează', style: 'cancel' },
          { text: 'Conectare Cetățean', onPress: () => loginAsResident() },
        ],
      );
      return;
    }

    if (minting) return;
    setMinting(true);
    setMintError(false);
    try {
      await ticketStore.addTicketFromRsvp(event.id, event.title);
      eventsStore.rsvpEvent(event.id);
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
    const c = eventCoordinate(event);
    // Opens the event's own pin (events map layer); centres on it when it has a position.
    router.push(mapHref(c ? { pin: `events:${event.id}`, lat: c.latitude, lng: c.longitude, zoom: 16 } : { pin: `events:${event.id}` }) as any);
  };

  // host an event (local draft only; in production it posts to the events service)
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    category: 'cinema' as EventItem['category'],
    area: 'Fabric',
    venue: '',
    description: '',
    when: '',
    paid: false,
    price: '',
  });
  const canPublish = draft.title.trim().length > 2 && draft.venue.trim().length > 2;
  const publish = () => {
    eventsStore.createEvent({
      title: draft.title.trim(),
      category: draft.category,
      neighbourhood: draft.area,
      locationName: draft.venue.trim(),
      dateTime: draft.when.trim() || 'This weekend',
      description: draft.description.trim() || 'Community event hosted in Timișoara.',
      isFree: !draft.paid,
      priceAmount: draft.paid ? parseInt(draft.price, 10) || 20 : undefined,
      ageGroup: 'all',
    });
    setCreateOpen(false);
    setDraft({ title: '', category: 'cinema', area: 'Fabric', venue: '', description: '', when: '', paid: false, price: '' });
  };

  return (
    <ModulePage embedded={embedded} title="Events">
      {/* toolbar: heading on standalone page, category chips, and filter trigger */}
      <View style={styles.head}>
        <Text variant="subheading" color="mutedForeground">
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </Text>
        <View style={styles.headActions}>
          <View style={{ position: 'relative' }}>
            <IconButton label="Filters" size={44} onPress={() => setFilterOpen(true)}>
              <icons.SlidersHorizontal size={22} weight="bold" color={colors.foreground} />
            </IconButton>
            {activeFilters > 0 ? <View style={styles.filterDot} /> : null}
          </View>
          <PrimaryButton label="Host an event" size="md" onPress={() => setCreateOpen(true)} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>

      {/* Guest Web Limited Access Notification Banner */}
      {isGuestWeb && (
        <View style={styles.guestBanner}>
          <Text variant="subheading" style={{ color: colors.primary, fontWeight: 'bold' }}>
            Mod Vizitator Web (Previzualizare Limitată)
          </Text>
          <Text variant="rowDetail" color="mutedForeground" style={{ marginTop: 2 }}>
            Afișezi o selecție de 3 evenimente din Timișoara. Conectează-te ca Cetățean pentru lista completă și bilete Solana.
          </Text>
          <View style={{ marginTop: 8 }}>
            <SecondaryButton label="Conectare ca Cetățean →" size="md" onPress={() => loginAsResident()} />
          </View>
        </View>
      )}

      {/* events list */}
      <View style={{ marginTop: 14 }}>
        {displayedEvents.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="heading" accessibilityRole="header">
              Nothing matches yet
            </Text>
            <Text variant="body" color="mutedForeground">
              Try choosing another category or clearing your filters.
            </Text>
            {activeFilters > 0 ? (
              <SecondaryButton
                label="Clear filters"
                size="md"
                onPress={() => {
                  setArea('all');
                  setAge('all');
                }}
              />
            ) : null}
          </View>
        ) : (
          <RowGroup>
            {displayedEvents.map((e) => {
              const held = heldIds.includes(e.id);
              return (
                <Row
                  key={e.id}
                  onPress={() => setOpenId(e.id)}
                  accessibilityLabel={`${e.title}, ${e.dateTime}, ${e.locationName}, ${e.isFree ? 'free' : `${e.priceAmount} lei`}${held ? ', you have a ticket' : ''}`}
                >
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
                        <icons.Ticket size={18} weight="fill" color={colors.foreground} />
                        <Text variant="rowDetail">Got ticket</Text>
                      </View>
                    ) : (
                      <Text variant="rowDetail" color="mutedForeground">
                        {e.isFree ? 'Free' : `${e.priceAmount} lei`}
                      </Text>
                    )}
                  </Row.Trailing>
                </Row>
              );
            })}
          </RowGroup>
        )}
      </View>

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
                <PrimaryButton label="View in wallet" size="lg" onPress={goWallet} />
                <SecondaryButton label="Find a buddy to go with" size="lg" onPress={() => findBuddy(open)} />
                <TextButton label="Done" size="lg" onPress={closeEvent} />
              </View>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {open.imageUrl ? <Image source={{ uri: open.imageUrl }} style={styles.photo} /> : null}
              <Text variant="heading" accessibilityRole="header">
                {open.title}
              </Text>
              <Text variant="rowDetail" color="mutedForeground">
                {open.locationName}, {open.neighbourhood}
              </Text>
              <Text variant="body" color="mutedForeground">
                {open.description}
              </Text>

              <View style={styles.goingRow}>
                <AvatarStack
                  label={`${open.attendeeCount} people going`}
                  people={[
                    { initials: 'MA', tone: 'apricot' },
                    { initials: 'DR', tone: 'blue' },
                    { initials: 'IO', tone: 'mint' },
                  ]}
                />
                <Text variant="label">{open.attendeeCount} people going</Text>
              </View>

              {mintError ? (
                <Text variant="rowDetail" color="danger">
                  Could not mint ticket just now. Please try again.
                </Text>
              ) : null}

              <View style={styles.stack}>
                {heldIds.includes(open.id) ? (
                  <SecondaryButton label="View your ticket in wallet" size="lg" onPress={goWallet} />
                ) : (
                  <PrimaryButton
                    label={minting ? 'Minting your ticket...' : open.isFree ? 'RSVP for free' : `Get ticket · ${open.priceAmount} lei`}
                    size="lg"
                    disabled={minting}
                    onPress={() => reserve(open)}
                  />
                )}
                <SecondaryButton label="Find someone to go with" size="lg" onPress={() => findBuddy(open)} />
                <SecondaryButton label="Show on map" size="lg" onPress={() => showOnMap(open)} />
              </View>
            </ScrollView>
          )
        ) : null}
      </Sheet>

      {/* filter sheet */}
      <Sheet modal visible={filterOpen} onClose={() => setFilterOpen(false)} accessibilityLabel="Filter events">
        <View style={styles.sheetBody}>
          <Text variant="heading" accessibilityRole="header">
            Filter events
          </Text>
          <Text variant="subheading" accessibilityRole="header">
            Area
          </Text>
          <View style={styles.wrap}>
            <Chip label="All areas" selected={area === 'all'} onPress={() => setArea('all')} />
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
  guestBanner: {
    backgroundColor: '#18181b',
    borderRadius: radii.group,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});

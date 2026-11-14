import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, View, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AskBar,
  AvatarStack,
  CinemaScene,
  PrimaryButton,
  Row,
  RowGroup,
  Screen,
  Section,
  Text,
  colors,
  icons,
  minTarget,
  moduleArt,
  palette,
  type ModuleArtId,
} from '@hub/ui';
import { useAlerts } from '../../src/core/alerts';
import { useTopParking } from '../../src/core/liveData';
import { eventsStore, type EventItem } from '../../src/modules/m01-events/eventsStore';
import { useAuth } from '../../src/core/auth';
import { getCity } from '@hub/map';

// Explore shows only modules that are NOT already visible in a list on this screen (each illustration once per screen).
const explore: { id: ModuleArtId; label: string; route?: string }[] = [
  { id: 'events', label: 'Events', route: '/m/events' },
  { id: 'buddy', label: 'Buddy', route: '/m/buddy' },
  { id: 'forum', label: 'Forum', route: '/m/forum' },
  { id: 'assistant', label: 'Assistant', route: '/m/assistant' },
  { id: 'wallet', label: 'Wallet', route: '/m/wallet' },
  { id: 'feedback', label: 'Feedback', route: '/m/feedback' },
  { id: 'visitorInfo', label: 'Visitor info', route: '/m/visitor-info' },
  { id: 'smell', label: 'Smell', route: '/m/smell' },
  { id: 'safety', label: 'Safety', route: '/m/safety' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const displayName = user ? user.name.split(' ')[0] : 'there';
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night,' : hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

  // live data: alerts, the best parking lot, and the next events (the sample values show until the server answers)
  const alerts = useAlerts();
  const unreadAlerts = alerts.length;
  const outage = alerts.find((a) => a.module === 'utilities');
  const transit = alerts.find((a) => a.module === 'transit');
  const parking = useTopParking();
  const [events, setEvents] = React.useState<EventItem[]>(eventsStore.getEvents());
  React.useEffect(() => eventsStore.subscribe(() => setEvents(eventsStore.getEvents())), []);
  const next = events[0];
  const later = events.slice(1, 3);

  const go = (path: string) => router.push(path as any);
  const openAlert = (id: string) => router.push({ pathname: '/alerts/[id]', params: { id } } as any);

  const UtilitiesArt = moduleArt.utilities;
  const TransitArt = moduleArt.transit;
  const ParkieArt = moduleArt.parkie;
  const EventsArt = moduleArt.events;

  return (
    <Screen>
      {/* Header: greeting left, alerts bell top-right */}
      <View style={styles.topbar}>
        <View style={{ paddingHorizontal: 4 }}>
          <Text variant="body" color="mutedForeground" style={{ fontSize: 15, lineHeight: 20 }}>
            {greeting}
          </Text>
          <Text variant="title" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 34 }}>
            {displayName}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Alerts, ${unreadAlerts} new`}
          onPress={() => go('/alerts')}
          style={styles.bell}
        >
          <icons.Bell size={26} weight="bold" color={colors.foreground} />
          {unreadAlerts > 0 ? <View style={styles.bellDot} /> : null}
        </Pressable>
      </View>

      <AskBar label={`Ask hop about ${getCity().name}`} onPress={() => go('/m/assistant')} />

      <Section title="Tonight">
        <View style={styles.featureHead}>
          <CinemaScene width={92} />
          <View style={{ flex: 1 }}>
            <Text variant="subheading" accessibilityRole="header">
              {next?.title ?? 'Cinema under the stars'}
            </Text>
            <Text variant="rowDetail" color="mutedForeground">
              {next ? `${next.dateTime}, ${next.locationName}. ${next.isFree ? 'Free.' : `${next.priceAmount ?? ''} RON.`}` : 'Tonight at 19:30, Faber. Free. Bring a blanket.'}
            </Text>
          </View>
        </View>
        <View style={styles.featureFoot}>
          <View style={styles.going}>
            <AvatarStack
              label={`${next?.attendeeCount ?? 12} people are going`}
              people={[{ initials: 'MA', tone: 'apricot' }, { initials: 'DR', tone: 'blue' }, { initials: 'IO', tone: 'mint' }]}
            />
            <Text variant="label">{next?.attendeeCount ?? 12} going</Text>
          </View>
          <PrimaryButton label="Find a buddy" size="md" onPress={() => go('/m/buddy')} />
        </View>
      </Section>

      <Section title="Right now" onSeeAll={() => go('/alerts')}>
        <RowGroup>
          {outage ? (
            <Row onPress={() => openAlert(outage.id)} accessibilityLabel={`${outage.title}. ${outage.detail}`}>
              <Row.Illustration>
                <UtilitiesArt size={44} />
              </Row.Illustration>
              <Row.Body>
                <Row.Title>{outage.title}</Row.Title>
                <Row.Detail>{outage.detail}</Row.Detail>
              </Row.Body>
              <Row.Trailing>{outage.trailing.kind === 'new' ? <Row.NewDot /> : <Row.Time>{outage.trailing.text}</Row.Time>}</Row.Trailing>
            </Row>
          ) : null}
          {transit ? (
            <Row onPress={() => openAlert(transit.id)} accessibilityLabel={`${transit.title}. ${transit.detail}`}>
              <Row.Illustration>
                <TransitArt size={44} />
              </Row.Illustration>
              <Row.Body>
                <Row.Title>{transit.title}</Row.Title>
                <Row.Detail>{transit.detail}</Row.Detail>
              </Row.Body>
              <Row.Trailing>{transit.trailing.kind === 'time' ? <Row.Time>{transit.trailing.text}</Row.Time> : null}</Row.Trailing>
            </Row>
          ) : null}
          {!outage && !transit ? (
            <Row>
              <Row.Body>
                <Row.Title>All quiet</Row.Title>
                <Row.Detail>No outages or transit changes right now.</Row.Detail>
              </Row.Body>
            </Row>
          ) : null}
          {parking ? (
            <Row onPress={() => go('/m/parkie')} accessibilityLabel={`${parking.free} free spots, ${parking.name}`}>
              <Row.Illustration>
                <ParkieArt size={44} />
              </Row.Illustration>
              <Row.Body>
                <Row.Title>{parking.free} free spots</Row.Title>
                <Row.Detail>{parking.name}.</Row.Detail>
              </Row.Body>
              <Row.Trailing>
                <Row.Meter value={parking.capacity ? parking.free / parking.capacity : 0} label={`${Math.round((parking.free / Math.max(1, parking.capacity)) * 100)} percent free`} />
              </Row.Trailing>
            </Row>
          ) : null}
        </RowGroup>
      </Section>

      <Section title="Explore" onSeeAll={() => go('/(tabs)/community')}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.stripContent}>
          {explore.map((e) => {
            const Art = moduleArt[e.id];
            return (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={e.label}
                onPress={e.route ? () => go(e.route!) : undefined}
                style={styles.pick}
              >
                <Art size={60} />
                <Text variant="label" style={{ fontSize: 13, lineHeight: 17 }}>
                  {e.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Section>

      <Section title="This week" onSeeAll={() => go('/m/events')}>
        <RowGroup>
          {later.map((e) => (
            <Row key={e.id} onPress={() => go('/m/events')} accessibilityLabel={`${e.title}, ${e.dateTime}`}>
              <Row.Illustration>
                <EventsArt size={44} />
              </Row.Illustration>
              <Row.Body>
                <Row.Title>{e.title}</Row.Title>
                <Row.Detail>{`${e.dateTime}${e.isFree ? ', free' : ''}.`}</Row.Detail>
              </Row.Body>
            </Row>
          ))}
          {later.length === 0 ? (
            <Row>
              <Row.Body>
                <Row.Title>Nothing else planned yet</Row.Title>
                <Row.Detail>Host an event in the Community tab.</Row.Detail>
              </Row.Body>
            </Row>
          ) : null}
        </RowGroup>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  bell: { width: minTarget, height: minTarget, alignItems: 'center', justifyContent: 'center' },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: palette.apricot500,
    borderWidth: 2,
    borderColor: palette.white,
  },
  featureHead: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 2, paddingTop: 8 },
  featureFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 2 },
  going: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strip: { marginRight: -16 },
  stripContent: { gap: 8, paddingRight: 16, paddingTop: 8 },
  pick: { width: 64, alignItems: 'center', gap: 6 },
  webGuestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  webGuestBannerTitle: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '700',
  },
  webGuestBannerDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  webGuestLoginBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  webGuestLoginBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

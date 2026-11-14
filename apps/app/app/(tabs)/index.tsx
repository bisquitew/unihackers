import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { alertById, unreadAlerts } from '../../src/core/mock/alerts';

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
];

export default function HomeScreen() {
  const router = useRouter();
  const go = (path: string) => router.push(path as any);
  const openAlert = (id: string) => router.push({ pathname: '/alerts/[id]', params: { id } } as any);

  const hotWater = alertById('hot-water-garii-2')!;
  const tram = alertById('tram-5')!;
  const UtilitiesArt = moduleArt[hotWater.module];
  const TransitArt = moduleArt[tram.module];
  const ParkieArt = moduleArt.parkie;

  return (
    <Screen>
      {/* Header: greeting left, alerts bell top-right */}
      <View style={styles.topbar}>
        <View style={{ paddingHorizontal: 4 }}>
          <Text variant="body" color="mutedForeground" style={{ fontSize: 15, lineHeight: 20 }}>
            Good evening
          </Text>
          <Text variant="title" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 34 }}>
            Maria
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

      <AskBar label="Ask hop about Timișoara" onPress={() => go('/m/assistant')} />

      <Section title="Tonight">
        <View style={styles.featureHead}>
          <CinemaScene width={92} />
          <View style={{ flex: 1 }}>
            <Text variant="subheading" accessibilityRole="header">
              Cinema under the stars
            </Text>
            <Text variant="rowDetail" color="mutedForeground">
              Tonight at 19:30, Faber. Free. Bring a blanket.
            </Text>
          </View>
        </View>
        <View style={styles.featureFoot}>
          <View style={styles.going}>
            <AvatarStack
              label="12 people are going"
              people={[{ initials: 'MA', tone: 'apricot' }, { initials: 'DR', tone: 'blue' }, { initials: 'IO', tone: 'mint' }]}
            />
            <Text variant="label">12 going</Text>
          </View>
          <PrimaryButton label="Find a buddy" size="md" onPress={() => go('/m/buddy')} />
        </View>
      </Section>

      <Section title="Right now" onSeeAll={() => go('/alerts')}>
        <RowGroup>
          <Row onPress={() => openAlert(hotWater.id)} accessibilityLabel={`${hotWater.title}. ${hotWater.detail}`}>
            <Row.Illustration>
              <UtilitiesArt size={44} />
            </Row.Illustration>
            <Row.Body>
              <Row.Title>{hotWater.title}</Row.Title>
              <Row.Detail>{hotWater.detail}</Row.Detail>
            </Row.Body>
            <Row.Trailing>
              <Row.NewDot />
            </Row.Trailing>
          </Row>
          <Row onPress={() => openAlert(tram.id)} accessibilityLabel={`${tram.title}. ${tram.detail}`}>
            <Row.Illustration>
              <TransitArt size={44} />
            </Row.Illustration>
            <Row.Body>
              <Row.Title>{tram.title}</Row.Title>
              <Row.Detail>{tram.detail}</Row.Detail>
            </Row.Body>
            <Row.Trailing>
              <Row.Time>Until Dec</Row.Time>
            </Row.Trailing>
          </Row>
          <Row>
            <Row.Illustration>
              <ParkieArt size={44} />
            </Row.Illustration>
            <Row.Body>
              <Row.Title>42 free spots</Row.Title>
              <Row.Detail>Iulius Town parking.</Row.Detail>
            </Row.Body>
            <Row.Trailing>
              <Row.Meter value={0.34} label="34 percent free" />
            </Row.Trailing>
          </Row>
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
          <Row onPress={() => go('/m/events')} accessibilityLabel="Jazz in Parcul Rozelor, Saturday 18:00, free">
            <Row.Illustration>
              <Row.Date day="Sat" date="18" />
            </Row.Illustration>
            <Row.Body>
              <Row.Title>Jazz in Parcul Rozelor</Row.Title>
              <Row.Detail>Saturday 18:00, free.</Row.Detail>
            </Row.Body>
          </Row>
          <Row onPress={() => go('/m/events')} accessibilityLabel="Pottery night, Sunday 17:00, 8 spots left">
            <Row.Illustration>
              <Row.Date day="Sun" date="19" />
            </Row.Illustration>
            <Row.Body>
              <Row.Title>Pottery night</Row.Title>
              <Row.Detail>Sunday 17:00, 8 spots left.</Row.Detail>
            </Row.Body>
          </Row>
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
});

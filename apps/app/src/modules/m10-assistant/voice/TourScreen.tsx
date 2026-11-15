// The narrated walking tour, on the map: the stops are pins, the way to the stop you are on is drawn as a line, and a card at
// the bottom has the story, the directions, and Back / Next. Stops come from docs/voice/tour.md (GET /v1/m/assistant/tour),
// the walk between them from GET /v1/m/assistant/tour/walk, and both are read aloud through the assistant's voice.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CityMap, type MapFocus, type MapPin } from '@hub/map';
import { IconButton, PrimaryButton, SecondaryButton, Segmented, Text, TextButton, colors, icons, isDark, radii, shadows } from '@hub/ui';
import { useMyLocation } from '../../../core/location';
import { usePrefs } from '../../../core/prefs';
import { API_URL } from '../config';
import { ListenButton } from './ListenButton';
import { stopSpeaking, type VoiceLang } from './voiceClient';

interface TourStop {
  id: string;
  title: { ro: string; en: string };
  coordinate: { lat: number; lng: number };
  text: { ro: string; en: string };
}
interface TourLeg {
  from_id: string | null;
  to_id: string;
  distance_m: number;
  duration_s: number;
  geometry: [number, number][];
  steps: { text: string; distance_m: number }[];
  spoken: string;
  warnings: string[];
}

const metres = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`);

export function TourScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const prefs = usePrefs();
  const me = useMyLocation();

  const [stops, setStops] = useState<TourStop[]>([]);
  const [legs, setLegs] = useState<Record<string, TourLeg>>({});
  const [lang, setLang] = useState<VoiceLang>('ro');
  const [index, setIndex] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const [start, setStart] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cardHeight, setCardHeight] = useState(0);
  const ro = lang === 'ro';

  useEffect(() => {
    fetch(`${API_URL}/v1/m/assistant/tour`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((t: { stops: TourStop[] }) => setStops(t.stops))
      .catch(() => setError('Could not load the tour.'))
      .finally(() => setLoading(false));
    return () => stopSpeaking();
  }, []);

  // the walk to each stop, in the tour's language (again when the language changes or a starting point is chosen)
  useEffect(() => {
    let alive = true;
    const from = start ? `&from=${start.latitude.toFixed(5)},${start.longitude.toFixed(5)}` : '';
    fetch(`${API_URL}/v1/m/assistant/tour/walk?lang=${lang}${from}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((t: { legs: TourLeg[] }) => alive && setLegs(Object.fromEntries(t.legs.map((l) => [l.to_id, l]))))
      .catch(() => alive && setLegs({}));
    return () => {
      alive = false;
    };
  }, [lang, start]);

  const stop = stops[index];
  const leg = stop ? legs[stop.id] : undefined;
  const prev = index > 0 ? stops[index - 1] : undefined;
  const last = index === stops.length - 1;

  const go = (next: number) => {
    stopSpeaking();
    setShowSteps(false);
    setIndex(Math.max(0, Math.min(stops.length - 1, next)));
  };

  const walkFromHere = async () => {
    setLocating(true);
    const fix = me.location ?? (await me.start());
    setLocating(false);
    if (fix) setStart({ latitude: fix.latitude, longitude: fix.longitude });
    else setError(ro ? 'Nu am putut găsi locația ta.' : 'Could not find your location.');
  };

  const pins: MapPin[] = useMemo(
    () =>
      stops.map((s, k) => ({
        id: s.id,
        kind: 'place' as const,
        layerId: 'tour',
        coordinate: { latitude: s.coordinate.lat, longitude: s.coordinate.lng },
        title: `${k + 1}. ${s.title[lang]}`,
        visibility: 'public' as const,
        owner: 'official' as const,
        createdAt: '2026-01-01T00:00:00Z',
      })),
    [stops, lang],
  );

  // the way to the stop you are on; with nothing to draw (the first stop, no start chosen) the map just moves to the stop
  const route = useMemo(
    () => (leg ? { coordinates: [...(leg.from_id === null && me.location ? [{ latitude: me.location.latitude, longitude: me.location.longitude }] : []), ...leg.geometry.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))] } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leg],
  );
  const focus: MapFocus | null = !leg && stop ? { latitude: stop.coordinate.lat, longitude: stop.coordinate.lng, zoom: 16.5, nonce: index } : null;

  const bodyMax = Math.round(windowHeight * 0.26);

  return (
    <View style={styles.root}>
      <CityMap
        style={StyleSheet.absoluteFill}
        pins={pins}
        selectedId={stop?.id ?? null}
        focus={focus}
        route={route}
        userLocation={me.location}
        theme={prefs.mapTheme === 'auto' && isDark ? 'night' : prefs.mapTheme}
        insets={{ top: insets.top + 56, bottom: cardHeight + Math.max(insets.bottom, 12) + 12 }}
        onPinPress={(id) => {
          const k = stops.findIndex((s) => s.id === id);
          if (k >= 0) go(k);
        }}
      />

      {/* back, and the language of the tour */}
      <View pointerEvents="box-none" style={[styles.top, { top: insets.top + 8 }]}>
        <IconButton label="Back" tone="glass" size={44} onPress={() => router.back()}>
          <icons.CaretLeft size={22} weight="bold" color={colors.foreground} />
        </IconButton>
        <View style={{ width: 190 }}>
          <Segmented
            accessibilityLabel="Tour language"
            value={lang}
            onChange={(l) => {
              stopSpeaking();
              setLang(l);
            }}
            options={[
              { id: 'ro', label: 'Română' },
              { id: 'en', label: 'English' },
            ]}
          />
        </View>
      </View>

      {/* the card: where you are in the tour, how to get here, the story, and Back / Next */}
      <View style={[styles.card, { bottom: Math.max(insets.bottom, 12) + 4 }]} onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}>
        {loading ? <ActivityIndicator color={colors.foreground} /> : null}
        {error ? (
          <Text variant="body" color="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        {!loading && !error && !stop ? <Text variant="body">The tour has no stops yet (docs/voice/tour.md).</Text> : null}

        {stop ? (
          <>
            <Text variant="label" color="info">
              {ro ? `Oprirea ${index + 1} din ${stops.length}` : `Stop ${index + 1} of ${stops.length}`}
            </Text>
            <Text variant="subheading" accessibilityRole="header" numberOfLines={2}>
              {stop.title[lang]}
            </Text>

            <ScrollView style={{ maxHeight: bodyMax }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
              {leg ? (
                <View style={{ gap: 4 }}>
                  <Text variant="rowDetail" color="info" style={{ fontWeight: '700' }}>
                    {prev ? (ro ? `De la ${prev.title[lang]}` : `From ${prev.title[lang]}`) : ro ? 'De la locația ta' : 'From your location'} · {Math.max(1, Math.round(leg.duration_s / 60))} min · {metres(leg.distance_m)}
                  </Text>
                  {leg.warnings.length > 0 ? (
                    <Text variant="rowDetail" color="warning" style={{ fontWeight: '700' }}>
                      {ro ? 'Atenție: drumul trece pe lângă ' : 'Careful: the way passes '}
                      {leg.warnings.join(', ')}
                    </Text>
                  ) : null}
                  <View style={styles.row}>
                    <ListenButton text={leg.spoken} lang={lang} label={ro ? 'Ascultă drumul' : 'Listen to the way'} />
                    <TextButton label={showSteps ? (ro ? 'Ascunde pașii' : 'Hide steps') : ro ? 'Arată pașii' : 'Show steps'} size="md" onPress={() => setShowSteps((v) => !v)} />
                  </View>
                  {showSteps
                    ? leg.steps.map((st, k) => (
                        <Text key={k} variant="body">
                          {k + 1}. {st.text}
                          {st.distance_m >= 30 ? ` · ${metres(st.distance_m)}` : ''}
                        </Text>
                      ))
                    : null}
                </View>
              ) : index === 0 ? (
                <SecondaryButton label={ro ? 'Drumul până aici de la locația ta' : 'Walk here from my location'} size="md" loading={locating} onPress={walkFromHere} />
              ) : null}

              <Text variant="body">{stop.text[lang]}</Text>
              <ListenButton text={`${stop.title[lang]}. ${stop.text[lang]}`} lang={lang} label={ro ? 'Ascultă povestea' : 'Listen to the story'} />
            </ScrollView>

            <View style={styles.nav}>
              <SecondaryButton label={ro ? 'Înapoi' : 'Back'} size="lg" disabled={index === 0} onPress={() => go(index - 1)} />
              <PrimaryButton label={last ? (ro ? 'Gata' : 'Finish') : ro ? 'Următoarea oprire' : 'Next stop'} size="lg" onPress={() => (last ? router.back() : go(index + 1))} />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundPage },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { position: 'absolute', left: 12, right: 12, padding: 16, gap: 8, borderRadius: radii.sheet, backgroundColor: colors.background, boxShadow: shadows.float } as any,
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  nav: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 4 },
});

import * as React from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { PinArt, type MapPin } from '@hub/map';
import { Row, Text, colors, fonts, icons, minTarget, radii, shadows, tr } from '@hub/ui';
import { api } from './api';

export interface PlaceMatch {
  id: string;
  name: string;
  detail: string;
  latitude: number;
  longitude: number;
  kind: string;
}

interface Props {
  /** every pin the map knows, so what is already on it can be found without a trip to the server */
  pins: MapPin[];
  top: number;
  /** keep clear of the buttons at the right */
  rightGap: number;
  onPickPin: (pin: MapPin) => void;
  onPickPlace: (place: PlaceMatch) => void;
}

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * The map's search box. What is already on the map (parking, safe places, events, your pins...) is matched on the phone as
 * you type; streets, addresses and places come from the server's place search after a short pause.
 */
export function MapSearch({ pins, top, rightGap, onPickPin, onPickPlace }: Props) {
  const [query, setQuery] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [places, setPlaces] = React.useState<PlaceMatch[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [settled, setSettled] = React.useState(''); // the text the server results belong to
  const q = query.trim();

  const onMap = React.useMemo(() => {
    if (q.length < 2) return [];
    const needle = plain(q);
    return pins.filter((p) => plain(`${p.title} ${p.subtitle ?? ''}`).includes(needle)).slice(0, 4);
  }, [pins, q]);

  React.useEffect(() => {
    if (q.length < 3) {
      setPlaces([]);
      setSearching(false);
      setSettled('');
      return;
    }
    setSearching(true);
    let alive = true;
    const timer = setTimeout(() => {
      api
        .get<{ places: PlaceMatch[] }>('/v1/core/places/search', { q })
        .then((r) => alive && (setPlaces(r.places ?? []), setSettled(q)))
        .catch(() => alive && (setPlaces([]), setSettled(q)))
        .finally(() => alive && setSearching(false));
    }, 450);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q]);

  const close = () => {
    setQuery('');
    setPlaces([]);
    setFocused(false);
    Keyboard.dismiss();
  };
  const open = focused && q.length >= 2;
  const nothing = open && !searching && settled === q && onMap.length === 0 && places.length === 0;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top, right: rightGap }]}>
      <View style={styles.bar}>
        <icons.MagnifyingGlass size={20} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          placeholder={tr('Search places and addresses')}
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel={tr('Search the map')}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
        />
        {searching ? <ActivityIndicator size="small" color={colors.mutedForeground} /> : null}
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel={tr('Clear')} onPress={close} hitSlop={10}>
            <icons.X size={18} color={colors.mutedForeground} weight="bold" />
          </Pressable>
        ) : null}
      </View>

      {open ? (
        <View style={styles.results}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {onMap.length ? (
              <Text variant="label" color="mutedForeground" style={styles.heading}>
                On the map
              </Text>
            ) : null}
            {onMap.map((p) => (
              <Row key={`pin-${p.id}`} onPress={() => { onPickPin(p); close(); }} accessibilityLabel={`${p.title}`}>
                <Row.Illustration>
                  <PinArt kind={p.kind} size={36} />
                </Row.Illustration>
                <Row.Body>
                  <Row.Title>{p.title}</Row.Title>
                  {p.subtitle ? <Row.Detail>{p.subtitle}</Row.Detail> : null}
                </Row.Body>
              </Row>
            ))}
            {places.length ? (
              <Text variant="label" color="mutedForeground" style={styles.heading}>
                Places and addresses
              </Text>
            ) : null}
            {places.map((p) => (
              <Row key={`place-${p.id}`} onPress={() => { onPickPlace(p); close(); }} accessibilityLabel={`${p.name}${p.detail ? `, ${p.detail}` : ''}`}>
                <Row.Illustration>
                  <View style={styles.placeIcon}>
                    <icons.MapPin size={20} color={colors.foreground} weight="fill" />
                  </View>
                </Row.Illustration>
                <Row.Body>
                  <Row.Title>{p.name}</Row.Title>
                  {p.detail ? <Row.Detail>{p.detail}</Row.Detail> : null}
                </Row.Body>
              </Row>
            ))}
            {nothing ? (
              <Text variant="body" color="mutedForeground" style={styles.empty}>
                No matches. Try a street, a place or an address.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, zIndex: 20 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: minTarget,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    boxShadow: shadows.float,
  } as any,
  input: { flex: 1, fontFamily: fonts.ui500, fontSize: 16, color: colors.foreground, paddingVertical: 0 },
  results: { marginTop: 8, borderRadius: radii.sheet, backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 8, boxShadow: shadows.float } as any,
  heading: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 2 },
  empty: { padding: 16 },
  placeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary },
});

import * as React from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View, type LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CityMap,
  PinArt,
  PinArtByKey,
  type PinArtKey,
  allowedVisibilities,
  effectiveVisibility,
  parseMapLink,
  pinKinds,
  userCreatableKinds,
  useCommunityPins,
  usePersonalPins,
  type Coordinate,
  type MapFocus,
  type MapLayer,
  type MapPin,
  type PinKind,
  type PinVisibility,
} from '@hub/map';
import { Chip, Field, IconButton, PrimaryButton, Row, RowGroup, SecondaryButton, Sheet, Text, TextButton, colors, icons, palette, radii, shadows, isDark } from '@hub/ui';

// The hue dot on a switched-on layer chip. Blue = getting around and city information, mint = people and services, ink = yours.
// the picture shown for each layer in the "Show on the map" list (the same flat artwork as the pins)
const LAYER_ART: Record<string, PinArtKey> = { mine: 'home', alerts: 'utilities', community: 'buddy', events: 'events' };
const LAYER_DOT: Record<string, string> = { mine: palette.ink900, alerts: palette.blue500, community: palette.mint500, events: palette.mint500 };
import { allMapLayers } from '../../src/core/map-layers';
import { usePrefs } from '../../src/core/prefs';
import { useMyLocation } from '../../src/core/location';
import { getMapLayersVersion, onMapLayersChanged } from '../../src/core/map-layers/changes';

const TAB_BAR_BODY = 68; // height of the floating tab bar (see packages/ui/src/TabBar.tsx); it sits above the bottom safe area
const PLACE_BAR_H = 140; // the "Choose the spot" bar, shown while the user places a pin
const PIN_TIP = 52; // distance from the top of the placement marker to the exact spot it marks
const UNIRII: Coordinate = { latitude: 45.7579, longitude: 21.229 };

type Draft = { coordinate: Coordinate; kind: PinKind; title: string; visibility: PinVisibility };

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const prefs = usePrefs();
  const me = useMyLocation();
  const params = useLocalSearchParams();

  /* ---------- data: the user's pins, the community's, and layers contributed by modules ---------- */
  const mine = usePersonalPins();
  const community = useCommunityPins();
  // Re-collect module layers when a module says its pins changed (e.g. fetched after this tab mounted).
  const layersVersion = React.useSyncExternalStore(onMapLayersChanged, getMapLayersVersion, getMapLayersVersion);
  const moduleLayers = React.useMemo(() => allMapLayers(), [layersVersion]);
  const layers: MapLayer[] = React.useMemo(
    () => [
      { id: 'mine', title: 'Your pins', pins: mine.pins, defaultVisible: true },
      ...moduleLayers,
      { id: 'community', title: 'Neighbours', pins: community, defaultVisible: true },
    ],
    [mine.pins, moduleLayers, community],
  );
  const [hidden, setHidden] = React.useState<Record<string, boolean>>({});
  const visiblePins = React.useMemo(() => layers.filter((l) => !hidden[l.id]).flatMap((l) => l.pins), [layers, hidden]);

  /* ---------- selection, camera, sheets ---------- */
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = React.useMemo(() => layers.flatMap((l) => l.pins).find((p) => p.id === selectedId) ?? null, [layers, selectedId]);
  const [focus, setFocus] = React.useState<MapFocus | null>(null);
  const camera = React.useRef<Coordinate>(UNIRII);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  // 'new': choosing where a new pin goes. 'move': moving the spot of the pin that is being filled in.
  const [placing, setPlacing] = React.useState<null | 'new' | 'move'>(null);
  const [mapHeight, setMapHeight] = React.useState(0);
  const [listOpen, setListOpen] = React.useState(false);
  const [layersOpen, setLayersOpen] = React.useState(false);
  const hiddenCount = Object.values(hidden).filter(Boolean).length;
  const [sheetHeight, setSheetHeight] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  const goTo = React.useCallback((c: Coordinate, zoom = 17) => setFocus((f) => ({ latitude: c.latitude, longitude: c.longitude, zoom, nonce: (f?.nonce ?? 0) + 1 })), []);
  // Move the camera without changing the zoom (used while choosing a spot).
  const panTo = React.useCallback((c: Coordinate) => setFocus((f) => ({ latitude: c.latitude, longitude: c.longitude, nonce: (f?.nonce ?? 0) + 1 })), []);

  const select = React.useCallback(
    (pin: MapPin | null) => {
      setDraft(null);
      setListOpen(false);
      setSelectedId(pin?.id ?? null);
      if (pin) {
        const zoom = pin.radiusMeters
          ? (pin.radiusMeters >= 1000 ? 13.8 : pin.radiusMeters >= 600 ? 14.5 : 15.2)
          : 17;
        goTo(pin.coordinate, zoom);
      }
    },
    [goTo],
  );

  /* ---------- links into the map: ?pin=layer:id  or  ?lat=&lng=&zoom= ---------- */
  const link = parseMapLink(params as Record<string, string | string[] | undefined>);
  React.useEffect(() => {
    if (link.pin) {
      const [layerId, pinId] = link.pin.split(':');
      const pin = layers.find((l) => l.id === layerId)?.pins.find((p) => p.id === pinId);
      if (pin) {
        setHidden((h) => ({ ...h, [layerId]: false }));
        select(pin);
      }
    } else if (typeof link.lat === 'number' && typeof link.lng === 'number') {
      goTo({ latitude: link.lat, longitude: link.lng }, link.zoom ?? 17);
    }
    // only when the link itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link.pin, link.lat, link.lng, link.zoom]);

  /* ---------- creating a pin ---------- */
  const startDraft = (coordinate: Coordinate) => {
    setSelectedId(null);
    setListOpen(false);
    const kind: PinKind = 'favourite';
    setDraft({ coordinate, kind, title: '', visibility: effectiveVisibility(kind) });
  };
  // "+" opens placement: a fixed marker in the middle of the map; the user moves the map under it, then confirms.
  const startPlacing = () => {
    setSelectedId(null);
    setListOpen(false);
    setDraft(null);
    setPlacing('new');
  };
  const confirmPlacing = () => {
    const spot = camera.current;
    if (placing === 'move' && draft) setDraft({ ...draft, coordinate: spot });
    else startDraft(spot);
    setPlacing(null);
  };
  const chooseKind = (kind: PinKind) => setDraft((d) => (d ? { ...d, kind, visibility: effectiveVisibility(kind) } : d));
  const saveDraft = () => {
    if (!draft) return;
    const pin = mine.add({ kind: draft.kind, title: draft.title, coordinate: draft.coordinate, visibility: draft.visibility });
    setDraft(null);
    setHidden((h) => ({ ...h, mine: false }));
    setSelectedId(pin.id);
    goTo(pin.coordinate, 17);
  };

  /* ---------- layout ---------- */
  const anySheet = !!selected || (!!draft && !placing) || listOpen;
  const topSpace = insets.top + 8;
  // Everything that floats at the bottom (sheets, the placement bar) sits just above the tab bar, which itself sits
  // above the phone's bottom safe area. Measured from the real insets so nothing overlaps on phones with a home bar.
  const clearance = Math.max(insets.bottom, 12) + 2 + TAB_BAR_BODY + 10;
  // The map keeps its middle clear of whatever covers the bottom (tab bar, a sheet, the placement bar).
  const bottomInset = placing ? PLACE_BAR_H + clearance : anySheet ? sheetHeight + clearance : clearance;
  // The tallest a sheet's content can be: the map area, minus the tab bar and the chips row.
  const sheetMax = Math.max(220, mapHeight - clearance - topSpace - 70);
  // The pin being filled in shows on the map, so the user can see where it will go.
  const draftPin: MapPin | null =
    draft && !placing
      ? { id: 'draft', kind: draft.kind, layerId: 'mine', coordinate: draft.coordinate, title: draft.title || pinKinds[draft.kind].label, visibility: 'private', owner: 'me', createdAt: new Date().toISOString() }
      : null;
  const mapPins = draftPin ? [...visiblePins, draftPin] : visiblePins;
  // The placement marker's tip sits on the middle of the visible map (the camera centre, above the bottom inset).
  const markerTop = mapHeight > 0 ? (mapHeight - bottomInset) / 2 - PIN_TIP : 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      onLayout={(e: LayoutChangeEvent) => setMapHeight(e.nativeEvent.layout.height)}
    >
      <CityMap
        style={StyleSheet.absoluteFill}
        pins={mapPins}
        selectedId={selectedId}
        focus={focus}
        userLocation={me.location}
        reducedMotion={reducedMotion}
        theme={prefs.mapTheme === 'auto' && isDark ? 'night' : prefs.mapTheme}
        insets={{ bottom: bottomInset }}
        onPinPress={(id) => {
          if (id !== 'draft') select(visiblePins.find((p) => p.id === id) ?? null); // the pin being filled in is not selectable
        }}
        onLongPress={placing ? undefined : startDraft}
        onMapPress={(c) => {
          if (placing) panTo(c); // tapping the map while choosing a spot moves the marker there
          else if (!draft) setSelectedId(null);
        }}
        onCamera={(c) => {
          camera.current = { latitude: c.latitude, longitude: c.longitude };
        }}
      />

      {/* map controls: one column at the top right. Layers and the list are frosted, the pink "+" is the one main action */}
      {placing ? null : (
        <View pointerEvents="box-none" style={[styles.actions, { top: topSpace }]}>
          <View>
            <IconButton label={hiddenCount > 0 ? `Choose what shows on the map, ${hiddenCount} hidden` : 'Choose what shows on the map'} tone="glass" size={44} onPress={() => { setSelectedId(null); setDraft(null); setLayersOpen(true); }}>
              <icons.Stack size={22} weight="bold" color={colors.foreground} />
            </IconButton>
            {hiddenCount > 0 ? <View pointerEvents="none" style={styles.badge} /> : null}
          </View>
          <IconButton label="List pins on the map" tone="glass" size={44} onPress={() => { setSelectedId(null); setDraft(null); setListOpen(true); }}>
            <icons.ListBullets size={22} weight="bold" color={colors.foreground} />
          </IconButton>
          <IconButton
            label={me.status === 'denied' ? 'Location is off. Turn it on in Settings' : me.status === 'on' ? 'Centre the map on you' : 'Show where I am'}
            tone={me.status === 'on' ? 'ink' : 'glass'}
            size={44}
            onPress={async () => {
              setSelectedId(null);
              const fix = me.location ?? (await me.start());
              if (fix) goTo(fix, 16.5);
            }}
          >
            <icons.NavigationArrow size={22} weight={me.status === 'on' ? 'fill' : 'bold'} color={me.status === 'on' ? colors.inverseForeground : colors.foreground} />
          </IconButton>
          <IconButton label="Add a pin" tone="primary" size={44} onPress={startPlacing}>
            <icons.Plus size={22} weight="bold" color={colors.primaryForeground} />
          </IconButton>
        </View>
      )}

      {/* what shows on the map */}
      <Sheet visible={layersOpen} scrim bottomOffset={clearance} onHeight={setSheetHeight} onClose={() => setLayersOpen(false)} accessibilityLabel="What shows on the map">
        <View style={styles.listHead}>
          <Text variant="subheading" accessibilityRole="header">
            Show on the map
          </Text>
        </View>
        <RowGroup>
          {layers.map((l) => (
            <Row key={l.id}>
              <Row.Illustration>
                {LAYER_ART[l.id] ? <PinArtByKey art={LAYER_ART[l.id]} size={40} /> : <View style={[styles.layerDot, { backgroundColor: LAYER_DOT[l.id] ?? palette.ink900 }]} />}
              </Row.Illustration>
              <Row.Body>
                <Row.Title>{l.title}</Row.Title>
                <Row.Detail>{`${l.pins.length} ${l.pins.length === 1 ? 'pin' : 'pins'}`}</Row.Detail>
              </Row.Body>
              <Row.Trailing>
                <Switch value={!hidden[l.id]} onValueChange={() => setHidden((h) => ({ ...h, [l.id]: !h[l.id] }))} accessibilityLabel={l.title} trackColor={{ false: colors.secondaryPressed, true: colors.success }} thumbColor="#FFFFFF" />
              </Row.Trailing>
            </Row>
          ))}
        </RowGroup>
      </Sheet>

      {/* choosing the spot for a pin */}
      {placing ? (
        <>
          <View pointerEvents="none" style={[styles.marker, { top: markerTop }]}>
            <View style={styles.markerDisc}>
              <icons.Plus size={22} weight="bold" color={colors.foreground} />
            </View>
            <View style={styles.markerDot} />
          </View>
          <View style={[styles.placeBar, { bottom: clearance }]}>
            <Text variant="subheading" accessibilityRole="header">
              Choose the spot
            </Text>
            <Text variant="rowDetail" color="mutedForeground">
              Move the map, or tap where the pin should go.
            </Text>
            <View style={styles.placeActions}>
              <TextButton label="Cancel" size="md" onPress={() => setPlacing(null)} />
              <PrimaryButton label="Place pin here" size="md" onPress={confirmPlacing} />
            </View>
          </View>
        </>
      ) : null}

      {/* a selected pin */}
      <Sheet visible={!!selected && !draft} scrim={false} bottomOffset={clearance} onHeight={setSheetHeight} onClose={() => setSelectedId(null)} accessibilityLabel="Pin details">
        {selected ? <PinDetail pin={selected} onOpen={(href) => router.push(href as any)} onDelete={() => { mine.remove(selected.id); setSelectedId(null); }} onToggleShare={(v) => mine.update(selected.id, { visibility: v })} /> : null}
      </Sheet>

      {/* a new pin */}
      <Sheet visible={!!draft && !placing} scrim bottomOffset={clearance} onHeight={setSheetHeight} onClose={() => setDraft(null)} accessibilityLabel="New pin">
        {draft ? <NewPinForm draft={draft} onKind={chooseKind} onTitle={(title) => setDraft({ ...draft, title })} onVisibility={(visibility) => setDraft({ ...draft, visibility })} onMove={() => setPlacing('move')} onSave={saveDraft} maxHeight={sheetMax} /> : null}
      </Sheet>

      {/* the list view: every visible pin as text, for people who cannot use the map */}
      <Sheet visible={listOpen} scrim bottomOffset={clearance} onHeight={setSheetHeight} onClose={() => setListOpen(false)} accessibilityLabel="Pins on the map">
        <View style={styles.listHead}>
          <Text variant="subheading" accessibilityRole="header">
            On the map
          </Text>
        </View>
        <ScrollView style={{ maxHeight: Math.min(320, sheetMax) }}>
          {visiblePins.length === 0 ? (
            <Text variant="body" color="mutedForeground">
              No pins yet. Long-press the map to add one.
            </Text>
          ) : (
            <RowGroup>
              {visiblePins.map((p) => (
                <Row key={p.id} onPress={() => select(p)} accessibilityLabel={`${p.title}, ${pinKinds[p.kind].label}`}>
                  <Row.Illustration>
                    <PinArt kind={p.kind} size={40} />
                  </Row.Illustration>
                  <Row.Body>
                    <Row.Title>{p.title}</Row.Title>
                    <Row.Detail>{pinKinds[p.kind].label}</Row.Detail>
                  </Row.Body>
                  <Row.Trailing>
                    <icons.CaretRight size={18} color={colors.mutedForeground} />
                  </Row.Trailing>
                </Row>
              ))}
            </RowGroup>
          )}
        </ScrollView>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

/* ---------- pieces ---------- */

function visibilityNote(pin: MapPin) {
  const m = pinKinds[pin.kind].sharePrecisionMeters;
  if (pin.owner === 'me') return pin.visibility === 'public' ? `Shared with neighbours without your name${m ? `. The spot is rounded to about ${m} m.` : '.'}` : 'Only you can see this.';
  if (pin.owner === 'community') return 'Shared by a neighbour.';
  return '';
}

function PinDetail({ pin, onOpen, onDelete, onToggleShare }: { pin: MapPin; onOpen: (href: string) => void; onDelete: () => void; onToggleShare: (v: PinVisibility) => void }) {
  const canChoose = pin.owner === 'me' && allowedVisibilities(pin.kind).length > 1;
  const note = visibilityNote(pin);
  return (
    <View style={styles.detail}>
      <View style={styles.detailHead}>
        <PinArt kind={pin.kind} size={52} />
        <View style={{ flex: 1 }}>
          <Text variant="subheading" accessibilityRole="header">
            {pin.title}
          </Text>
          <Text variant="rowDetail" color="mutedForeground">
            {pinKinds[pin.kind].label}
          </Text>
        </View>
      </View>
      {pin.subtitle ? <Text variant="body">{pin.subtitle}</Text> : null}
      {pin.radiusMeters ? (
        <Text variant="rowDetail" style={{ color: pin.zoneType === 'danger' ? '#ef4444' : '#f59e0b', fontWeight: '700' }}>
          ⭕ Rază activă: {pin.radiusMeters} metri ({pin.zoneType === 'danger' ? 'Perimetru de Siguranță' : 'Zonă de Șantier'})
        </Text>
      ) : null}
      {note ? (
        <Text variant="rowDetail" color="mutedForeground">
          {note}
        </Text>
      ) : null}
      {pin.demo ? (
        <Text variant="caption" color="mutedForeground">
          Sample data for the demo.
        </Text>
      ) : null}
      <View style={styles.stack}>
        {pin.href ? <PrimaryButton label="Open" size="lg" onPress={() => onOpen(pin.href!)} /> : null}
        {canChoose ? <SecondaryButton label={pin.visibility === 'public' ? 'Make private' : 'Share with neighbours'} size="lg" onPress={() => onToggleShare(pin.visibility === 'public' ? 'private' : 'public')} /> : null}
        {pin.owner === 'me' ? <TextButton label="Delete pin" size="lg" onPress={onDelete} /> : null}
      </View>
    </View>
  );
}

function NewPinForm({ draft, onKind, onTitle, onVisibility, onMove, onSave, maxHeight }: { draft: Draft; onKind: (k: PinKind) => void; onTitle: (t: string) => void; onVisibility: (v: PinVisibility) => void; onMove: () => void; onSave: () => void; maxHeight: number }) {
  const choices = allowedVisibilities(draft.kind);
  const def = pinKinds[draft.kind];
  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight }} contentContainerStyle={styles.detail}>
      <View style={styles.formHead}>
        <Text variant="subheading" accessibilityRole="header">
          New pin
        </Text>
        <TextButton label="Change spot" size="md" onPress={onMove} />
      </View>
      <View style={styles.kinds}>
        {userCreatableKinds.map((k) => (
          <Chip key={k.id} label={k.label} selected={draft.kind === k.id} onPress={() => onKind(k.id)} leading={<PinArt kind={k.id} size={22} />} />
        ))}
      </View>
      <Field label="Title" value={draft.title} onChangeText={onTitle} placeholder={def.label} maxLength={60} />
      {choices.length > 1 ? (
        <View style={{ gap: 8 }}>
          <View style={styles.kinds}>
            <Chip label="Only me" selected={draft.visibility === 'private'} onPress={() => onVisibility('private')} leading={<icons.Lock size={18} weight="bold" color={draft.visibility === 'private' ? colors.inverseForeground : colors.foreground} />} />
            <Chip label="Share with neighbours" selected={draft.visibility === 'public'} onPress={() => onVisibility('public')} leading={<icons.UsersThree size={20} weight="bold" color={draft.visibility === 'public' ? colors.inverseForeground : colors.foreground} />} />
          </View>
          <Text variant="rowDetail" color="mutedForeground">
            {draft.visibility === 'public' ? `Neighbours see the pin, not your name.${def.sharePrecisionMeters ? ` The spot is rounded to about ${def.sharePrecisionMeters} m.` : ''}` : 'Only you can see it.'}
          </Text>
        </View>
      ) : (
        <Text variant="rowDetail" color="mutedForeground">
          {def.description}
        </Text>
      )}
      <View style={styles.stack}>
        <PrimaryButton label="Save pin" size="lg" onPress={onSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundPage },
  chips: { position: 'absolute', left: 0, right: 0 },
  chipRow: { gap: 8, paddingHorizontal: 16 },
  actions: { position: 'absolute', right: 16, gap: 8 },
  badge: { position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.inverse, borderWidth: 2, borderColor: colors.background },
  layerDot: { width: 14, height: 14, borderRadius: 7 },
  formHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // the placement marker: a white disc ringed in ink, with a dot underneath that marks the exact spot
  marker: { position: 'absolute', left: 0, right: 0, height: 56, alignItems: 'center' },
  markerDisc: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, borderWidth: 3, borderColor: colors.inverse, alignItems: 'center', justifyContent: 'center', boxShadow: shadows.float } as any,
  markerDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, backgroundColor: colors.inverse },
  placeBar: { position: 'absolute', left: 12, right: 12, height: PLACE_BAR_H, padding: 16, gap: 4, borderRadius: radii.sheet, backgroundColor: colors.background, boxShadow: shadows.float } as any,
  placeActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  detail: { gap: 12 },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stack: { gap: 8, marginTop: 4 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
});

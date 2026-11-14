import * as React from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CityMap,
  PinArt,
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
import { Chip, Field, IconButton, PrimaryButton, Row, RowGroup, SecondaryButton, Sheet, Text, TextButton, colors, icons, palette } from '@hub/ui';

// The hue dot on a switched-on layer chip. Blue = getting around and city information, mint = people and services, ink = yours.
const LAYER_DOT: Record<string, string> = { mine: palette.ink900, alerts: palette.blue500, community: palette.mint500 };
import { allMapLayers } from '../../src/core/map-layers';
import { getMapLayersVersion, onMapLayersChanged } from '../../src/core/map-layers/changes';

const TAB_BAR_CLEARANCE = 100; // the floating tab bar sits at the bottom of this screen
const UNIRII: Coordinate = { latitude: 45.7579, longitude: 21.229 };

type Draft = { coordinate: Coordinate; kind: PinKind; title: string; visibility: PinVisibility };

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [listOpen, setListOpen] = React.useState(false);
  const [sheetHeight, setSheetHeight] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  const goTo = React.useCallback((c: Coordinate, zoom = 17) => setFocus((f) => ({ latitude: c.latitude, longitude: c.longitude, zoom, nonce: (f?.nonce ?? 0) + 1 })), []);

  const select = React.useCallback(
    (pin: MapPin | null) => {
      setDraft(null);
      setListOpen(false);
      setSelectedId(pin?.id ?? null);
      if (pin) goTo(pin.coordinate, 17);
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
  const anySheet = !!selected || !!draft || listOpen;
  const bottomInset = anySheet ? sheetHeight + TAB_BAR_CLEARANCE : TAB_BAR_CLEARANCE;
  const topSpace = insets.top + 8;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CityMap
        style={StyleSheet.absoluteFill}
        pins={visiblePins}
        selectedId={selectedId}
        focus={focus}
        reducedMotion={reducedMotion}
        insets={{ bottom: bottomInset }}
        onPinPress={(id) => select(visiblePins.find((p) => p.id === id) ?? null)}
        onLongPress={startDraft}
        onMapPress={() => {
          if (!draft) setSelectedId(null);
        }}
        onCamera={(c) => {
          camera.current = { latitude: c.latitude, longitude: c.longitude };
        }}
      />

      {/* layer chips */}
      <View pointerEvents="box-none" style={[styles.chips, { top: topSpace }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {layers.map((l) => (
            <Chip
              key={l.id}
              tone="glass"
              dot={LAYER_DOT[l.id] ?? palette.ink900}
              label={l.title}
              selected={!hidden[l.id]}
              onPress={() => setHidden((h) => ({ ...h, [l.id]: !h[l.id] }))}
            />
          ))}
        </ScrollView>
      </View>

      {/* actions */}
      <View pointerEvents="box-none" style={[styles.actions, { top: topSpace + 60 }]}>
        <IconButton label="Add a pin here" onPress={() => startDraft(camera.current)}>
          <icons.Plus size={24} weight="bold" color={colors.foreground} />
        </IconButton>
        <IconButton label="List pins on the map" onPress={() => { setSelectedId(null); setDraft(null); setListOpen(true); }}>
          <icons.ListBullets size={24} weight="bold" color={colors.foreground} />
        </IconButton>
      </View>

      {/* a selected pin */}
      <Sheet visible={!!selected && !draft} scrim={false} bottomOffset={TAB_BAR_CLEARANCE - 8} onHeight={setSheetHeight} onClose={() => setSelectedId(null)} accessibilityLabel="Pin details">
        {selected ? <PinDetail pin={selected} onClose={() => setSelectedId(null)} onOpen={(href) => router.push(href as any)} onDelete={() => { mine.remove(selected.id); setSelectedId(null); }} onToggleShare={(v) => mine.update(selected.id, { visibility: v })} /> : null}
      </Sheet>

      {/* a new pin */}
      <Sheet visible={!!draft} scrim bottomOffset={TAB_BAR_CLEARANCE - 8} onHeight={setSheetHeight} onClose={() => setDraft(null)} accessibilityLabel="New pin">
        {draft ? <NewPinForm draft={draft} onKind={chooseKind} onTitle={(title) => setDraft({ ...draft, title })} onVisibility={(visibility) => setDraft({ ...draft, visibility })} onSave={saveDraft} onCancel={() => setDraft(null)} /> : null}
      </Sheet>

      {/* the list view: every visible pin as text, for people who cannot use the map */}
      <Sheet visible={listOpen} scrim bottomOffset={TAB_BAR_CLEARANCE - 8} onHeight={setSheetHeight} onClose={() => setListOpen(false)} accessibilityLabel="Pins on the map">
        <View style={styles.listHead}>
          <Text variant="subheading" accessibilityRole="header">
            On the map
          </Text>
          <IconButton label="Close list" onPress={() => setListOpen(false)}>
            <icons.X size={22} weight="bold" color={colors.foreground} />
          </IconButton>
        </View>
        <ScrollView style={{ maxHeight: 320 }}>
          {visiblePins.length === 0 ? (
            <Text variant="body" color="mutedForeground">
              No pins yet. Long-press the map to add one.
            </Text>
          ) : (
            <RowGroup>
              {visiblePins.map((p) => (
                <Row key={p.id} onPress={() => select(p)} accessibilityLabel={`${p.title}, ${pinKinds[p.kind].label}`}>
                  <Row.Body>
                    <Row.Title>{p.title}</Row.Title>
                    <Row.Detail>{pinKinds[p.kind].label}</Row.Detail>
                  </Row.Body>
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

function PinDetail({ pin, onClose, onOpen, onDelete, onToggleShare }: { pin: MapPin; onClose: () => void; onOpen: (href: string) => void; onDelete: () => void; onToggleShare: (v: PinVisibility) => void }) {
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
        <IconButton label="Close" onPress={onClose}>
          <icons.X size={22} weight="bold" color={colors.foreground} />
        </IconButton>
      </View>
      {pin.subtitle ? <Text variant="body">{pin.subtitle}</Text> : null}
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

function NewPinForm({ draft, onKind, onTitle, onVisibility, onSave, onCancel }: { draft: Draft; onKind: (k: PinKind) => void; onTitle: (t: string) => void; onVisibility: (v: PinVisibility) => void; onSave: () => void; onCancel: () => void }) {
  const choices = allowedVisibilities(draft.kind);
  const def = pinKinds[draft.kind];
  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 520 }} contentContainerStyle={styles.detail}>
      <Text variant="subheading" accessibilityRole="header">
        New pin
      </Text>
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
        <TextButton label="Cancel" size="lg" onPress={onCancel} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundPage },
  chips: { position: 'absolute', left: 0, right: 0 },
  chipRow: { gap: 8, paddingHorizontal: 16 },
  actions: { position: 'absolute', right: 16, gap: 10 },
  detail: { gap: 12 },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stack: { gap: 8, marginTop: 4 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
});

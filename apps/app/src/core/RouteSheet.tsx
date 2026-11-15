import * as React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, PrimaryButton, Text, TextButton, colors, icons, tr } from '@hub/ui';
import { formatDistance, formatDuration, plainTitle, type RouteMode, type RouteResult } from './directions';

export interface Trip {
  /** where to */
  name: string;
  mode: RouteMode;
  status: 'loading' | 'ready' | 'error' | 'nolocation';
  result?: RouteResult;
  error?: string;
}

const MODES: { id: RouteMode; label: string; Icon: React.ComponentType<any> }[] = [
  { id: 'foot', label: 'Walk', Icon: icons.PersonSimpleWalk },
  { id: 'bike', label: 'Bike', Icon: icons.PersonSimpleBike },
  { id: 'car', label: 'Car', Icon: icons.CarSimple },
];

/**
 * The details of a route, in the sheet at the bottom of the map: how long it takes, what it does about the danger and works
 * zones, the help (hospital, police, fire station) close to the way, and the steps on demand. Colour is only for meaning:
 * apricot for a warning, mint for help, the rest is ink.
 */
export function RouteSheet({ trip, onMode, onRetry, onLocation, onClose, maxHeight }: { trip: Trip; onMode: (m: RouteMode) => void; onRetry: () => void; onLocation: () => void; onClose: () => void; maxHeight: number }) {
  const [showSteps, setShowSteps] = React.useState(false);
  const r = trip.result;
  const scrollMax = Math.max(90, Math.min(maxHeight - 150, 170));
  return (
    <View style={styles.body}>
      <View style={styles.head}>
        <Text variant="subheading" accessibilityRole="header" numberOfLines={1} style={{ flex: 1 }}>
          {trip.name}
        </Text>
        <TextButton label="Close" size="md" onPress={onClose} />
      </View>

      <View style={styles.modes}>
        {MODES.map(({ id, label, Icon }) => (
          <Chip key={id} label={label} selected={trip.mode === id} onPress={() => onMode(id)} leading={<Icon size={20} weight="bold" color={trip.mode === id ? colors.inverseForeground : colors.foreground} />} />
        ))}
      </View>

      {trip.status === 'loading' ? (
        <View style={styles.line}>
          <ActivityIndicator color={colors.foreground} />
          <Text variant="body" color="mutedForeground">
            Finding the way…
          </Text>
        </View>
      ) : null}

      {trip.status === 'nolocation' ? (
        <View style={{ gap: 10 }}>
          <Text variant="body">Turn on location to get directions from where you are.</Text>
          <PrimaryButton label="Turn on location" size="lg" onPress={onLocation} />
        </View>
      ) : null}

      {trip.status === 'error' ? (
        <View style={{ gap: 10 }}>
          <Text variant="body">{tr(trip.error || 'Could not get directions.')}</Text>
          <PrimaryButton label="Try again" size="lg" onPress={onRetry} />
        </View>
      ) : null}

      {trip.status === 'ready' && r ? (
        <>
          <View style={styles.summary}>
            <Text variant="subheading" accessibilityLiveRegion="polite">
              {formatDuration(r.duration_s)}
            </Text>
            <Text variant="body" color="mutedForeground">
              {formatDistance(r.distance_m)}
            </Text>
          </View>
          <ScrollView style={{ maxHeight: scrollMax }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {r.avoided.map((a) => (
              <Note key={a.alert_id} tone="success" icon="shield">
                {tr(`Goes around ${plainTitle(a.title)}`)}
              </Note>
            ))}
            {r.warnings.map((w) => (
              <Note key={w.alert_id} tone="warning" icon="warning">
                {w.at_endpoint ? tr(`Your start or destination is inside ${plainTitle(w.title)}`) : w.type === 'danger' ? tr(`Passes through ${plainTitle(w.title)}, about ${formatDistance(w.meters_inside)}`) : tr(`Passes by works: ${plainTitle(w.title)}, about ${formatDistance(w.meters_inside)}`)}
              </Note>
            ))}
            {r.could_not_avoid ? (
              <Note tone="warning" icon="warning">
                {tr('There is no way round the danger zone. Take care.')}
              </Note>
            ) : null}
            {r.help_nearby.slice(0, showSteps ? 3 : 1).map((h) => (
              <Note key={h.id} tone="success" icon="check">
                {`${tr(h.label)}: ${h.name} · ${tr(`${formatDistance(h.meters_from_route)} from the route`)}`}
              </Note>
            ))}
            <TextButton label={showSteps ? 'Hide steps' : 'Show steps'} size="md" onPress={() => setShowSteps((v) => !v)} />
            {showSteps
              ? r.steps.map((s, i) => (
                  <View key={i} style={styles.step}>
                    <Text variant="body" style={{ flex: 1 }}>
                      {tr(s.instruction)}
                    </Text>
                    {s.distance_m > 0 ? (
                      <Text variant="rowDetail" color="mutedForeground">
                        {formatDistance(s.distance_m)}
                      </Text>
                    ) : null}
                  </View>
                ))
              : null}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

function Note({ tone, icon, children }: { tone: 'warning' | 'success'; icon: 'warning' | 'shield' | 'check'; children: React.ReactNode }) {
  const color = tone === 'warning' ? colors.warning : colors.success;
  const Icon = icon === 'warning' ? icons.WarningCircle : icon === 'shield' ? icons.ShieldCheck : icons.CheckCircle;
  return (
    <View style={styles.note}>
      <Icon size={20} weight="fill" color={color} />
      <Text variant="body" style={{ flex: 1 }} color={tone === 'warning' ? 'warning' : 'foreground'}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 10, paddingBottom: 2 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  modes: { flexDirection: 'row', gap: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  step: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
});

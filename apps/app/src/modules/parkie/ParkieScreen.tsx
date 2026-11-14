import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { mapHref } from '@hub/map';
import { Chip, Field, Row, RowGroup, Section, Text, colors, moduleArt } from '@hub/ui';
import { ModulePage } from '../../core/ModulePage';
import { currentLots, refreshLots, type Lot } from './manifest';

type Filter = 'all' | 'green' | 'yellow' | 'red';
const FILTERS: [Filter, string][] = [['all', 'All'], ['green', 'Available'], ['yellow', 'Busy'], ['red', 'Full']];
const STATE = { green: 'Available', yellow: 'Busy', red: 'Full' } as const;

/** Parking lots with live free-spot counts (read from each lot's camera), a filter, directions and the map. */
export function ParkieScreen() {
  const router = useRouter();
  const Art = moduleArt.parkie;
  const [lots, setLots] = useState<Lot[] | null>(currentLots().length ? currentLots() : null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let alive = true;
    const load = () => refreshLots().then((l) => alive && setLots(l));
    void load();
    const timer = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const shown = useMemo(
    () => (lots || []).filter((l) => (filter === 'all' || l.status_color === filter) && l.name.toLowerCase().includes(query.trim().toLowerCase())),
    [lots, filter, query],
  );
  const free = (lots || []).reduce((n, l) => n + l.available_spots, 0);
  const total = (lots || []).reduce((n, l) => n + l.capacity, 0);

  const directions = (l: Lot) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${l.latitude},${l.longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ModulePage title="Parking">
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 6 }}>
        {lots ? `${free} free spots in ${lots.length} lots, updated live.` : 'Free spots, counted from each lot’s camera.'}
      </Text>
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="Unirii, Iulius, Gara…" returnKeyType="search" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {FILTERS.map(([key, label]) => (
          <Chip key={key} label={label} selected={filter === key} onPress={() => setFilter(key)} />
        ))}
      </View>
      <Section title={`Lots${lots ? `, ${total ? Math.round((free / total) * 100) : 0}% free` : ''}`}>
        {lots === null ? (
          <ActivityIndicator color={colors.foreground} style={{ marginTop: 12 }} />
        ) : shown.length === 0 ? (
          <Text variant="body" color="mutedForeground">Nothing matches.</Text>
        ) : (
          <RowGroup>
            {shown.map((l) => (
              <Row key={l.id} onPress={() => router.push(mapHref({ pin: `parkie:${l.id}`, lat: l.latitude, lng: l.longitude, zoom: 17 }) as any)} accessibilityLabel={`${l.name}, ${l.available_spots} of ${l.capacity} free. Show on the map`}>
                <Row.Illustration>
                  <Art size={44} />
                </Row.Illustration>
                <Row.Body>
                  <Row.Title>{l.name}</Row.Title>
                  <Row.Detail>{`${l.available_spots} of ${l.capacity} free`}</Row.Detail>
                  <Text variant="label" color="info" onPress={() => directions(l)} style={{ marginTop: 4 }} accessibilityRole="link">
                    Directions
                  </Text>
                </Row.Body>
                <Row.Trailing>
                  <Text variant="label" color={l.status_color === 'green' ? 'success' : 'warning'}>
                    {STATE[l.status_color]}
                  </Text>
                </Row.Trailing>
              </Row>
            ))}
          </RowGroup>
        )}
      </Section>
    </ModulePage>
  );
}

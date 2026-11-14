import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Row, RowGroup, Text, colors } from '@hub/ui';
import { api } from '../../../src/core/api';
import { ModulePage } from '../../../src/core/ModulePage';

interface Lot {
  id: string;
  name: string;
  capacity: number;
  available_spots: number;
  status_color: 'green' | 'yellow' | 'red';
}

/** Live free spots in each monitored parking lot, counted from camera feeds. */
export default function ParkingRoute() {
  const [lots, setLots] = useState<Lot[] | null>(null);
  useEffect(() => {
    const load = () => api.get<Lot[]>('/v1/m/parkie/lots').then(setLots).catch(() => setLots((l) => l ?? []));
    void load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);
  const free = (lots ?? []).reduce((a, l) => a + l.available_spots, 0);

  return (
    <ModulePage title="Parking">
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 12 }}>
        {lots ? `${free} free spots in ${lots.length} lots, updated live.` : 'Loading…'}
      </Text>
      {lots === null ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <RowGroup>
          {[...lots]
            .sort((a, b) => b.available_spots - a.available_spots)
            .map((l) => (
              <Row key={l.id} accessibilityLabel={`${l.name}, ${l.available_spots} of ${l.capacity} free`}>
                <Row.Body>
                  <Row.Title>{l.name}</Row.Title>
                  <Row.Detail>{`${l.available_spots} of ${l.capacity} free`}</Row.Detail>
                </Row.Body>
                <Row.Trailing>
                  <View style={{ width: 120 }}>
                    <Row.Meter value={l.capacity ? l.available_spots / l.capacity : 0} label={`${Math.round((l.available_spots / Math.max(1, l.capacity)) * 100)} percent free`} />
                  </View>
                </Row.Trailing>
              </Row>
            ))}
        </RowGroup>
      )}
    </ModulePage>
  );
}

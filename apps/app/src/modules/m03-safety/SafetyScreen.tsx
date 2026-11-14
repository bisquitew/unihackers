import React, { useCallback, useEffect, useState } from 'react';
import { Row, RowGroup, Section, Text } from '@hub/ui';
import { ReportFlow } from '../../core/ReportFlow';
import { notifyMapLayersChanged } from '../../core/map-layers/changes';
import { NOTE_MAX, SAFETY_TYPES, fetchAreas, fetchCoreAreas, postReport, safetyType, type CoreArea, type SafetyAreaStats, type SafetyType } from './api';

/** Safety reports about places: poor lighting, noise at night, abandoned buildings, places where people do not feel safe. */
export function SafetyScreen() {
  const [areas, setAreas] = useState<CoreArea[]>([]);
  const [stats, setStats] = useState<SafetyAreaStats[]>([]);

  const load = useCallback(() => {
    fetchAreas(168, true).then((r) => setStats(r.areas)).catch(() => {});
  }, []);
  useEffect(() => {
    fetchCoreAreas().then(setAreas).catch(() => {});
    load();
  }, [load]);

  return (
    <ReportFlow
      title="Safety"
      intro="Tell us about problems with a place: light, noise, empty buildings, spots where you do not feel safe."
      art="safety"
      types={SAFETY_TYPES.map((t) => ({ id: t.id, label: t.label }))}
      withNote
      noteMax={NOTE_MAX}
      areas={areas.map((a) => ({ id: a.id, name: a.name }))}
      onSubmit={async (p) => {
        await postReport({ type: p.type as SafetyType, areaId: p.areaId, lat: p.lat, lng: p.lng, note: p.note });
        notifyMapLayersChanged();
        load();
      }}
    >
      <Section title="Reports by area, last 7 days">
        <RowGroup>
          {stats.slice(0, 8).map((a) => (
            <Row key={a.areaId}>
              <Row.Body>
                <Row.Title>{a.areaName}</Row.Title>
                <Row.Detail>{`${a.count} reports · mostly ${safetyType(a.dominantType).label.toLowerCase()}`}</Row.Detail>
              </Row.Body>
              <Row.Trailing>
                <Text variant="label">{`${Math.round((a.nightShare ?? 0) * 100)}% at night`}</Text>
              </Row.Trailing>
            </Row>
          ))}
          {stats.length === 0 ? (
            <Row>
              <Row.Body>
                <Row.Title>No reports in the last 7 days</Row.Title>
              </Row.Body>
            </Row>
          ) : null}
        </RowGroup>
        <Text variant="caption" color="mutedForeground" style={{ marginTop: 8 }}>
          Residents' reports about places, unverified. They are not police statistics.
        </Text>
      </Section>
    </ReportFlow>
  );
}

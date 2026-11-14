import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Row, RowGroup, Section, Text, TextButton, dateLocale, lang } from '@hub/ui';
import { ReportFlow } from '../../core/ReportFlow';
import { SMELL_TYPES, fetchAreas, fetchCoreAreas, fetchSourceHint, fetchWind, postReport, smellType, type CoreArea, type SmellAreaStats, type SmellType, type SourceHint, type Wind } from './api';
import { notifyMapLayersChanged } from '../../core/map-layers/changes';
import { refreshSmellPins } from './mapLayer';

/** Smell reports: one tap to report, and the city's picture underneath (wind, and where reports are coming from). */
export function SmellScreen() {
  const [areas, setAreas] = useState<CoreArea[]>([]);
  const [stats, setStats] = useState<SmellAreaStats[]>([]);
  const [wind, setWind] = useState<Wind | null>(null);
  const [hint, setHint] = useState<SourceHint | null>(null);

  const load = useCallback(() => {
    fetchAreas(24, true).then((r) => setStats(r.areas)).catch(() => {});
    fetchWind().then(setWind).catch(() => {});
    fetchSourceHint(6, true).then((r) => setHint(r.hint)).catch(() => {});
  }, []);
  useEffect(() => {
    fetchCoreAreas().then(setAreas).catch(() => {});
    load();
  }, [load]);

  return (
    <ReportFlow
      title="Smell reports"
      intro="One tap and you have reported it. The data helps the city find the source."
      art="smell"
      types={SMELL_TYPES.map((t) => ({ id: t.id, label: t.label }))}
      withIntensity
      areas={areas.map((a) => ({ id: a.id, name: a.name }))}
      onSubmit={async (p) => {
        await postReport({ type: p.type as SmellType, intensity: p.intensity ?? 3, areaId: p.areaId, lat: p.lat, lng: p.lng });
        void refreshSmellPins();
        notifyMapLayersChanged();
        load();
      }}
    >
      <Section title="Around the city">
        <RowGroup>
          {wind ? (
            <Row>
              <Row.Body>
                <Row.Title>Wind from {wind.from}</Row.Title>
                <Row.Detail>{`${Math.round(wind.speedKmh)} km/h · ${new Date(wind.observedAt).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })}${wind.source === 'mock' ? ' · sample' : ''}`}</Row.Detail>
              </Row.Body>
            </Row>
          ) : null}
          {hint ? (
            <Row>
              <Row.Body>
                <Row.Title>Where it may come from</Row.Title>
                <Row.Detail>{hint[lang] || hint.en}</Row.Detail>
              </Row.Body>
            </Row>
          ) : null}
          {stats.slice(0, 6).map((a) => (
            <Row key={a.areaId}>
              <Row.Body>
                <Row.Title>{a.areaName}</Row.Title>
                <Row.Detail>{`${a.count} reports · mostly ${smellType(a.dominantType).label.toLowerCase()}`}</Row.Detail>
              </Row.Body>
              <Row.Trailing>
                <Text variant="label">{`${a.avgIntensity.toFixed(1)} / 5`}</Text>
              </Row.Trailing>
            </Row>
          ))}
          {stats.length === 0 && !wind ? (
            <Row>
              <Row.Body>
                <Row.Title>No reports in the last 24 hours</Row.Title>
              </Row.Body>
            </Row>
          ) : null}
        </RowGroup>
        <View style={{ alignItems: 'flex-start' }}>
          <TextButton label="Refresh" size="md" onPress={load} />
        </View>
      </Section>
    </ReportFlow>
  );
}

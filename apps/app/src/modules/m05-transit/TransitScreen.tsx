import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Field, PrimaryButton, Row, RowGroup, Section, Text, colors, moduleArt } from '@hub/ui';
import { api } from '../../core/api';
import { ModulePage } from '../../core/ModulePage';

interface Line {
  id: string;
  line_number: string;
  name: string;
  status: string;
  current_route_summary?: string;
}
const words = (s = '') => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** City transit lines, which are on a detour, and a check for your own stop. */
export function TransitScreen() {
  const [lines, setLines] = useState<Line[] | null>(null);
  const [stop, setStop] = useState('');
  const [result, setResult] = useState<{ affected: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const Art = moduleArt.transit;

  useEffect(() => {
    api.get<Line[]>('/v1/m/transit/lines').then(setLines).catch(() => setLines([]));
  }, []);

  const check = async () => {
    if (!stop.trim()) return;
    setBusy(true);
    try {
      const r = await api.post<{ is_affected_by_detour: boolean; active_alerts: any[] }>('/v1/m/transit/check-stop', { stop_name: stop.trim() });
      setResult({ affected: r.is_affected_by_detour, text: r.is_affected_by_detour ? r.active_alerts.map((a) => a.title).join('\n') : 'Running as normal.' });
    } catch {
      setResult({ affected: false, text: 'Could not check right now. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModulePage title="Transit">
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 6 }}>
        Tram and bus lines, and the detours in force.
      </Text>
      <Section title="Is my stop affected?">
        <Field label="Stop" value={stop} onChangeText={setStop} placeholder="Calea Bogdăneștilor" returnKeyType="search" onSubmitEditing={check} />
        <View style={{ marginTop: 10 }}>
          <PrimaryButton label="Check" size="lg" loading={busy} disabled={!stop.trim()} onPress={check} />
        </View>
        {result ? (
          <Text variant="body" color={result.affected ? 'warning' : 'success'} style={{ marginTop: 12 }} accessibilityRole="alert">
            {result.affected ? 'On a detour. ' : 'All clear. '}
            {result.text}
          </Text>
        ) : null}
      </Section>
      <Section title="Lines">
        {lines === null ? (
          <ActivityIndicator color={colors.foreground} style={{ marginTop: 12 }} />
        ) : (
          <RowGroup>
            {lines.map((l) => (
              <Row key={l.id}>
                <Row.Illustration>
                  <Art size={44} />
                </Row.Illustration>
                <Row.Body>
                  <Row.Title>{`Line ${l.line_number}: ${l.name}`}</Row.Title>
                  <Row.Detail>{l.current_route_summary || 'Normal route'}</Row.Detail>
                </Row.Body>
                <Row.Trailing>
                  <Text variant="label" color={l.status === 'normal' ? 'success' : 'warning'}>
                    {words(l.status)}
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

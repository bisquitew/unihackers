import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Field, PrimaryButton, Row, RowGroup, Section, Text, moduleArt } from '@hub/ui';
import { api } from '../../core/api';
import { useAlerts } from '../../core/alerts';
import { ModulePage } from '../../core/ModulePage';

const words = (s = '') => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Heating, water and power outages (read-only for residents; staff publish them on the website), and a check for your own street. */
export function UtilitiesScreen() {
  const alerts = useAlerts();
  const outages = alerts.filter((a) => a.module === 'utilities');
  const Art = moduleArt.utilities;
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ affected: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    if (!address.trim()) return;
    setBusy(true);
    try {
      const r = await api.post<{ is_affected: boolean; active_outages: any[] }>('/v1/m/utilities/check-address', { address: address.trim() });
      setResult({ affected: r.is_affected, text: r.is_affected ? r.active_outages.map((o) => `${words(o.provider)}: ${o.title}`).join('\n') : 'No outage reported for this street.' });
    } catch {
      setResult({ affected: false, text: 'Could not check right now. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModulePage title="Outages and utilities">
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 6 }}>
        Heating, hot water, water and power works across the city.
      </Text>
      <Section title="Is my street affected?">
        <Field label="Street or neighbourhood" value={address} onChangeText={setAddress} placeholder="Strada Circumvalațiunii" returnKeyType="search" onSubmitEditing={check} />
        <View style={{ marginTop: 10 }}>
          <PrimaryButton label="Check" size="lg" loading={busy} disabled={!address.trim()} onPress={check} />
        </View>
        {result ? (
          <Text variant="body" color={result.affected ? 'warning' : 'success'} style={{ marginTop: 12 }} accessibilityRole="alert">
            {result.affected ? 'Affected. ' : 'All clear. '}
            {result.text}
          </Text>
        ) : null}
      </Section>
      <Section title="Active outages">
        <RowGroup>
          {outages.map((o) => (
            <Row key={o.id}>
              <Row.Illustration>
                <Art size={44} />
              </Row.Illustration>
              <Row.Body>
                <Row.Title>{o.title}</Row.Title>
                <Row.Detail>{o.detail}</Row.Detail>
              </Row.Body>
              <Row.Trailing>{o.trailing.kind === 'time' ? <Row.Time>{o.trailing.text}</Row.Time> : null}</Row.Trailing>
            </Row>
          ))}
          {outages.length === 0 ? (
            <Row>
              <Row.Body>
                <Row.Title>No active outages</Row.Title>
                <Row.Detail>Everything is running.</Row.Detail>
              </Row.Body>
            </Row>
          ) : null}
        </RowGroup>
      </Section>
    </ModulePage>
  );
}

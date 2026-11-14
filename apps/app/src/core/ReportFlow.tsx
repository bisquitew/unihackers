import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Field, PrimaryButton, SecondaryButton, Section, Segmented, Text, TextButton, colors, moduleArt, type ModuleArtId } from '@hub/ui';
import { ModulePage } from './ModulePage';
import { useMyLocation } from './location';

export interface ReportType {
  id: string;
  label: string;
}
export interface ReportPayload {
  type: string;
  intensity?: number;
  note?: string;
  areaId?: string;
  lat?: number;
  lng?: number;
}

interface Props {
  title: string;
  intro: string;
  art: ModuleArtId;
  types: ReportType[];
  withIntensity?: boolean;
  withNote?: boolean;
  noteMax?: number;
  areas: { id: string; name: string }[];
  onSubmit: (payload: ReportPayload) => Promise<void>;
  /** the live picture of the city under the form (wind, reports by area...) */
  children?: React.ReactNode;
}

/**
 * One quick report, the same for smell and safety: what did you notice, how strong (optional), where (an area, or your
 * location), a short note (optional). Sent once, then a thank-you with a way to send another.
 */
export function ReportFlow({ title, intro, art, types, withIntensity, withNote, noteMax = 200, areas, onSubmit, children }: Props) {
  const me = useMyLocation();
  const [type, setType] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const Art = moduleArt[art];

  const where = useLocation && me.location ? { lat: me.location.latitude, lng: me.location.longitude } : areaId ? { areaId } : null;
  const ready = !!type && !!where;

  const pickLocation = async () => {
    if (useLocation) {
      setUseLocation(false);
      return;
    }
    const fix = me.location ?? (await me.start());
    if (fix) {
      setUseLocation(true);
      setAreaId(null);
    } else setError(me.status === 'denied' ? 'Location is off. Pick an area instead, or turn it on in Settings.' : 'Could not find you. Pick an area instead.');
  };

  const send = async () => {
    if (!ready || !type) return;
    setSending(true);
    setError('');
    try {
      await onSubmit({ type, ...(withIntensity ? { intensity } : {}), ...(withNote && note.trim() ? { note: note.trim() } : {}), ...where });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const again = () => {
    setType(null);
    setIntensity(3);
    setAreaId(null);
    setUseLocation(false);
    setNote('');
    setDone(false);
  };

  return (
    <ModulePage title={title}>
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 6 }}>
        {intro}
      </Text>

      {done ? (
        <View style={styles.done}>
          <Art size={88} />
          <Text variant="heading" accessibilityRole="header" style={{ textAlign: 'center' }}>
            Thank you!
          </Text>
          <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
            Your report is on the map. The more neighbours report, the clearer the picture.
          </Text>
          <SecondaryButton label="Send another" size="lg" onPress={again} />
        </View>
      ) : (
        <>
          <Section title="What did you notice?">
            <View style={styles.wrap}>
              {types.map((t) => (
                <Chip key={t.id} label={t.label} selected={type === t.id} onPress={() => setType(t.id)} />
              ))}
            </View>
          </Section>

          {withIntensity ? (
            <Section title="How strong?">
              <Segmented accessibilityLabel="Strength from 1 to 5" value={String(intensity)} onChange={(v) => setIntensity(Number(v))} options={['1', '2', '3', '4', '5'].map((n) => ({ id: n, label: n }))} />
            </Section>
          ) : null}

          <Section title="Where?">
            <View style={styles.wrap}>
              <Chip label={useLocation ? 'Using your location' : 'Use my location'} selected={useLocation} onPress={pickLocation} />
            </View>
            <View style={[styles.wrap, { marginTop: 8 }]}>
              {areas.map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  selected={!useLocation && areaId === a.id}
                  onPress={() => {
                    setAreaId(a.id);
                    setUseLocation(false);
                  }}
                />
              ))}
            </View>
          </Section>

          {withNote ? (
            <View style={{ marginTop: 18 }}>
              <Field label="Note (optional)" value={note} onChangeText={setNote} multiline maxLength={noteMax} placeholder="Describe the place, not the people. No names or contact details." />
            </View>
          ) : null}

          {error ? (
            <Text variant="label" color="danger" accessibilityRole="alert" style={{ marginTop: 12 }}>
              {error}
            </Text>
          ) : null}
          <View style={{ marginTop: 18 }}>
            <PrimaryButton label="Send report" size="lg" loading={sending} disabled={!ready} onPress={send} />
            {!ready ? (
              <Text variant="rowDetail" color="mutedForeground" style={{ textAlign: 'center', marginTop: 8 }}>
                Choose what you noticed and where.
              </Text>
            ) : null}
          </View>
        </>
      )}

      {children}
    </ModulePage>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  done: { alignItems: 'center', gap: 12, paddingVertical: 28 },
});

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mapHref, pinRef } from '@hub/map';
import { AvatarStack, BackLink, PrimaryButton, Screen, Text, TextButton, Timeline } from '@hub/ui';
import { useAlerts } from '../../src/core/alerts';
import { api } from '../../src/core/api';

interface NearSafe { id: string; kind: 'hospital' | 'police' | 'fire'; name: string; street: string | null; distance_meters: number }
const SAFE_LABEL = { hospital: 'Hospital', police: 'Police station', fire: 'Fire station' } as const;

/** For danger and works zones: the closest place to get help (hospital, police or fire station), with its distance. */
function useNearestSafePlace(coordinate?: { latitude: number; longitude: number }): NearSafe | null {
  const [near, setNear] = React.useState<NearSafe | null>(null);
  const lat = coordinate?.latitude;
  const lng = coordinate?.longitude;
  React.useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    let alive = true;
    api.get<{ places: NearSafe[] }>('/v1/m/safety/places', { lat, lng, limit: 1 }).then((r) => alive && setNear(r.places?.[0] ?? null)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [lat, lng]);
  return near;
}

export default function AlertDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useAlerts().find((a) => a.id === String(id));
  const nearestSafe = useNearestSafePlace(alert?.zoneType ? alert.coordinate : undefined);

  // "tell me when it's back" and "this affects me too": what this person already did, and the buttons' work
  const alertId = String(id);
  const [following, setFollowing] = React.useState(false);
  const [affected, setAffected] = React.useState(false);
  const [count, setCount] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState<null | 'follow' | 'affects'>(null);
  const [problem, setProblem] = React.useState('');
  React.useEffect(() => {
    let alive = true;
    api
      .get<{ following: boolean; affected: boolean }>(`/v1/core/alerts/${encodeURIComponent(alertId)}/me`)
      .then((r) => {
        if (!alive) return;
        setFollowing(r.following);
        setAffected(r.affected);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [alertId]);
  const toggleFollow = async () => {
    if (busy) return;
    setBusy('follow');
    setProblem('');
    try {
      if (following) await api.del(`/v1/core/alerts/${encodeURIComponent(alertId)}/follow`);
      else await api.post(`/v1/core/alerts/${encodeURIComponent(alertId)}/follow`);
      setFollowing(!following);
    } catch {
      setProblem('Could not save that. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };
  const sayAffects = async () => {
    if (busy || affected) return;
    setBusy('affects');
    setProblem('');
    try {
      const r = await api.post<{ count: number }>(`/v1/core/alerts/${encodeURIComponent(alertId)}/affects`);
      setAffected(true);
      setCount(r.count);
    } catch {
      setProblem('Could not save that. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  if (!alert) {
    return (
      <Screen tabBar={false}>
        <BackLink label="Alerts" onPress={() => router.back()} />
        <Text variant="heading" accessibilityRole="header">
          Alert not found
        </Text>
        <Text variant="body" color="mutedForeground" style={{ marginTop: 8 }}>
          It may have been resolved. Go back to your alerts.
        </Text>
      </Screen>
    );
  }

  const isUtility = alert.module === 'utilities';
  return (
    <Screen
      tabBar={false}
      footer={
        <>
          {problem ? (
            <Text variant="rowDetail" color="danger" accessibilityRole="alert" style={{ textAlign: 'center' }}>
              {problem}
            </Text>
          ) : null}
          <PrimaryButton
            label={following ? (isUtility ? 'We will tell you when it’s back. Undo' : 'You will get updates. Undo') : isUtility ? 'Tell me when it’s back' : 'Tell me about updates'}
            size="lg"
            loading={busy === 'follow'}
            onPress={toggleFollow}
          />
          <TextButton label={affected ? 'Thanks, we counted you' : isUtility ? 'My building has it too' : 'This affects me too'} size="lg" disabled={affected} loading={busy === 'affects'} onPress={sayAffects} />
        </>
      }
    >
      <BackLink label="Alerts" onPress={() => router.back()} />
      {/* The answer is the headline. No repeated illustration: the row the user tapped already carried it. */}
      <Text variant="heading" accessibilityRole="header">
        {alert.headline}
      </Text>
      <Text variant="body" color="mutedForeground" style={styles.context}>
        {alert.context}
      </Text>
      <Timeline steps={alert.steps} />
      {nearestSafe ? (
        <View style={styles.safe}>
          <Text variant="label" color="mutedForeground">
            Nearest safe place
          </Text>
          <Text variant="rowTitle" onPress={() => router.push(mapHref({ pin: pinRef('safe', `safe-${nearestSafe.id}`) }) as any)} accessibilityRole="link">
            {nearestSafe.name}
          </Text>
          <Text variant="rowDetail" color="mutedForeground">
            {`${SAFE_LABEL[nearestSafe.kind]} · ${nearestSafe.distance_meters} m from here`}
          </Text>
        </View>
      ) : null}
      <View style={styles.mapLink}>
        <TextButton label="Show on map" size="md" onPress={() => router.push(mapHref({ pin: pinRef('alerts', alert.id) }) as any)} />
      </View>
      <View style={styles.confirm}>
        <AvatarStack
          label={`${count ?? alert.confirmedBy} neighbours confirmed this`}
          people={[{ initials: 'MA', tone: 'apricot' }, { initials: 'DR', tone: 'blue' }, { initials: 'IO', tone: 'mint' }]}
        />
        <Text variant="body" style={{ fontSize: 15, lineHeight: 20 }}>
          {count ?? alert.confirmedBy} neighbours confirmed this
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  context: { marginTop: 8, marginBottom: 18 },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  safe: { marginTop: 6, marginBottom: 14, gap: 2 },
  mapLink: { alignItems: 'flex-start', marginLeft: -20, marginBottom: 8 },
});

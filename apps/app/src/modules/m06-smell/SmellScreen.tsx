import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import {
  SMELL_TYPES,
  fetchAreas,
  fetchCoreAreas,
  fetchSourceHint,
  fetchTimeseries,
  fetchWind,
  postReport,
  smellType,
  type CoreArea,
  type HourBucket,
  type SmellAreaStats,
  type SmellType,
  type SourceHint,
  type Wind,
} from './api';

const INTENSITY_LABELS = ['', 'Slab', 'Ușor', 'Mediu', 'Puternic', 'Foarte puternic'];
const COMPASS_RO: Record<string, string> = { N: 'N', NE: 'NE', E: 'E', SE: 'SE', S: 'S', SW: 'SV', W: 'V', NW: 'NV' };

// navigator.geolocation exists in browsers; plain React Native has no global geolocation.
type Geo = { getCurrentPosition: (ok: (p: { coords: { latitude: number; longitude: number } }) => void, err: (e: { message: string }) => void, opts?: object) => void };
const geolocation: Geo | undefined = typeof navigator !== 'undefined' ? (navigator as unknown as { geolocation?: Geo }).geolocation : undefined;

type Status = 'idle' | 'sending' | 'done';

export function SmellScreen() {
  // Report form
  const [type, setType] = useState<SmellType | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [areas, setAreas] = useState<CoreArea[]>([]);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [formError, setFormError] = useState('');

  // City picture
  const [includeDemo, setIncludeDemo] = useState(true);
  const [wind, setWind] = useState<Wind | null>(null);
  const [hint, setHint] = useState<SourceHint | null>(null);
  const [areaStats, setAreaStats] = useState<SmellAreaStats[]>([]);
  const [buckets, setBuckets] = useState<HourBucket[]>([]);
  const [demoCount, setDemoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchCoreAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([fetchWind().catch(() => null), fetchSourceHint(6, includeDemo), fetchAreas(24, includeDemo), fetchTimeseries(24, includeDemo)])
      .then(([w, h, a, t]) => {
        setWind(w);
        setHint(h.hint);
        setAreaStats(a.areas);
        setBuckets(t.buckets);
        setDemoCount(Math.max(a.demoCount, t.demoCount));
      })
      .catch(() => setLoadError('Nu am putut încărca sesizările.'))
      .finally(() => setLoading(false));
  }, [includeDemo]);

  useEffect(load, [load]);

  const useMyLocation = () => {
    if (!geolocation) return;
    setLocating(true);
    setFormError('');
    geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) });
        setAreaId(null);
        setLocating(false);
      },
      () => {
        setFormError('Nu am putut afla locația. Alege zona din listă.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  };

  const canSend = type !== null && (areaId !== null || coords !== null) && status !== 'sending';

  const submit = async () => {
    if (!type) return setFormError('Alege ce miros simți.');
    if (!areaId && !coords) return setFormError('Alege zona sau folosește locația.');
    setStatus('sending');
    setFormError('');
    try {
      await postReport({ type, intensity, ...(coords ? { lat: coords.lat, lng: coords.lng } : { areaId: areaId! }) });
      setStatus('done');
      load();
    } catch (e) {
      setStatus('idle');
      setFormError(e instanceof Error ? e.message : 'Nu am putut trimite. Încearcă din nou.');
    }
  };

  const reset = () => {
    setType(null);
    setIntensity(3);
    setStatus('idle');
    setFormError('');
  };

  const showDemo = includeDemo && demoCount > 0;
  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {status === 'done' ? (
        <View style={styles.card}>
          <Text style={styles.thanksIcon}>💜</Text>
          <Text style={[styles.title, { textAlign: 'center' }]}>Mulțumim!</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Sesizarea ta apare pe hartă și în statisticile de mai jos. Cu cât raportează mai mulți vecini, cu atât se vede mai clar de unde vine mirosul.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={reset} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Trimite altă sesizare</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.title} accessibilityRole="header">Ce miros simți?</Text>
          <Text style={styles.subtitle}>O atingere și ai raportat. Datele ajută orașul să găsească sursa.</Text>

          <View style={styles.typeGrid}>
            {SMELL_TYPES.map((t) => {
              const selected = t.id === type;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeButton, selected && { borderColor: t.color, backgroundColor: '#27272a' }]}
                  onPress={() => setType(t.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t.label}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, selected && styles.typeLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Cât de puternic? {INTENSITY_LABELS[intensity]}</Text>
          <View style={styles.intensityRow} accessibilityRole="adjustable" accessibilityLabel={`Intensitate ${intensity} din 5`}>
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = n === intensity;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.intensityButton, n <= intensity && styles.intensityFilled, selected && styles.intensitySelected]}
                  onPress={() => setIntensity(n)}
                  accessibilityRole="button"
                  accessibilityLabel={`Intensitate ${n}`}
                  accessibilityState={{ selected }}
                >
                  <Text style={styles.intensityText}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Unde?</Text>
          {geolocation ? (
            <TouchableOpacity style={[styles.secondaryButton, coords && styles.secondaryButtonActive]} onPress={useMyLocation} accessibilityRole="button">
              {locating ? (
                <ActivityIndicator color="#c084fc" />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  {coords ? `📍 Locația ta (${coords.lat}, ${coords.lng})` : '📍 Folosește locația mea'}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
          <View style={styles.chips}>
            {areas.map((a) => {
              const selected = a.id === areaId;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.chip, selected && styles.chipActive]}
                  onPress={() => { setAreaId(a.id); setCoords(null); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>{a.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <TouchableOpacity
            style={[styles.primaryButton, !canSend && styles.disabled]}
            onPress={submit}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Trimite sesizarea"
          >
            {status === 'sending' ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Trimite sesizarea</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle} accessibilityRole="header">În oraș acum</Text>
        {showDemo ? (
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>date demo</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Include date demo</Text>
        <Switch
          value={includeDemo}
          onValueChange={setIncludeDemo}
          accessibilityLabel="Include date demo"
          trackColor={{ true: '#8d23be', false: '#3f3f46' }}
          thumbColor="#ffffff"
        />
      </View>
      {showDemo ? <Text style={styles.meta}>Statisticile includ {demoCount} sesizări demo (simulate pentru prezentare).</Text> : null}

      {loading && !areaStats.length ? <ActivityIndicator color="#a855f7" style={{ marginTop: 24 }} /> : null}
      {loadError ? (
        <View style={styles.card}>
          <Text style={styles.error}>{loadError}</Text>
          <TouchableOpacity onPress={load} accessibilityRole="button">
            <Text style={styles.link}>Încearcă din nou</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {wind ? (
        <View style={[styles.card, styles.windCard]}>
          <View style={styles.windArrowWrap} accessibilityLabel={`Vântul bate dinspre ${COMPASS_RO[wind.from] ?? wind.from}`}>
            {/* Arrow shows where the wind blows TO (meteorological direction + 180°). */}
            <Text style={[styles.windArrow, { transform: [{ rotate: `${(wind.directionDeg + 180) % 360}deg` }] }]}>↑</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              Vânt dinspre {COMPASS_RO[wind.from] ?? wind.from}, {Math.round(wind.speedKmh)} km/h
            </Text>
            <Text style={styles.meta}>{wind.source === 'open-meteo' ? 'Sursa: Open-Meteo' : 'Date de vânt simulate (Open-Meteo indisponibil)'}</Text>
          </View>
        </View>
      ) : null}

      {hint ? (
        <View style={[styles.card, styles.hintCard]}>
          <Text style={styles.cardTitle}>De unde ar putea veni?</Text>
          <Text style={styles.cardText}>{hint.ro}</Text>
        </View>
      ) : !loading ? (
        <Text style={styles.meta}>Prea puține sesizări în ultimele 6 ore pentru un indiciu despre sursă.</Text>
      ) : null}

      {areaStats.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Zone (ultimele 24 h)</Text>
          {areaStats.map((a) => {
            const t = smellType(a.dominantType);
            return (
              <View key={a.areaId} style={styles.areaRow} accessibilityLabel={`${a.areaName}: ${a.count} sesizări, intensitate medie ${a.avgIntensity}, mai ales ${t.label}`}>
                <View style={styles.areaHead}>
                  <Text style={styles.areaName}>{t.icon} {a.areaName}</Text>
                  <Text style={styles.areaCount}>{a.count}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(a.avgIntensity / 5) * 100}%`, backgroundColor: t.color }]} />
                </View>
                <Text style={styles.meta}>medie {a.avgIntensity}/5 · mai ales {t.label.toLowerCase()}</Text>
              </View>
            );
          })}
        </View>
      ) : !loading ? (
        <Text style={styles.meta}>Nicio sesizare în ultimele 24 de ore.</Text>
      ) : null}

      {buckets.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sesizări pe oră (24 h)</Text>
          <View style={styles.chart} accessibilityLabel={`Grafic: ${buckets.reduce((s, b) => s + b.total, 0)} sesizări în 24 de ore`}>
            {buckets.map((b) => (
              <View key={b.hour} style={styles.chartCol}>
                <View style={[styles.chartBar, { height: `${(b.total / maxBucket) * 100}%` }, b.total === 0 && styles.chartBarEmpty]} />
              </View>
            ))}
          </View>
          <View style={styles.chartAxis}>
            {buckets.map((b, i) => (
              <Text key={b.hour} style={styles.axisLabel}>
                {i % 6 === 0 ? `${String(new Date(b.hour).getHours()).padStart(2, '0')}` : ''}
              </Text>
            ))}
          </View>
          <Text style={styles.meta}>Maxim {maxBucket} sesizări într-o oră.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 16, paddingBottom: 48 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  label: { color: '#e4e4e7', fontSize: 15, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeButton: {
    width: '31%',
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  typeIcon: { fontSize: 30 },
  typeLabel: { color: '#d4d4d8', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  typeLabelActive: { color: '#ffffff' },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', backgroundColor: '#18181b', alignItems: 'center', justifyContent: 'center' },
  intensityFilled: { backgroundColor: '#3b0764', borderColor: '#6b21a8' },
  intensitySelected: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  intensityText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderColor: '#27272a', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#18181b' },
  chipActive: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  chipText: { color: '#d4d4d8', fontSize: 13 },
  chipTextActive: { color: '#ffffff', fontWeight: '600' },
  error: { color: '#f87171', marginTop: 12 },
  primaryButton: { backgroundColor: '#8d23be', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { borderColor: '#a855f7', borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonActive: { backgroundColor: '#2e1065' },
  secondaryButtonText: { color: '#c084fc', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  thanksIcon: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 32, marginBottom: 8 },
  sectionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  demoBadge: { backgroundColor: '#422006', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 10 },
  demoBadgeText: { color: '#fbbf24', fontSize: 12, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleLabel: { color: '#e4e4e7', fontSize: 15 },
  card: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 12 },
  cardTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardText: { color: '#e4e4e7', fontSize: 14, lineHeight: 21 },
  windCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  windArrowWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' },
  windArrow: { color: '#38bdf8', fontSize: 30, fontWeight: '700' },
  hintCard: { borderColor: '#6b21a8' },
  areaRow: { marginTop: 10 },
  areaHead: { flexDirection: 'row', justifyContent: 'space-between' },
  areaName: { color: '#e4e4e7', fontSize: 14, fontWeight: '600' },
  areaCount: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#27272a', marginVertical: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 2, marginTop: 8 },
  chartCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartBar: { backgroundColor: '#a855f7', borderTopLeftRadius: 2, borderTopRightRadius: 2, minHeight: 2 },
  chartBarEmpty: { backgroundColor: '#27272a' },
  chartAxis: { flexDirection: 'row', gap: 2, marginTop: 4 },
  axisLabel: { flex: 1, color: '#71717a', fontSize: 10, overflow: 'visible' },
  meta: { color: '#71717a', fontSize: 12, lineHeight: 18, marginTop: 4 },
  link: { color: '#c084fc', marginTop: 8 },
});

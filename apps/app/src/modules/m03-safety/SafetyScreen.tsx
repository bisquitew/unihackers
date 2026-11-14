import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  NOTE_MAX,
  SAFETY_TYPES,
  fetchAreas,
  fetchCoreAreas,
  fetchSummary,
  postReport,
  safetyType,
  type AreaSummary,
  type CoreArea,
  type SafetyAreaStats,
  type SafetyType,
} from './api';
import { refreshSafetyPins } from './mapLayer';

// navigator.geolocation exists in browsers; plain React Native has no global geolocation.
type Geo = { getCurrentPosition: (ok: (p: { coords: { latitude: number; longitude: number } }) => void, err: (e: { message: string }) => void, opts?: object) => void };
const geolocation: Geo | undefined = typeof navigator !== 'undefined' ? (navigator as unknown as { geolocation?: Geo }).geolocation : undefined;

type Status = 'idle' | 'sending' | 'done';

export function SafetyScreen() {
  // Report form
  const [type, setType] = useState<SafetyType | null>(null);
  const [areas, setAreas] = useState<CoreArea[]>([]);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [formError, setFormError] = useState('');
  const [noteRedacted, setNoteRedacted] = useState(false);

  // Overview
  const [includeDemo, setIncludeDemo] = useState(true);
  const [areaStats, setAreaStats] = useState<SafetyAreaStats[]>([]);
  const [demoCount, setDemoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Summary for one area
  const [selected, setSelected] = useState<string | null>(null);
  const [lang, setLang] = useState<'ro' | 'en'>('ro');
  const [summary, setSummary] = useState<AreaSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    fetchCoreAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetchAreas(168, includeDemo)
      .then((r) => {
        setAreaStats(r.areas);
        setDemoCount(r.demoCount);
        setSelected((cur) => (cur && r.areas.some((a) => a.areaId === cur) ? cur : r.areas[0]?.areaId ?? null));
      })
      .catch(() => setLoadError('Nu am putut încărca sesizările.'))
      .finally(() => setLoading(false));
  }, [includeDemo]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!selected) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError('');
    fetchSummary(selected, lang, 168, includeDemo)
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch((e) => { if (!cancelled) { setSummary(null); setSummaryError(e instanceof Error ? e.message : 'Rezumatul nu este disponibil acum.'); } })
      .finally(() => { if (!cancelled) setSummaryLoading(false); });
    return () => { cancelled = true; };
  }, [selected, lang, includeDemo]);

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
    if (!type) return setFormError('Alege ce ai observat.');
    if (!areaId && !coords) return setFormError('Alege zona sau folosește locația.');
    setStatus('sending');
    setFormError('');
    try {
      const trimmed = note.trim();
      const res = await postReport({ type, ...(trimmed ? { note: trimmed } : {}), ...(coords ? { lat: coords.lat, lng: coords.lng } : { areaId: areaId! }) });
      setNoteRedacted(res.noteRedacted);
      setStatus('done');
      load();
      void refreshSafetyPins(); // the new report shows on the shared map
    } catch (e) {
      setStatus('idle');
      setFormError(e instanceof Error ? e.message : 'Nu am putut trimite. Încearcă din nou.');
    }
  };

  const reset = () => {
    setType(null);
    setNote('');
    setNoteRedacted(false);
    setStatus('idle');
    setFormError('');
  };

  const showDemo = includeDemo && demoCount > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {status === 'done' ? (
        <View style={styles.card}>
          <Text style={styles.thanksIcon}>💜</Text>
          <Text style={[styles.title, { textAlign: 'center' }]}>Mulțumim!</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>Sesizarea ta apare pe hartă și în lista de mai jos.</Text>
          {noteRedacted ? <Text style={[styles.meta, { textAlign: 'center' }]}>Am scos datele de contact din notă.</Text> : null}
          <TouchableOpacity style={styles.primaryButton} onPress={reset} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Trimite altă sesizare</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.title} accessibilityRole="header">Ce ai observat?</Text>
          <Text style={styles.subtitle}>Semnalează probleme ale locului: lumină, zgomot, clădiri părăsite, locuri unde nu te simți în siguranță.</Text>

          <View style={styles.typeGrid}>
            {SAFETY_TYPES.map((t) => {
              const sel = t.id === type;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeButton, sel && { borderColor: t.color, backgroundColor: '#27272a' }]}
                  onPress={() => setType(t.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={t.label}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, sel && styles.typeLabelActive]}>{t.label}</Text>
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
                <Text style={styles.secondaryButtonText}>{coords ? `📍 Locația ta (${coords.lat}, ${coords.lng})` : '📍 Folosește locația mea'}</Text>
              )}
            </TouchableOpacity>
          ) : null}
          <View style={styles.chips}>
            {areas.map((a) => {
              const sel = a.id === areaId;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.chip, sel && styles.chipActive]}
                  onPress={() => { setAreaId(a.id); setCoords(null); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                >
                  <Text style={[styles.chipText, sel && styles.chipTextActive]}>{a.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Notă (opțional)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="ex. „Felinarele de pe trotuar nu merg.”"
            placeholderTextColor="#71717a"
            multiline
            maxLength={NOTE_MAX}
            textAlignVertical="top"
            accessibilityLabel="Notă despre loc"
          />
          <View style={styles.noteFoot}>
            <Text style={[styles.meta, { flex: 1 }]}>
              Descrie locul, nu oamenii: fără nume, descrieri de persoane sau acuzații. Datele de contact (telefon, e-mail, linkuri, numere de mașină) sunt șterse automat.
            </Text>
            <Text style={styles.meta}>{note.length}/{NOTE_MAX}</Text>
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
        <Text style={styles.sectionTitle} accessibilityRole="header">Zone (ultimele 7 zile)</Text>
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
      <Text style={styles.meta}>
        Sesizări ale locuitorilor despre locuri, neverificate; nu sunt statistici ale poliției.{showDemo ? ` Includ ${demoCount} sesizări demo (simulate pentru prezentare).` : ''}
      </Text>

      {selected ? (
        <View style={[styles.card, styles.summaryCard]}>
          <View style={styles.summaryHead}>
            <Text style={[styles.cardTitle, { flex: 1 }]}>Rezumat: {areaStats.find((a) => a.areaId === selected)?.areaName ?? ''}</Text>
            <View style={styles.langToggle}>
              {(['ro', 'en'] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.langItem, lang === l && styles.langItemActive]}
                  onPress={() => setLang(l)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: lang === l }}
                  accessibilityLabel={l === 'ro' ? 'Rezumat în română' : 'Summary in English'}
                >
                  <Text style={[styles.langText, lang === l && styles.langTextActive]}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {summaryLoading ? (
            <ActivityIndicator color="#a855f7" style={{ marginVertical: 8 }} />
          ) : summaryError ? (
            <Text style={styles.error}>{summaryError}</Text>
          ) : summary ? (
            <>
              <Text style={styles.cardText}>{summary.text}</Text>
              <Text style={styles.meta}>{summary.source === 'gemini' ? 'Scris de Gemini doar din numărul de sesizări' : 'Rezumat simplu (fără AI)'}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {loading && !areaStats.length ? <ActivityIndicator color="#a855f7" style={{ marginTop: 24 }} /> : null}
      {loadError ? (
        <View style={styles.card}>
          <Text style={styles.error}>{loadError}</Text>
          <TouchableOpacity onPress={load} accessibilityRole="button">
            <Text style={styles.link}>Încearcă din nou</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {areaStats.length ? (
        <View style={styles.card}>
          {areaStats.map((a) => {
            const sel = a.areaId === selected;
            const types = SAFETY_TYPES.filter((t) => a.byType[t.id] > 0);
            return (
              <TouchableOpacity
                key={a.areaId}
                style={[styles.areaRow, sel && styles.areaRowActive]}
                onPress={() => setSelected(a.areaId)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${a.areaName}: ${a.count} sesizări, mai ales ${safetyType(a.dominantType).label}`}
              >
                <View style={styles.areaHead}>
                  <Text style={styles.areaName}>{a.areaName}</Text>
                  <Text style={styles.areaCount}>{a.count}</Text>
                </View>
                <Text style={styles.meta}>
                  {types.map((t) => `${t.icon} ${a.byType[t.id]}`).join('   ')}
                  {'   ·   '}
                  {Math.round(a.nightShare * 100)}% noaptea
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : !loading ? (
        <Text style={styles.meta}>Nicio sesizare în ultimele 7 zile.</Text>
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
    paddingHorizontal: 4,
    gap: 6,
  },
  typeIcon: { fontSize: 28 },
  typeLabel: { color: '#d4d4d8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  typeLabelActive: { color: '#ffffff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderColor: '#27272a', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#18181b' },
  chipActive: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  chipText: { color: '#d4d4d8', fontSize: 13 },
  chipTextActive: { color: '#ffffff', fontWeight: '600' },
  input: { minHeight: 80, backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 12, padding: 12, color: '#ffffff', fontSize: 15 },
  noteFoot: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
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
  summaryCard: { borderColor: '#6b21a8' },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardText: { color: '#e4e4e7', fontSize: 14, lineHeight: 21 },
  langToggle: { flexDirection: 'row', borderColor: '#27272a', borderWidth: 1, borderRadius: 999, overflow: 'hidden' },
  langItem: { paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#18181b' },
  langItemActive: { backgroundColor: '#8d23be' },
  langText: { color: '#d4d4d8', fontSize: 12, fontWeight: '600' },
  langTextActive: { color: '#ffffff' },
  areaRow: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
  areaRowActive: { backgroundColor: '#27272a' },
  areaHead: { flexDirection: 'row', justifyContent: 'space-between' },
  areaName: { color: '#e4e4e7', fontSize: 15, fontWeight: '600' },
  areaCount: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  meta: { color: '#71717a', fontSize: 12, lineHeight: 18, marginTop: 4 },
  link: { color: '#c084fc', marginTop: 8 },
});

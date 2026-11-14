// Photo of a utility notice → Gemini draft → review → publish as an outage (m04).
// Anyone can read a notice; publishing follows the API's rule for outages: an admin with MFA.
// Web only for now (file picker / phone camera through the browser); the native app would need expo-image-picker.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../config';

type Provider = 'colterm' | 'aquatim' | 'retele_electrice_banat' | 'delgaz_grid';
type OutageType = 'heating_and_hot_water' | 'hot_water_only' | 'cold_water' | 'electricity' | 'gas';
type Status = 'scheduled_maintenance' | 'unplanned_breakdown';

interface Draft {
  provider: Provider | null;
  type: OutageType | null;
  status: Status;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_areas: string[];
  affected_streets: string[];
  start_time: string | null;
  estimated_restore_time: string | null;
}

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'aquatim', label: 'Aquatim (apă)' },
  { id: 'colterm', label: 'Colterm (căldură)' },
  { id: 'retele_electrice_banat', label: 'Rețele Electrice (curent)' },
  { id: 'delgaz_grid', label: 'Delgaz (gaz)' },
];
const TYPES: { id: OutageType; label: string }[] = [
  { id: 'cold_water', label: 'Apă rece' },
  { id: 'hot_water_only', label: 'Apă caldă' },
  { id: 'heating_and_hot_water', label: 'Căldură + apă caldă' },
  { id: 'electricity', label: 'Curent' },
  { id: 'gas', label: 'Gaz' },
];
const STATUSES: { id: Status; label: string }[] = [
  { id: 'scheduled_maintenance', label: 'Lucrare programată' },
  { id: 'unplanned_breakdown', label: 'Avarie' },
];

// The API's demo admin login (P2's Auth0 dev tokens): admin role with MFA verified. Only sent in operator mode.
const DEMO_OPERATOR_TOKEN = 'dev_admin';

const tz = 'Europe/Bucharest';
/** ISO → "YYYY-MM-DD HH:mm" in the city's local time. */
function isoToLocal(iso: string | null): string {
  if (!iso) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
/** "YYYY-MM-DD HH:mm" (the city's local time) → ISO, '' for empty, null if invalid. */
function localToIso(local: string): string | null | '' {
  const v = local.trim();
  if (!v) return '';
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(v)) return null;
  const naive = new Date(`${v.replace(' ', 'T')}:00Z`);
  const name = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(naive).find((x) => x.type === 'timeZoneName')?.value ?? 'GMT+02:00';
  const d = new Date(`${v.replace(' ', 'T')}:00${name.replace('GMT', '') || '+00:00'}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** apiBaseUrl: the server that also serves the Utilities screen, so a published alert shows up there. */
export function NoticeScanScreen({ apiBaseUrl = API_URL }: { apiBaseUrl?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [notNotice, setNotNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [streetsText, setStreetsText] = useState('');
  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');
  const [operator, setOperator] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ id: string; title: string } | null>(null);
  const web = Platform.OS === 'web' && typeof document !== 'undefined';

  useEffect(() => {
    fetch(`${API_URL}/v1/core/areas`)
      .then((r) => r.json())
      .then((list: { name: string }[]) => setAreas(list.map((a) => a.name)))
      .catch(() => setAreas([]));
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setNotNotice(null);
    setDraft(null);
    setPublished(null);
    setPreview(URL.createObjectURL(file));
    setReading(true);
    try {
      const form = new FormData();
      form.append('image', file, file.name || 'notice.jpg');
      const res = await fetch(`${apiBaseUrl}/v1/m/assistant/notice/parse`, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      if (!data.isNotice) {
        setNotNotice(data.reason || 'Nu pare a fi un anunț de întrerupere.');
        return;
      }
      const d = data.draft as Draft;
      setDraft(d);
      setWarnings(data.warnings ?? []);
      setStreetsText(d.affected_streets.join('\n'));
      setStartText(isoToLocal(d.start_time));
      setEndText(isoToLocal(d.estimated_restore_time));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nu am putut citi poza.');
    } finally {
      setReading(false);
    }
  };

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const toggleArea = (name: string) =>
    update({ affected_areas: draft!.affected_areas.includes(name) ? draft!.affected_areas.filter((a) => a !== name) : [...draft!.affected_areas, name] });

  const publish = async () => {
    if (!draft) return;
    const start = localToIso(startText);
    const end = localToIso(endText);
    if (start === null || end === null) return setError('Folosește formatul AAAA-LL-ZZ OO:MM pentru ore (ora locală).');
    if (!draft.provider || !draft.type) return setError('Alege furnizorul și tipul întreruperii.');
    if (draft.affected_areas.length === 0) return setError('Alege cel puțin un cartier.');
    setPublishing(true);
    setError('');
    try {
      const body = {
        ...draft,
        affected_streets: streetsText.split('\n').map((s) => s.trim()).filter(Boolean),
        start_time: start || undefined,
        estimated_restore_time: end || undefined,
      };
      const res = await fetch(`${apiBaseUrl}/v1/m/assistant/notice/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(operator ? { Authorization: `Bearer ${DEMO_OPERATOR_TOKEN}` } : {}) },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error_description || data.error || `Request failed (${res.status})`);
      setPublished({ id: data.outage.id, title: data.outage.title });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nu am putut publica alerta.');
    } finally {
      setPublishing(false);
    }
  };

  const chip = (selected: boolean, label: string, onPress: () => void, key: string) => (
    <TouchableOpacity key={key} style={[styles.chip, selected && styles.chipActive]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">Scanează un anunț</Text>
      <Text style={styles.subtitle}>
        Fă o poză unui anunț de oprire a apei, căldurii, curentului sau gazului. Gemini citește anunțul și pregătește alerta; tu verifici înainte de publicare.
      </Text>

      {web ? (
        <>
          {React.createElement('input', {
            ref: fileInput,
            type: 'file',
            accept: 'image/*',
            capture: 'environment',
            style: { display: 'none' },
            'aria-label': 'Alege poza anunțului',
            onChange: (e: { target: HTMLInputElement }) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            },
          })}
          <TouchableOpacity style={styles.primaryButton} onPress={() => fileInput.current?.click()} accessibilityRole="button" accessibilityLabel="Fă sau alege o poză">
            <Text style={styles.primaryButtonText}>📷 Fă sau alege o poză</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.meta}>Deocamdată scanarea funcționează în browser (pe telefon, deschide aplicația web).</Text>
      )}

      {preview ? <Image source={{ uri: preview }} style={styles.preview} resizeMode="contain" accessibilityLabel="Poza anunțului" /> : null}
      {reading ? (
        <View style={styles.readingRow}>
          <ActivityIndicator color="#a855f7" />
          <Text style={styles.meta}>Gemini citește anunțul…</Text>
        </View>
      ) : null}
      {notNotice ? <Text style={styles.warning}>{notNotice}</Text> : null}

      {published ? (
        <View style={[styles.card, styles.successCard]}>
          <Text style={styles.cardTitle}>✅ Alerta a fost publicată</Text>
          <Text style={styles.cardText}>{published.title}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/m/utilities' as never)} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Vezi în Avarii & Utilități</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {draft && !published ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ciornă — verifică înainte de publicare</Text>
          {warnings.map((w) => (
            <Text key={w} style={styles.warning}>⚠ {w}</Text>
          ))}

          <Text style={styles.label}>Titlu</Text>
          <TextInput style={styles.input} value={draft.title} onChangeText={(title) => update({ title })} accessibilityLabel="Titlu" />
          <Text style={styles.label}>Descriere</Text>
          <TextInput style={[styles.input, styles.multiline]} value={draft.description} onChangeText={(description) => update({ description })} multiline accessibilityLabel="Descriere" />

          <Text style={styles.label}>Furnizor</Text>
          <View style={styles.chips}>{PROVIDERS.map((p) => chip(draft.provider === p.id, p.label, () => update({ provider: p.id }), p.id))}</View>
          <Text style={styles.label}>Ce se oprește</Text>
          <View style={styles.chips}>{TYPES.map((t) => chip(draft.type === t.id, t.label, () => update({ type: t.id }), t.id))}</View>
          <View style={styles.chips}>{STATUSES.map((s) => chip(draft.status === s.id, s.label, () => update({ status: s.id }), s.id))}</View>

          <Text style={styles.label}>Cartiere</Text>
          <View style={styles.chips}>
            {[...new Set([...draft.affected_areas, ...areas])].map((a) => chip(draft.affected_areas.includes(a), a, () => toggleArea(a), a))}
          </View>
          <Text style={styles.label}>Străzi (una pe rând)</Text>
          <TextInput style={[styles.input, styles.multiline]} value={streetsText} onChangeText={setStreetsText} multiline accessibilityLabel="Străzi" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Început (ora TM)</Text>
              <TextInput style={styles.input} value={startText} onChangeText={setStartText} placeholder="2026-11-18 08:00" placeholderTextColor="#71717a" accessibilityLabel="Început" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Reluare estimată</Text>
              <TextInput style={styles.input} value={endText} onChangeText={setEndText} placeholder="2026-11-18 16:00" placeholderTextColor="#71717a" accessibilityLabel="Reluare estimată" />
            </View>
          </View>

          <View style={styles.operatorRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Mod operator (demo)</Text>
              <Text style={styles.meta}>Publicarea unei alerte pentru tot orașul cere un cont de administrator cu autentificare în doi pași. În demo, comutatorul folosește contul de test al administratorului.</Text>
            </View>
            <Switch value={operator} onValueChange={setOperator} accessibilityLabel="Mod operator (demo)" trackColor={{ true: '#8d23be', false: '#3f3f46' }} thumbColor="#ffffff" />
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, (!operator || publishing) && styles.disabled]}
            onPress={publish}
            disabled={!operator || publishing}
            accessibilityRole="button"
            accessibilityLabel="Publică alerta"
          >
            {publishing ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Publică alerta</Text>}
          </TouchableOpacity>
          {!operator ? <Text style={styles.meta}>Doar operatorii pot publica. Fără mod operator, ciorna rămâne doar pe ecranul tău.</Text> : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 16, paddingBottom: 48 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  preview: { width: '100%', height: 260, marginTop: 12, borderRadius: 12, backgroundColor: '#18181b' },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  card: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 16 },
  successCard: { borderColor: '#16a34a' },
  cardTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  cardText: { color: '#e4e4e7', fontSize: 15, lineHeight: 21 },
  label: { color: '#e4e4e7', fontSize: 14, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#09090b', borderColor: '#27272a', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderColor: '#27272a', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#09090b' },
  chipActive: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  chipText: { color: '#d4d4d8', fontSize: 13 },
  chipTextActive: { color: '#ffffff', fontWeight: '600' },
  operatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  toggleLabel: { color: '#e4e4e7', fontSize: 15, fontWeight: '600' },
  primaryButton: { backgroundColor: '#8d23be', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { borderColor: '#a855f7', borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#c084fc', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  warning: { color: '#fbbf24', fontSize: 13, lineHeight: 19, marginTop: 6 },
  error: { color: '#f87171', marginTop: 12 },
  meta: { color: '#71717a', fontSize: 12, lineHeight: 18, marginTop: 4 },
});

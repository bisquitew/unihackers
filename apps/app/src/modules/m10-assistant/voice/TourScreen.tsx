// Narrated walking tour: stops from docs/voice/tour.md (served by GET /v1/m/assistant/tour),
// each read aloud through the assistant's voice. Content is written by hand; this screen only plays it.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../config';
import { ListenButton } from './ListenButton';
import { speak, stopSpeaking, voiceAvailable, webPlaybackSupported, type VoiceLang } from './voiceClient';

interface TourStop {
  id: string;
  title: { ro: string; en: string };
  coordinate: { lat: number; lng: number };
  text: { ro: string; en: string };
}

export function TourScreen() {
  const [stops, setStops] = useState<TourStop[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<VoiceLang>('ro');
  const [voice, setVoice] = useState(false);
  const [playingAll, setPlayingAll] = useState<number | null>(null);
  const stopAll = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/v1/m/assistant/tour`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((t: { stops: TourStop[]; warnings: string[] }) => {
        setStops(t.stops);
        setWarnings(t.warnings);
      })
      .catch(() => setError('Nu am putut încărca turul.'))
      .finally(() => setLoading(false));
    if (webPlaybackSupported()) voiceAvailable().then(setVoice);
    return () => {
      stopAll.current = true;
      stopSpeaking();
    };
  }, []);

  const playAll = async () => {
    if (playingAll !== null) {
      stopAll.current = true;
      stopSpeaking();
      setPlayingAll(null);
      return;
    }
    stopAll.current = false;
    for (let i = 0; i < stops.length && !stopAll.current; i++) {
      setPlayingAll(i);
      try {
        await speak(`${stops[i].title[lang]}. ${stops[i].text[lang]}`, lang);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Vocea nu este disponibilă acum.');
        break;
      }
    }
    setPlayingAll(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">{lang === 'ro' ? 'Tur ghidat cu voce' : 'Narrated walking tour'}</Text>
          <Text style={styles.subtitle}>{lang === 'ro' ? 'Ascultă povestea fiecărei opriri.' : 'Listen to the story of each stop.'}</Text>
        </View>
        <View style={styles.toggle}>
          {(['ro', 'en'] as const).map((l) => (
            <TouchableOpacity key={l} style={[styles.toggleItem, lang === l && styles.toggleActive]} onPress={() => setLang(l)} accessibilityRole="button" accessibilityState={{ selected: lang === l }} accessibilityLabel={l === 'ro' ? 'Română' : 'English'}>
              <Text style={[styles.toggleText, lang === l && styles.toggleTextActive]}>{l.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {voice && stops.length > 1 ? (
        <TouchableOpacity style={styles.primaryButton} onPress={playAll} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>{playingAll !== null ? `⏹ Stop (oprirea ${playingAll + 1}/${stops.length})` : lang === 'ro' ? '▶ Ascultă tot turul' : '▶ Play the whole tour'}</Text>
        </TouchableOpacity>
      ) : null}
      {!voice && !loading ? <Text style={styles.meta}>{lang === 'ro' ? 'Vocea funcționează deocamdată în browser. Poți citi textul mai jos.' : 'Voice works in the browser for now. You can read the text below.'}</Text> : null}

      {loading ? <ActivityIndicator color="#a855f7" style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && stops.length === 0 ? <Text style={styles.meta}>Turul nu are încă opriri (docs/voice/tour.md).</Text> : null}

      {stops.map((s, i) => (
        <View key={s.id} style={[styles.card, playingAll === i && styles.cardActive]}>
          <Text style={styles.stopNumber}>{lang === 'ro' ? `Oprirea ${i + 1}` : `Stop ${i + 1}`}</Text>
          <Text style={styles.cardTitle}>{s.title[lang]}</Text>
          <Text style={styles.cardText}>{s.text[lang]}</Text>
          <ListenButton text={`${s.title[lang]}. ${s.text[lang]}`} lang={lang} label={lang === 'ro' ? 'Ascultă' : 'Listen'} />
        </View>
      ))}
      {warnings.length ? <Text style={styles.meta}>Opriri ignorate în tour.md: {warnings.join('; ')}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 16, paddingBottom: 48 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a1a1aa', fontSize: 14, lineHeight: 20 },
  toggle: { flexDirection: 'row', borderColor: '#27272a', borderWidth: 1, borderRadius: 999, overflow: 'hidden' },
  toggleItem: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#18181b' },
  toggleActive: { backgroundColor: '#8d23be' },
  toggleText: { color: '#d4d4d8', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#ffffff' },
  primaryButton: { backgroundColor: '#8d23be', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 12 },
  cardActive: { borderColor: '#a855f7' },
  stopNumber: { color: '#c084fc', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  cardText: { color: '#e4e4e7', fontSize: 15, lineHeight: 22 },
  meta: { color: '#71717a', fontSize: 12, lineHeight: 18, marginTop: 8 },
  error: { color: '#f87171', marginTop: 12 },
});

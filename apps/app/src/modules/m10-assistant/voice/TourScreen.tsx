// Narrated walking tour: stops from docs/voice/tour.md (served by GET /v1/m/assistant/tour),
// each read aloud through the assistant's voice. Content is written by hand; this screen only plays it.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PrimaryButton, Row, RowGroup, Segmented, Text, colors } from '@hub/ui';
import { ModulePage } from '../../../core/ModulePage';
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
  const ro = lang === 'ro';

  useEffect(() => {
    fetch(`${API_URL}/v1/m/assistant/tour`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((t: { stops: TourStop[]; warnings: string[] }) => {
        setStops(t.stops);
        setWarnings(t.warnings);
      })
      .catch(() => setError('Could not load the tour.'))
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
        setError(e instanceof Error ? e.message : 'Voice is not available right now.');
        break;
      }
    }
    setPlayingAll(null);
  };

  return (
    <ModulePage title={ro ? 'Tur ghidat cu voce' : 'Narrated walking tour'}>
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 12 }}>
        {ro ? 'Ascultă povestea fiecărei opriri.' : 'Listen to the story of each stop.'}
      </Text>
      <Segmented
        accessibilityLabel="Tour language"
        value={lang}
        onChange={setLang}
        options={[
          { id: 'ro', label: 'Română' },
          { id: 'en', label: 'English' },
        ]}
      />

      {voice && stops.length > 1 ? (
        <View style={{ marginTop: 14 }}>
          <PrimaryButton label={playingAll !== null ? `Stop (stop ${playingAll + 1} of ${stops.length})` : ro ? 'Ascultă tot turul' : 'Play the whole tour'} size="lg" onPress={playAll} />
        </View>
      ) : null}
      {!voice && !loading ? (
        <Text variant="rowDetail" color="mutedForeground" style={{ marginTop: 12 }}>
          {ro ? 'Vocea funcționează deocamdată în browser. Poți citi textul mai jos.' : 'Voice works in the browser for now. You can read the text below.'}
        </Text>
      ) : null}

      {loading ? <ActivityIndicator color={colors.foreground} style={{ marginTop: 24 }} /> : null}
      {error ? (
        <Text variant="body" color="danger" accessibilityRole="alert" style={{ marginTop: 12 }}>
          {error}
        </Text>
      ) : null}
      {!loading && !error && stops.length === 0 ? (
        <Text variant="rowDetail" color="mutedForeground" style={{ marginTop: 12 }}>
          The tour has no stops yet (docs/voice/tour.md).
        </Text>
      ) : null}

      {stops.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <RowGroup>
            {stops.map((s, i) => (
              <Row key={s.id}>
                <Row.Body>
                  <Text variant="label" color={playingAll === i ? 'success' : 'info'}>
                    {ro ? `Oprirea ${i + 1}` : `Stop ${i + 1}`}
                    {playingAll === i ? (ro ? ' · se citește' : ' · playing') : ''}
                  </Text>
                  <Text variant="section" style={{ marginTop: 2 }}>
                    {s.title[lang]}
                  </Text>
                  <Text variant="body" style={{ marginTop: 4 }}>
                    {s.text[lang]}
                  </Text>
                  <ListenButton text={`${s.title[lang]}. ${s.text[lang]}`} lang={lang} label={ro ? 'Ascultă' : 'Listen'} />
                </Row.Body>
              </Row>
            ))}
          </RowGroup>
        </View>
      ) : null}
      {warnings.length ? (
        <Text variant="caption" color="mutedForeground" style={{ marginTop: 12 }}>
          Stops skipped in tour.md: {warnings.join('; ')}
        </Text>
      ) : null}
    </ModulePage>
  );
}

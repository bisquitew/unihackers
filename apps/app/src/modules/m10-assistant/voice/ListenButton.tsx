// "Listen" button that reads a text aloud through the assistant's voice (ElevenLabs via our API).
// Renders nothing where voice cannot play (phone for now) or when the server has no voice configured,
// so it can be dropped into any card without changing the screen's behaviour.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { guessLang, speak, stopSpeaking, voiceAvailable, webPlaybackSupported, type VoiceLang } from './voiceClient';

type State = 'idle' | 'loading' | 'playing' | 'error';

interface Props {
  text: string;
  lang?: VoiceLang;
  label?: string;
  compact?: boolean;
}

export function ListenButton({ text, lang, label = 'Ascultă', compact = false }: Props) {
  const [available, setAvailable] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!webPlaybackSupported()) return;
    let alive = true;
    voiceAvailable().then((ok) => alive && setAvailable(ok));
    return () => {
      alive = false;
    };
  }, []);

  if (!available) return null;

  const onPress = async () => {
    if (state === 'playing' || state === 'loading') {
      stopSpeaking();
      setState('idle');
      return;
    }
    setError('');
    setState('loading');
    try {
      await speak(text, lang ?? guessLang(text), () => setState('playing'));
      setState('idle');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Vocea nu este disponibilă acum.');
    }
  };

  const icon = state === 'playing' ? '⏹' : '🔊';
  const text2 = state === 'playing' ? 'Stop' : label;
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.button, compact && styles.compact]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={state === 'playing' ? 'Oprește citirea' : `${label} cu voce`}
      >
        {state === 'loading' ? <ActivityIndicator size="small" color="#c084fc" /> : <Text style={styles.icon}>{icon}</Text>}
        {compact ? null : <Text style={styles.label}>{text2}</Text>}
      </TouchableOpacity>
      {state === 'error' && error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', marginTop: 8 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 6, borderColor: '#3f3f46', borderWidth: 1, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, minHeight: 30 },
  compact: { paddingHorizontal: 8 },
  icon: { fontSize: 14 },
  label: { color: '#c084fc', fontSize: 13, fontWeight: '600' },
  error: { color: '#f87171', fontSize: 12, marginTop: 4, maxWidth: 260 },
});

// "Listen" button that reads a text aloud through the assistant's voice (ElevenLabs via our API).
// Renders nothing where voice cannot play (phone for now) or when the server has no voice configured,
// so it can be dropped into any card without changing the screen's behaviour.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text, colors, icons } from '@hub/ui';
import { guessLang, speak, stopSpeaking, voiceAvailable, webPlaybackSupported, type VoiceLang } from './voiceClient';

type State = 'idle' | 'loading' | 'playing' | 'error';

interface Props {
  text: string;
  lang?: VoiceLang;
  label?: string;
  compact?: boolean;
}

export function ListenButton({ text, lang, label = 'Listen', compact = false }: Props) {
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
      setError(e instanceof Error ? e.message : 'Voice is not available right now.');
    }
  };

  const playing = state === 'playing';
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Stop reading aloud' : `${label} aloud`}
        style={({ pressed }) => [styles.button, compact && styles.compact, pressed && { backgroundColor: colors.secondaryPressed }]}
      >
        {state === 'loading' ? <ActivityIndicator size="small" color={colors.foreground} /> : playing ? <icons.Stop size={16} weight="fill" color={colors.foreground} /> : <icons.SpeakerHigh size={16} weight="bold" color={colors.foreground} />}
        {compact ? null : (
          <Text variant="label" style={{ fontSize: 13 }}>
            {playing ? 'Stop' : label}
          </Text>
        )}
      </Pressable>
      {state === 'error' && error ? (
        <Text variant="caption" color="danger" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', marginTop: 8 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, minHeight: 36, backgroundColor: colors.secondary },
  compact: { paddingHorizontal: 10 },
  error: { marginTop: 4, maxWidth: 260 },
});

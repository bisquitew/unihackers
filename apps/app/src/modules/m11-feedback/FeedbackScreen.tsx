import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { registeredModuleManifests } from '../index';
import { fetchChangelog, submitFeedback } from './api';
import { FALLBACK_APP_VERSION, SURVEY_URL } from './config';

type Status = 'idle' | 'sending' | 'done' | 'error';

interface Props {
  onOpenChangelog?: () => void;
}

const GENERAL = { id: null as string | null, title: 'Aplicația în general' };

export function FeedbackScreen({ onOpenChangelog }: Props) {
  const [rating, setRating] = useState(0);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [appVersion, setAppVersion] = useState(FALLBACK_APP_VERSION);

  // The current version is the newest changelog entry, so feedback is grouped per version.
  useEffect(() => {
    fetchChangelog()
      .then((list) => { if (list.length) setAppVersion(list[list.length - 1].version); })
      .catch(() => { /* keep fallback */ });
  }, []);

  const moduleOptions = useMemo(
    () => [
      GENERAL,
      ...registeredModuleManifests
        .filter((m) => m.status !== 'draft' && m.id !== 'm11-feedback')
        .map((m) => ({ id: m.id as string | null, title: m.title })),
    ],
    [],
  );

  const submit = async () => {
    if (rating === 0) {
      setError('Alege un număr de stele.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await submitFeedback({ rating, moduleId, text: text.trim(), appVersion });
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Nu am putut trimite. Încearcă din nou.');
    }
  };

  const reset = () => {
    setRating(0);
    setModuleId(null);
    setText('');
    setStatus('idle');
    setError('');
  };

  const surveyButton = (
    <TouchableOpacity
      style={[styles.secondaryButton, !SURVEY_URL && styles.disabled]}
      disabled={!SURVEY_URL}
      onPress={() => Linking.openURL(SURVEY_URL)}
      accessibilityRole="link"
    >
      <Text style={styles.secondaryButtonText}>
        {SURVEY_URL ? 'Completează sondajul (2 min)' : 'Sondajul apare în curând'}
      </Text>
    </TouchableOpacity>
  );

  const changelogButton = onOpenChangelog ? (
    <TouchableOpacity style={styles.linkButton} onPress={onOpenChangelog} accessibilityRole="link">
      <Text style={styles.linkText}>Ce am schimbat datorită vouă →</Text>
    </TouchableOpacity>
  ) : null;

  if (status === 'done') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.thanksIcon}>💜</Text>
          <Text style={styles.title}>Mulțumim!</Text>
          <Text style={styles.subtitle}>
            Citim fiecare mesaj. Ce schimbăm datorită ție apare în lista de schimbări.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={reset}>
            <Text style={styles.primaryButtonText}>Trimite altă părere</Text>
          </TouchableOpacity>
          {surveyButton}
          {changelogButton}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Spune-ne ce crezi</Text>
      <Text style={styles.subtitle}>Construim aplicația în timpul hackathonului, pe baza părerilor voastre.</Text>

      <Text style={styles.label}>Cât de bună e aplicația?</Text>
      <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating: ${rating} din 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)} accessibilityLabel={`${n} stele`} hitSlop={6}>
            <Text style={[styles.star, n <= rating && styles.starActive]}>{n <= rating ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Despre ce parte?</Text>
      <View style={styles.chips}>
        {moduleOptions.map((m) => {
          const selected = m.id === moduleId;
          return (
            <TouchableOpacity
              key={m.id ?? 'general'}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => setModuleId(m.id)}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{m.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Ce ți-a plăcut, ce nu a mers, ce lipsește?</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Scrie aici (opțional)"
        placeholderTextColor="#71717a"
        multiline
        maxLength={2000}
        textAlignVertical="top"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, status === 'sending' && styles.disabled]}
        onPress={submit}
        disabled={status === 'sending'}
      >
        {status === 'sending' ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Trimite</Text>
        )}
      </TouchableOpacity>

      {surveyButton}
      {changelogButton}
      <Text style={styles.version}>Versiunea aplicației: {appVersion}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 16, paddingBottom: 48 },
  card: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'stretch' },
  thanksIcon: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  label: { color: '#e4e4e7', fontSize: 15, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 36, color: '#71717a' },
  starActive: { color: '#f59e0b' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderColor: '#27272a', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#18181b' },
  chipActive: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  chipText: { color: '#d4d4d8', fontSize: 13 },
  chipTextActive: { color: '#ffffff', fontWeight: '600' },
  input: { minHeight: 110, backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 12, padding: 12, color: '#ffffff', fontSize: 15 },
  error: { color: '#f87171', marginTop: 12 },
  primaryButton: { backgroundColor: '#8d23be', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { borderColor: '#a855f7', borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#c084fc', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  linkButton: { paddingVertical: 12, alignItems: 'center' },
  linkText: { color: '#c084fc', fontSize: 14 },
  version: { color: '#71717a', fontSize: 12, textAlign: 'center', marginTop: 8 },
});

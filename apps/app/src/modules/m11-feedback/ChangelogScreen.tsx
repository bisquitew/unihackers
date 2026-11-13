import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChangelogEntry, fetchChangelog } from './api';

export function ChangelogScreen() {
  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    setEntries(null);
    fetchChangelog()
      .then((list) => setEntries([...list].reverse())) // newest first
      .catch((e) => setError(e instanceof Error ? e.message : 'Nu am putut încărca lista.'));
  }, []);

  useEffect(load, [load]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ce am schimbat datorită vouă</Text>
      <Text style={styles.subtitle}>Fiecare versiune construită în timpul hackathonului și părerile care au dus la ea.</Text>

      {error ? (
        <View style={styles.card}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Încearcă din nou</Text>
          </TouchableOpacity>
        </View>
      ) : entries === null ? (
        <ActivityIndicator color="#c084fc" style={{ marginTop: 24 }} />
      ) : (
        entries.map((e) => (
          <View key={e.version} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.version}>{e.version}</Text>
              <Text style={styles.hour}>Ora {e.hour}</Text>
            </View>
            <Text style={styles.changed}>{e.changed}</Text>
            {e.becauseOf.length > 0 ? (
              <View style={styles.because}>
                <Text style={styles.becauseLabel}>Datorită:</Text>
                {e.becauseOf.map((b) => (
                  <Text key={b.ref} style={styles.becauseItem}>
                    <Text style={styles.ref}>{b.ref}</Text> · {b.summary}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 16, paddingBottom: 48 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  card: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  version: { color: '#c084fc', fontSize: 16, fontWeight: '700' },
  hour: { color: '#71717a', fontSize: 13 },
  changed: { color: '#e4e4e7', fontSize: 15, lineHeight: 21 },
  because: { marginTop: 10, borderTopColor: '#27272a', borderTopWidth: 1, paddingTop: 10 },
  becauseLabel: { color: '#a1a1aa', fontSize: 13, marginBottom: 4 },
  becauseItem: { color: '#d4d4d8', fontSize: 14, lineHeight: 20 },
  ref: { color: '#c084fc', fontWeight: '600' },
  error: { color: '#f87171' },
  retry: { marginTop: 10 },
  retryText: { color: '#c084fc', fontWeight: '600' },
});

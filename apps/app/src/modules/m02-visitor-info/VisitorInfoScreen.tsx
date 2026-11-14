import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchCategories, fetchEntries, type VisitorCategory, type VisitorInfoEntry, type VisitorLang } from './api';

const UI: Record<VisitorLang, Record<string, string>> = {
  ro: {
    title: 'Informații practice',
    subtitle: 'Ce e bine să știi când ajungi în Timișoara.',
    all: 'Toate',
    verify: 'Verifică înainte de drum',
    source: 'Sursa',
    checked: 'Verificat',
    empty: 'Nu am găsit informații în această categorie.',
    error: 'Nu am putut încărca informațiile.',
    retry: 'Încearcă din nou',
    langLabel: 'Limba',
  },
  en: {
    title: 'Practical info',
    subtitle: 'Good to know when you arrive in Timișoara.',
    all: 'All',
    verify: 'Check before you travel',
    source: 'Source',
    checked: 'Checked',
    empty: 'No information in this category.',
    error: 'Could not load the information.',
    retry: 'Try again',
    langLabel: 'Language',
  },
};

const isUrl = (s: string) => /^https?:\/\//i.test(s);
const hostOf = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];

export function VisitorInfoScreen() {
  const [lang, setLang] = useState<VisitorLang>('ro');
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<VisitorCategory[]>([]);
  const [entries, setEntries] = useState<VisitorInfoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const t = UI[lang];

  useEffect(() => {
    fetchCategories()
      .then((list) => setCategories(list.filter((c) => c.count > 0)))
      .catch(() => { /* chips are optional; the list still loads */ });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchEntries(lang, category)
      .then(setEntries)
      .catch(() => setError(UI[lang].error))
      .finally(() => setLoading(false));
  }, [lang, category]);

  useEffect(load, [load]);

  const chips = [{ id: null as string | null, label: t.all }, ...categories.map((c) => ({ id: c.id as string | null, label: c.label[lang] }))];
  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.label[lang] ?? id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>
        <View style={styles.toggle} accessibilityLabel={t.langLabel}>
          {(['ro', 'en'] as const).map((l) => {
            const selected = l === lang;
            return (
              <TouchableOpacity
                key={l}
                style={[styles.toggleItem, selected && styles.toggleItemActive]}
                onPress={() => setLang(l)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={l === 'ro' ? 'Română' : 'English'}
              >
                <Text style={[styles.toggleText, selected && styles.toggleTextActive]}>{l.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.chips}>
        {chips.map((c) => {
          const selected = c.id === category;
          return (
            <TouchableOpacity
              key={c.id ?? 'all'}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => setCategory(c.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color="#a855f7" style={{ marginTop: 32 }} />
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load} accessibilityRole="button">
            <Text style={styles.retryText}>{t.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <Text style={styles.subtitle}>{t.empty}</Text>
      ) : (
        entries.map((e) => (
          <View key={e.id} style={styles.card}>
            <Text style={styles.category}>{categoryLabel(e.category)}</Text>
            <Text style={styles.cardTitle}>{e.title}</Text>
            {e.verify ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⚠ {t.verify}</Text>
              </View>
            ) : null}
            <Text style={styles.cardText}>{e.text}</Text>
            <View style={styles.sourceRow}>
              <Text style={styles.meta}>{t.source}: </Text>
              {e.sources.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 ? <Text style={styles.meta}>, </Text> : null}
                  {isUrl(s) ? (
                    <Text style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL(s)}>
                      {hostOf(s)}
                    </Text>
                  ) : (
                    <Text style={styles.meta}>{s}</Text>
                  )}
                </React.Fragment>
              ))}
            </View>
            <Text style={styles.meta}>
              {t.checked}: {e.checked}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 16, paddingBottom: 48 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  toggle: { flexDirection: 'row', borderColor: '#27272a', borderWidth: 1, borderRadius: 999, overflow: 'hidden' },
  toggleItem: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#18181b' },
  toggleItemActive: { backgroundColor: '#8d23be' },
  toggleText: { color: '#d4d4d8', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#ffffff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderColor: '#27272a', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#18181b' },
  chipActive: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  chipText: { color: '#d4d4d8', fontSize: 13 },
  chipTextActive: { color: '#ffffff', fontWeight: '600' },
  card: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  category: { color: '#c084fc', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cardTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#422006', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10, marginBottom: 8 },
  badgeText: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
  cardText: { color: '#e4e4e7', fontSize: 15, lineHeight: 22 },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  meta: { color: '#71717a', fontSize: 12, lineHeight: 18 },
  link: { color: '#c084fc', fontSize: 12, lineHeight: 18, textDecorationLine: 'underline' },
  error: { color: '#f87171', fontSize: 14 },
  retry: { marginTop: 12, alignSelf: 'flex-start', borderColor: '#a855f7', borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 },
  retryText: { color: '#c084fc', fontWeight: '600' },
});

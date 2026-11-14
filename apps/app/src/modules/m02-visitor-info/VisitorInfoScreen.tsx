import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Row, RowGroup, Text, TextButton, colors, lang } from '@hub/ui';
import { ModulePage } from '../../core/ModulePage';
import { fetchCategories, fetchEntries, type VisitorCategory, type VisitorInfoEntry } from './api';

const isUrl = (s: string) => /^https?:\/\//i.test(s);
const hostOf = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];

/** Practical information for people arriving in the city, in the app's language. */
export function VisitorInfoScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<VisitorCategory[]>([]);
  const [entries, setEntries] = useState<VisitorInfoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCategories().then((list) => setCategories(list.filter((c) => c.count > 0))).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchEntries(lang, category)
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [category]);
  useEffect(load, [load]);

  return (
    <ModulePage title="Practical info">
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 10 }}>
        Good to know when you arrive in the city.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip key={c.id} label={c.label[lang] ?? c.label.en} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.foreground} style={{ marginTop: 24 }} />
      ) : error ? (
        <View style={{ marginTop: 16, alignItems: 'flex-start' }}>
          <Text variant="body" color="danger" accessibilityRole="alert">
            Could not load the information.
          </Text>
          <TextButton label="Try again" size="md" onPress={load} />
        </View>
      ) : entries.length === 0 ? (
        <Text variant="body" color="mutedForeground" style={{ marginTop: 20 }}>
          No information in this category.
        </Text>
      ) : (
        <RowGroup>
          {entries.map((e) => (
            <Row key={e.id}>
              <Row.Body>
                <Row.Title>{e.title}</Row.Title>
                <Text variant="body" style={{ marginTop: 4 }}>
                  {e.text}
                </Text>
                {e.verify ? (
                  <Text variant="label" color="warning" style={{ marginTop: 6 }}>
                    Check before you travel
                  </Text>
                ) : null}
                {e.sources.length ? (
                  <Text variant="caption" color="mutedForeground" style={{ marginTop: 6 }}>
                    {'Source: '}
                    {e.sources.map((s, i) =>
                      isUrl(s) ? (
                        <Text key={i} variant="caption" color="info" onPress={() => Linking.openURL(s)}>
                          {hostOf(s)}
                          {i < e.sources.length - 1 ? ', ' : ''}
                        </Text>
                      ) : (
                        <Text key={i} variant="caption" color="mutedForeground">
                          {s}
                          {i < e.sources.length - 1 ? ', ' : ''}
                        </Text>
                      ),
                    )}
                  </Text>
                ) : null}
              </Row.Body>
            </Row>
          ))}
        </RowGroup>
      )}
    </ModulePage>
  );
}

const styles = StyleSheet.create({
  chips: { marginHorizontal: -16, flexGrow: 0, marginBottom: 6 },
});

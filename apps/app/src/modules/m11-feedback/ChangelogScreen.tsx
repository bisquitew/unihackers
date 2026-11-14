import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Row, RowGroup, Text, TextButton, colors } from '@hub/ui';
import { ModulePage } from '../../core/ModulePage';
import { ChangelogEntry, fetchChangelog } from './api';

export function ChangelogScreen() {
  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    setEntries(null);
    fetchChangelog()
      .then((list) => setEntries([...list].reverse())) // newest first
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the list.'));
  }, []);

  useEffect(load, [load]);

  return (
    <ModulePage title="What we changed">
      <Text variant="body" color="mutedForeground" style={{ marginBottom: 12 }}>
        Every version built during the hackathon, and the feedback that led to it.
      </Text>

      {error ? (
        <View style={{ gap: 8, alignItems: 'flex-start' }}>
          <Text variant="body" color="danger" accessibilityRole="alert">
            {error}
          </Text>
          <TextButton label="Try again" size="md" onPress={load} />
        </View>
      ) : entries === null ? (
        <ActivityIndicator color={colors.foreground} style={{ marginTop: 24 }} />
      ) : (
        <RowGroup>
          {entries.map((e) => (
            <Row key={e.version}>
              <Row.Body>
                <Text variant="label" color="info">
                  {e.version} · hour {e.hour}
                </Text>
                <Text variant="body" style={{ marginTop: 2 }}>
                  {e.changed}
                </Text>
                {e.becauseOf.length > 0 ? (
                  <View style={{ marginTop: 8, gap: 2 }}>
                    <Text variant="caption" color="mutedForeground">
                      Because you told us
                    </Text>
                    {e.becauseOf.map((b) => (
                      <Text key={b.ref} variant="rowDetail" color="mutedForeground">
                        {b.ref} · {b.summary}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </Row.Body>
            </Row>
          ))}
        </RowGroup>
      )}
    </ModulePage>
  );
}

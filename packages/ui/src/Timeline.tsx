import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, palette } from './tokens';
import { Text } from './Text';

export type TimelineStep = { state: 'done' | 'now' | 'next'; title: string; note?: string };

/** A short vertical status list (reported, in progress, expected). State is also spoken, never colour alone. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View accessibilityRole="list">
      {steps.map((s, i) => (
        <View key={i} style={styles.item} accessible accessibilityLabel={`${s.title}${s.note ? ', ' + s.note : ''}, ${s.state === 'done' ? 'done' : s.state === 'now' ? 'in progress' : 'upcoming'}`}>
          <View style={styles.rail}>
            <View style={[styles.dot, s.state === 'done' && styles.done, s.state === 'now' && styles.now, s.state === 'next' && styles.next]} />
            {i < steps.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.text}>
            <Text variant="body" style={{ fontSize: 15, lineHeight: 20 }}>
              {s.title}
            </Text>
            {s.note ? (
              <Text variant="rowDetail" color="mutedForeground" style={{ fontSize: 13, lineHeight: 18 }}>
                {s.note}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, minHeight: 52 },
  rail: { width: 14, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 10, marginTop: 5 },
  done: { backgroundColor: palette.mint500 },
  now: { backgroundColor: palette.apricot500, boxShadow: '0 0 0 4px rgba(255, 122, 47, 0.18)' } as any,
  next: { backgroundColor: colors.hairline, borderWidth: 2, borderColor: 'rgba(26, 16, 51, 0.25)' },
  line: { flex: 1, width: 2, marginTop: 4, marginBottom: -2, backgroundColor: colors.hairline },
  text: { flex: 1, paddingBottom: 14 },
});

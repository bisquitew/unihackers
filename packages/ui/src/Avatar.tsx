import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from './tokens';
import { Text } from './Text';

export type AvatarTone = 'apricot' | 'blue' | 'mint' | 'ink';

const tones: Record<AvatarTone, { bg: string; fg: string }> = {
  apricot: { bg: palette.apricot500, fg: palette.ink900 },
  blue: { bg: palette.blue500, fg: palette.white },
  mint: { bg: palette.mint500, fg: palette.ink900 },
  ink: { bg: palette.ink900, fg: palette.white },
};

export function Avatar({ initials, tone = 'apricot', size = 32 }: { initials: string; tone?: AvatarTone; size?: number }) {
  const t = tones[tone];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size, backgroundColor: t.bg }]}>
      <Text variant="caption" style={{ color: t.fg, fontFamily: 'Figtree_700Bold', fontSize: 12, lineHeight: 12 }}>
        {initials}
      </Text>
    </View>
  );
}

export type Person = { initials: string; tone?: AvatarTone };

/** Overlapping avatars. `extra` adds a "+N" chip. */
export function AvatarStack({ people, extra, label }: { people: Person[]; extra?: number; label?: string }) {
  return (
    <View style={styles.stack} accessible accessibilityLabel={label}>
      {people.map((p, i) => (
        <View key={i} style={[styles.ring, i > 0 && styles.overlap]}>
          <Avatar initials={p.initials} tone={p.tone ?? (['apricot', 'blue', 'mint'] as AvatarTone[])[i % 3]} />
        </View>
      ))}
      {extra ? (
        <View style={[styles.ring, styles.overlap]}>
          <Avatar initials={`+${extra}`} tone="ink" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  stack: { flexDirection: 'row', alignItems: 'center' },
  ring: { padding: 2, borderRadius: 40, backgroundColor: palette.white },
  overlap: { marginLeft: -9 },
});

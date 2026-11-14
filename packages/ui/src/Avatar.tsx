import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, palette } from './tokens';
import { Text } from './Text';

export type AvatarTone = 'apricot' | 'blue' | 'mint' | 'ink';

// read per render (not once at load) so the ink avatar follows the theme
const toneColors = (tone: AvatarTone): { bg: string; fg: string } => {
  switch (tone) {
    case 'blue':
      return { bg: palette.blue500, fg: palette.white };
    case 'mint':
      return { bg: palette.mint500, fg: palette.ink900 };
    case 'ink':
      return { bg: colors.inverse, fg: colors.inverseForeground };
    default:
      return { bg: palette.apricot500, fg: palette.ink900 };
  }
};

export function Avatar({ initials, tone = 'apricot', size = 32 }: { initials: string; tone?: AvatarTone; size?: number }) {
  const t = toneColors(tone);
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

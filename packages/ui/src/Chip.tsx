import * as React from 'react';
import {  StyleSheet, View } from 'react-native';
import { SpringPressable } from './SpringPressable';
import { colors, minTarget, radii, shadows } from './tokens';
import { isDark } from './theme';
import { Text } from './Text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** optional small leading element, e.g. an illustration */
  leading?: React.ReactNode;
  /**
   * `solid` (default): selected = solid ink, for choices in forms and sheets.
   * `glass`: a frosted white pill that floats over a map. Selected is shown by a small hue dot and full opacity,
   * unselected is dimmed with no dot, so several chips can be on at once without a row of dark pills.
   */
  tone?: 'solid' | 'glass';
  /** the hue dot shown on a selected glass chip */
  dot?: string;
};

/** A toggle pill, 44 pt high. */
export function Chip({ label, selected, onPress, leading, tone = 'solid', dot }: ChipProps) {
  const glass = tone === 'glass';
  return (
    <SpringPressable
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        glass ? styles.glass : selected ? styles.on : styles.off,
        glass && !selected && styles.glassOff,
      ]}
    >
      {glass && selected && dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <Text variant="label" color={!glass && selected ? 'inverseForeground' : 'foreground'}>
        {label}
      </Text>
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: minTarget, paddingHorizontal: 16, borderRadius: radii.full, flexDirection: 'row', alignItems: 'center', gap: 8 },
  off: { backgroundColor: colors.surface, boxShadow: `${shadows.ring}, ${shadows.lift}` } as any,
  on: { backgroundColor: colors.inverse },
  glass: {
    backgroundColor: isDark ? 'rgba(32, 18, 58, 0.82)' : 'rgba(255, 255, 255, 0.82)',
    boxShadow: `${shadows.ring}, ${shadows.lift}`,
    backdropFilter: 'blur(14px) saturate(1.6)',
  } as any,
  glassOff: { opacity: 0.62 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  leading: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});

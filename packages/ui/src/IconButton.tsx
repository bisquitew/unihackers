import * as React from 'react';
import {  StyleSheet } from 'react-native';
import { SpringPressable } from './SpringPressable';
import { colors, minTarget, shadows } from './tokens';
import { isDark } from './theme';

type IconButtonProps = {
  /** Always required: an icon alone is not a label. */
  label: string;
  onPress?: () => void;
  children: React.ReactNode;
  /**
   * `light`: solid white, for sheets and plain screens (default).
   * `glass`: frosted white, the same material as the floating chips and the tab bar; use it over a map.
   * `primary`: the pink main action of the screen, with an ink glyph (one per screen).
   * `ink`: solid dark.
   */
  tone?: 'light' | 'glass' | 'primary' | 'ink';
  /** 48 by default; 44 matches the height of chips. */
  size?: 44 | 48;
};

/** A round button holding an icon. */
export function IconButton({ label, onPress, children, tone = 'light', size = 48 }: IconButtonProps) {
  return (
    <SpringPressable
      scaleTo={0.88}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={size < minTarget + 4 ? 6 : 4}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        styles[tone],
      ]}
    >
      {children}
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  light: { backgroundColor: isDark ? 'rgba(32, 18, 58, 0.96)' : 'rgba(255, 255, 255, 0.94)', boxShadow: shadows.float } as any,
  glass: {
    backgroundColor: isDark ? 'rgba(32, 18, 58, 0.8)' : 'rgba(255, 255, 255, 0.82)',
    boxShadow: `${shadows.ring}, ${shadows.lift}`,
    backdropFilter: 'blur(14px) saturate(1.6)',
  } as any,
  primary: { backgroundColor: colors.primary, boxShadow: shadows.lift } as any,
  ink: { backgroundColor: colors.inverse, boxShadow: shadows.lift } as any,
});

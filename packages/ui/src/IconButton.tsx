import * as React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, shadows } from './tokens';

type IconButtonProps = {
  /** Always required: an icon alone is not a label. */
  label: string;
  onPress?: () => void;
  children: React.ReactNode;
  /** 'light' floats over maps; 'ink' is the solid dark variant. */
  tone?: 'light' | 'ink';
};

/** A 48 pt round button holding an icon. */
export function IconButton({ label, onPress, children, tone = 'light' }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.btn, tone === 'ink' ? styles.ink : styles.light, pressed && { transform: [{ scale: 0.95 }] }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  light: { backgroundColor: 'rgba(255, 255, 255, 0.94)', boxShadow: shadows.float } as any,
  ink: { backgroundColor: colors.inverse, boxShadow: shadows.lift } as any,
});

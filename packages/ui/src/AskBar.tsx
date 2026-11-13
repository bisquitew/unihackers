import * as React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radii, shadows } from './tokens';
import { Text } from './Text';
import { Sparkle } from './icons';

/** The one solid dark pill on Home: opens the assistant. */
export function AskBar({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.bar, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <Sparkle size={21} weight="fill" color={colors.inverseForeground} />
      <Text variant="label" color="inverseForeground" style={styles.text}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.inverse,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    boxShadow: shadows.lift,
  } as any,
  text: { fontSize: 15, lineHeight: 20 },
});

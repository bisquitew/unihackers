import * as React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, minTarget } from './tokens';
import { Text } from './Text';
import { CaretLeft } from './icons';

/** The back affordance on pushed screens: a caret and the name of where it goes. */
export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${label}`} onPress={onPress} hitSlop={8} style={styles.link}>
      <CaretLeft size={18} weight="bold" color={colors.foreground} />
      <Text variant="label" style={{ fontSize: 15 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: minTarget, alignSelf: 'flex-start', marginBottom: 6 },
});

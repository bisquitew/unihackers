import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, minTarget, radii, shadows } from './tokens';
import { Text } from './Text';

export type SegmentedOption<T extends string = string> = { id: T; label: string };

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Names the group for screen readers, e.g. "Community sections". */
  accessibilityLabel: string;
};

/**
 * A segmented control: one soft ink-tinted track, the chosen option lifts out of it as a white pill.
 * Use for 2 to 4 sibling views of the same screen (text only, no emoji). Each option is at least 44 pt high.
 */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.track}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => !active && onChange(o.id)}
            style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && !active && { backgroundColor: colors.hairline }]}
          >
            <Text variant="label" color={active ? 'foreground' : 'mutedForeground'} numberOfLines={1} style={active ? styles.labelActive : undefined}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, borderRadius: radii.full, backgroundColor: colors.secondary },
  item: { flex: 1, minHeight: minTarget - 6, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  itemActive: { backgroundColor: colors.surface, boxShadow: `${shadows.ring}, ${shadows.lift}` } as any,
  labelActive: { fontWeight: '700' },
});

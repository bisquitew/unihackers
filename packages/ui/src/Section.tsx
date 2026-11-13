import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { minTarget } from './tokens';
import { Text } from './Text';

type SectionProps = {
  title: string;
  /** When given, a quiet "See all" appears on the right. */
  onSeeAll?: () => void;
  seeAllLabel?: string;
  children: React.ReactNode;
};

/** A titled block of the screen. The title is a plain heading; there are no labels above it. */
export function Section({ title, onSeeAll, seeAllLabel = 'See all', children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="section" accessibilityRole="header">
          {title}
        </Text>
        {onSeeAll ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${seeAllLabel}, ${title}`}
            onPress={onSeeAll}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}
            style={styles.seeAll}
          >
            <Text variant="label" color="mutedForeground">
              {seeAllLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: minTarget - 16, marginBottom: 6, paddingHorizontal: 4 },
  seeAll: { justifyContent: 'center', minHeight: 28 },
});

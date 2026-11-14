import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './tokens';

type ScreenProps = {
  children: React.ReactNode;
  /** Leave room for the floating tab bar. Default true. */
  tabBar?: boolean;
  /** Content pinned above the safe-area bottom (detail screens put their actions here). */
  footer?: React.ReactNode;
};

/** A plain white scrolling page with safe-area padding. Phone screens are white, never a tinted background. */
export function Screen({ children, tabBar = true, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottom = footer ? 140 : tabBar ? 110 + insets.bottom : 32 + insets.bottom;
  return (
    <View style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, gap: 10, backgroundColor: colors.background },
});

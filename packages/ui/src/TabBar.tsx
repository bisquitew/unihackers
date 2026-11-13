import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows } from './tokens';
import { Text } from './Text';
import { House, MapTrifold, ChatsCircle, UserCircle } from './icons';

// Structural subset of React Navigation's BottomTabBarProps, so this package does not depend on it.
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; tabBarAccessibilityLabel?: string } }>;
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

const tabs: Record<string, { label: string; Icon: React.ComponentType<{ size?: number; weight?: 'bold' | 'fill'; color?: string }> }> = {
  index: { label: 'Home', Icon: House },
  map: { label: 'Map', Icon: MapTrifold },
  community: { label: 'Community', Icon: ChatsCircle },
  profile: { label: 'Profile', Icon: UserCircle },
};

/**
 * Floating glass pill with four tabs. Icon AND label on every tab, never icon-only.
 * The active tab gets a soft ink pill and a filled icon. Alerts is not a tab: it is the bell in the screen header.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 2 }]}>
      <BlurView intensity={45} tint="light" style={styles.bar}>
        <View style={styles.tint} pointerEvents="none" />
        {state.routes.map((route, i) => {
          const cfg = tabs[route.name];
          if (!cfg) return null;
          const focused = state.index === i;
          const { Icon } = cfg;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? cfg.label}
              onPress={onPress}
              style={[styles.item, focused && styles.itemActive]}
            >
              <Icon size={22} weight={focused ? 'fill' : 'bold'} color={colors.foreground} />
              <Text variant="caption" style={styles.label}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12 },
  bar: {
    height: 68,
    borderRadius: radii.full,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    boxShadow: shadows.float,
  } as any,
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  item: { minWidth: 64, height: 54, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4 },
  itemActive: { backgroundColor: colors.navActive },
  label: { fontFamily: 'Figtree_600SemiBold', fontSize: 11, lineHeight: 12 },
});

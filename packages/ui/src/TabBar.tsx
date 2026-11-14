import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SpringPressable } from './SpringPressable';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows } from './tokens';
import { isDark } from './theme';
import { Text } from './Text';
import { House, MapTrifold, ChatsCircle, UserCircle } from './icons';

// Structural subset of React Navigation's BottomTabBarProps, so this package does not depend on it.
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; tabBarAccessibilityLabel?: string } }>;
  // Optional: newer router versions do not pass it, so navigation can also come from `onTabPress`.
  navigation?: {
    emit?: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate?: (name: string) => void;
  };
  /** Called with the route name (`index`, `map`, `community`, `profile`) when an inactive tab is pressed. Preferred over `navigation`. */
  onTabPress?: (routeName: string) => void;
  /** Android only: the view (an expo-blur BlurTargetView) that sits behind the bar, so the bar can really blur it like on iOS. */
  blurTarget?: React.RefObject<any>;
};

const tabs: Record<string, { label: string; Icon: React.ComponentType<any> }> = {
  index: { label: 'Home', Icon: House },
  map: { label: 'Map', Icon: MapTrifold },
  community: { label: 'Community', Icon: ChatsCircle },
  profile: { label: 'Profile', Icon: UserCircle },
};

/**
 * Floating glass pill with four tabs. Icon AND label on every tab, never icon-only.
 * The active tab gets a soft ink pill and a filled icon. Alerts is not a tab: it is the bell in the screen header.
 */
export function FloatingTabBar({ state, descriptors, navigation, onTabPress, blurTarget }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 2 }]}>
      <BlurView
        intensity={45}
        tint={isDark ? 'dark' : 'light'}
        style={styles.bar}
        {...(Platform.OS === 'android' && blurTarget ? { blurTarget, blurMethod: 'dimezisBlurView' as const, blurReductionFactor: 2 } : {})}
      >
        <View style={styles.tint} pointerEvents="none" />
        {state.routes.map((route, i) => {
          const cfg = tabs[route.name];
          if (!cfg) return null;
          const focused = state.index === i;
          const { Icon } = cfg;
          const onPress = () => {
            if (focused) return;
            if (onTabPress) {
              onTabPress(route.name);
              return;
            }
            const event = navigation?.emit?.({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!event?.defaultPrevented) navigation?.navigate?.(route.name);
          };
          return (
            <SpringPressable
              scaleTo={0.88}
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
            </SpringPressable>
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
  tint: { ...StyleSheet.absoluteFill, backgroundColor: isDark ? 'rgba(32, 18, 58, 0.72)' : 'rgba(255, 255, 255, 0.6)' },
  item: { minWidth: 64, height: 54, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4 },
  itemActive: { backgroundColor: colors.navActive },
  label: { fontFamily: 'Figtree_600SemiBold', fontSize: 11, lineHeight: 12 },
});

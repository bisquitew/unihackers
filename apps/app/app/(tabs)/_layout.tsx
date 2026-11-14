import * as React from 'react';
import { View } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { FloatingTabBar, colors } from '@hub/ui';

const ORDER = ['index', 'map', 'community', 'profile'] as const;
const TITLES: Record<string, string> = { index: 'Home', map: 'Map', community: 'Community', profile: 'Profile' };
const routes = ORDER.map((name) => ({ key: name, name }));
const descriptors = Object.fromEntries(ORDER.map((name) => [name, { options: { title: TITLES[name] } }]));

// Four tabs, icon + label on each. Alerts is not a tab: it is the bell in the Home header.
// The tab bar is drawn here, on top of the screens, not inside the navigator: on Android it blurs what is behind it
// (the screens, wrapped in a BlurTargetView) just like the glass bar on iOS.
export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const blurTarget = React.useRef<any>(null);
  const goToTab = (routeName: string) => router.navigate((routeName === 'index' ? '/' : `/${routeName}`) as any);
  const first = pathname.split('/').filter(Boolean)[0] ?? 'index';
  const index = Math.max(0, ORDER.indexOf(first as (typeof ORDER)[number]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
        <Tabs tabBar={() => null} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          {/* lazy: false builds the map while you are still on Home, so it is ready when you open the tab */}
          <Tabs.Screen name="map" options={{ title: 'Map', lazy: false }} />
          <Tabs.Screen name="community" options={{ title: 'Community' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </BlurTargetView>
      <FloatingTabBar state={{ index, routes }} descriptors={descriptors} onTabPress={goToTab} blurTarget={blurTarget} />
    </View>
  );
}

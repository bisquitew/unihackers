import { Tabs, useRouter } from 'expo-router';
import { FloatingTabBar, colors } from '@hub/ui';

// Four tabs, icon + label on each. Alerts is not a tab: it is the bell in the Home header.
export default function TabsLayout() {
  const router = useRouter();
  // The tab bar navigates through the router, so it works whatever navigation props this router version passes down.
  const goToTab = (routeName: string) => router.navigate((routeName === 'index' ? '/' : `/${routeName}`) as any);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...(props as any)} onTabPress={goToTab} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

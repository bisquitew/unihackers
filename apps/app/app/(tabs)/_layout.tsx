import { Tabs } from 'expo-router';
import { FloatingTabBar, colors } from '@hub/ui';

// Four tabs, icon + label on each. Alerts is not a tab: it is the bell in the Home header.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...(props as any)} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

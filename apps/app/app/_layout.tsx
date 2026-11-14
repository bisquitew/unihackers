import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { colors } from '@hub/ui';

export default function RootLayout() {
  const [loaded] = useNunito({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  // Hold the first paint until the brand fonts are ready, so text never flashes in a fallback face.
  if (!loaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="alerts/index" />
        <Stack.Screen name="alerts/[id]" />
        {/* The four community modules are on the hop design system: they draw their own back link and title. */}
        <Stack.Screen name="m/forum/index" />
        <Stack.Screen name="m/events/index" />
        <Stack.Screen name="m/buddy/index" />
        <Stack.Screen name="m/wallet/index" />
      </Stack>
    </>
  );
}

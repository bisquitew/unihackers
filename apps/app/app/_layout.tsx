import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { colors } from '@hub/ui';

// Screens owned by other modules keep their original dark styling until they are moved onto @hub/ui.
const legacyDark = {
  headerShown: true,
  headerStyle: { backgroundColor: '#09090b' },
  headerTintColor: '#ffffff',
  headerTitleStyle: { fontWeight: 'bold' as const },
  contentStyle: { backgroundColor: '#09090b' },
};

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
        <Stack.Screen name="m/forum/index" options={{ ...legacyDark, title: 'Comunitate & Forum' }} />
        <Stack.Screen name="m/events/index" options={{ ...legacyDark, title: 'Evenimente Culturale' }} />
        <Stack.Screen name="m/buddy/index" options={{ ...legacyDark, title: 'Cu Cine? (Buddy Finder)' }} />
        <Stack.Screen name="m/wallet/index" options={{ ...legacyDark, title: 'Portofel & Bilete Solana' }} />
      </Stack>
    </>
  );
}

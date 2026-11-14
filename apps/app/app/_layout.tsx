import { useEffect, useRef } from 'react';
import { Stack, useGlobalSearchParams, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { colors, isDark, returnTo, themeStore, useThemeVersion } from '@hub/ui';
import { AuthProvider } from '../src/core/auth';
import { AuthGate } from '../src/core/AuthGate';
import { installHubClientHeader } from '../src/core/hubClient';

installHubClientHeader();

export default function RootLayout() {
  const [loaded] = useNunito({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  // A light/dark switch re-creates the whole screen tree (the `key` below) so every screen draws with the new colours at
  // once, without restarting the app. Afterwards the person is put back on the screen they were on. On web the page
  // reloads instead (returnTo carries the screen across the reload).
  const router = useRouter();
  const themeVersion = useThemeVersion();
  const navReady = !!useRootNavigationState()?.key;
  // where the person is, kept up to date except while the tree is being re-created (then it is the screen to go back to)
  const pathname = usePathname();
  const search = useGlobalSearchParams();
  const here = pathname + (Object.keys(search).length ? '?' + new URLSearchParams(Object.entries(search).map(([k, v]) => [k, String(v)])).toString() : '');
  const lastHere = useRef(here);
  const settledVersion = useRef(themeVersion);
  if (settledVersion.current === themeVersion) lastHere.current = here;
  useEffect(() => {
    if (!loaded || !navReady) return;
    const back = themeStore.takeReturn() ?? (settledVersion.current !== themeVersion ? lastHere.current : null) ?? returnTo;
    settledVersion.current = themeVersion;
    if (!back || back === '/') return;
    const id = setTimeout(() => router.replace(back as any), 0);
    return () => clearTimeout(id);
  }, [loaded, navReady, themeVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hold the first paint until the brand fonts are ready, so text never flashes in a fallback face.
  if (!loaded) return null;

  return (
    <AuthProvider>
      <AuthGate>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack key={themeVersion} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="alerts/index" />
          <Stack.Screen name="alerts/[id]" />
          {/* The four community modules are on the hop design system: they draw their own back link and title. */}
          <Stack.Screen name="m/forum/index" />
          <Stack.Screen name="m/events/index" />
          <Stack.Screen name="m/buddy/index" />
          <Stack.Screen name="m/wallet/index" />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
}

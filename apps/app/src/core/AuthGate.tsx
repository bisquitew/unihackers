import React from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@hub/ui';
import { useAuth } from './auth';
import { MobileLoginScreen } from './MobileLoginScreen';

/**
 * The mobile app is only usable while signed in: until then, only the login screen shows.
 * (The public preview lives on the website, not here.)
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.foreground} />
      </View>
    );
  }

  if (Platform.OS !== 'web' && !isLoggedIn) {
    return <MobileLoginScreen />;
  }

  // Expo web builds keep the old behaviour (guests in, restricted sections behind WebAccessGate) until the real website replaces them
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});

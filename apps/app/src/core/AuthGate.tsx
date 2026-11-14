import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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

  if (!isLoggedIn) return <MobileLoginScreen />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});

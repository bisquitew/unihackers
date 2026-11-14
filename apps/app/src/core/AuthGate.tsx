import React from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from './auth';
import { MobileLoginScreen } from './MobileLoginScreen';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // On Mobile: Strict login wall - does NOT provide any feature without logging in
  if (Platform.OS !== 'web' && !isLoggedIn) {
    return <MobileLoginScreen />;
  }

  // On Web: User enters app directly with limited access for guests (Map + preview events),
  // with restricted sections protected by WebAccessGate
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

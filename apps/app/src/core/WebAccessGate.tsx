import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@hub/ui';
import { useAuth } from './auth';

interface WebAccessGateProps {
  featureName?: string;
  requiredRole?: 'resident' | 'admin';
  children: React.ReactNode;
}

export function WebAccessGate({
  featureName = 'această funcționalitate',
  requiredRole = 'resident',
  children,
}: WebAccessGateProps) {
  const { user, isLoggedIn, isAdmin, loginAsResident, loginAsAdmin } = useAuth();
  const router = useRouter();

  // If user is logged in and meets the role requirement, render the feature
  if (isLoggedIn) {
    if (requiredRole === 'admin' && !isAdmin) {
      return (
        <View style={styles.restrictedContainer}>
          <View style={styles.card}>
            <Text style={styles.icon}>🛑</Text>
            <Text style={styles.title}>Acces Restricționat: Doar Administratori</Text>
            <Text style={styles.description}>
              Ești conectat ca <Text style={{ fontWeight: '700', color: '#ffffff' }}>{user?.name}</Text> (Rol: {user?.role}).
              {'\n'}Pentru a accesa {featureName}, este necesar un cont cu rol de Administrator (Primăria Timișoara).
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.btnAdmin}
                activeOpacity={0.8}
                onPress={() => loginAsAdmin()}
              >
                <Text style={styles.btnTextWhite}>Comută pe Profil Administrator (MFA) →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSecondary}
                activeOpacity={0.8}
                onPress={() => router.navigate('/map')}
              >
                <Text style={styles.btnTextSecondary}>← Înapoi la Hartă</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    return <>{children}</>;
  }

  // User is not logged in: Guest on Web trying to access a restricted feature
  return (
    <View style={styles.restrictedContainer}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ACCES LIMITAT PE WEB</Text>
        </View>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Autentificare Necesară</Text>
        <Text style={styles.description}>
          În mod vizitator web, ai acces liber la <Text style={{ fontWeight: '700', color: '#60a5fa' }}>Harta Interactivă</Text> și la o selecție restrânsă de evenimente.
          {'\n\n'}
          Pentru a accesa {featureName}, comunitatea, portofelul digital Solana sau raportările cetățenești, te rugăm să te conectezi.
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.btnResident}
            activeOpacity={0.8}
            onPress={() => loginAsResident()}
          >
            <Text style={styles.btnTextWhite}>👤 Conectare ca Cetățean (Standard) →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnAdmin}
            activeOpacity={0.8}
            onPress={() => loginAsAdmin()}
          >
            <Text style={styles.btnTextWhite}>🏛️ Conectare ca Administrator (Admin) →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            activeOpacity={0.8}
            onPress={() => router.navigate('/map')}
          >
            <Text style={styles.btnTextSecondary}>🗺️ Continuă pe Hartă (Mod Vizitator)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  restrictedContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    maxWidth: 520,
    width: '100%',
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  },
  badge: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderColor: '#d97706',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  icon: {
    fontSize: 44,
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  btnResident: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnAdmin: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnTextWhite: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextSecondary: {
    color: '#d4d4d8',
    fontSize: 13,
    fontWeight: '600',
  },
});

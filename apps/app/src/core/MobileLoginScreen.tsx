import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Image
} from 'react-native';
import { useAuth } from './auth';

export function MobileLoginScreen() {
  const { loginAsResident, loginAsAdmin, login, isLoading } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCustomLogin = async () => {
    if (!customEmail) return;
    setSubmitting(true);
    if (customEmail.toLowerCase().includes('admin')) {
      await loginAsAdmin();
    } else {
      await loginAsResident();
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>UNIHACK 2026 • TIMIȘOARA</Text>
          </View>
          <Text style={styles.logoEmoji}>🏛️</Text>
          <Text style={styles.title}>Timișoara City Hub</Text>
          <Text style={styles.subtitle}>
            Platforma Digitală a Cetățenilor și Administrației Locale
          </Text>
        </View>

        {/* Welcome Notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>🔐 Autentificare Necesară</Text>
          <Text style={styles.noticeBody}>
            Pentru a asigura securitatea și validarea serviciilor municipale (alerte, transport, bilet cultural Solana și sesizări), aplicația mobilă solicită conectarea la un cont cetățenesc.
          </Text>
        </View>

        {/* 1-Click Role Profiles for Hackathon Evaluation */}
        <Text style={styles.sectionHeader}>Alege un profil pentru testare:</Text>

        {/* 1. Standard Resident Card */}
        <TouchableOpacity
          style={styles.roleCard}
          activeOpacity={0.85}
          onPress={async () => {
            setSubmitting(true);
            await loginAsResident();
            setSubmitting(false);
          }}
          disabled={submitting}
        >
          <View style={styles.roleHeader}>
            <View style={styles.roleIconBgResident}>
              <Text style={styles.roleIcon}>👤</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.roleRow}>
                <Text style={styles.roleName}>Andrei Timișan</Text>
                <View style={styles.tagResident}>
                  <Text style={styles.tagResidentText}>Standard User</Text>
                </View>
              </View>
              <Text style={styles.roleEmail}>resident@timisoara-hub.ro</Text>
            </View>
          </View>

          <View style={styles.roleFeatures}>
            <Text style={styles.featureItem}>✓ Hartă interactivă & senzori de mediu</Text>
            <Text style={styles.featureItem}>✓ Înscrieri la evenimente & Portofel Solana</Text>
            <Text style={styles.featureItem}>✓ Forum civic & raportare mirosuri/avarii</Text>
          </View>

          <View style={styles.buttonPrimary}>
            <Text style={styles.buttonPrimaryText}>Conectare ca Cetățean →</Text>
          </View>
        </TouchableOpacity>

        {/* 2. Admin Card */}
        <TouchableOpacity
          style={[styles.roleCard, styles.roleCardAdmin]}
          activeOpacity={0.85}
          onPress={async () => {
            setSubmitting(true);
            await loginAsAdmin();
            setSubmitting(false);
          }}
          disabled={submitting}
        >
          <View style={styles.roleHeader}>
            <View style={styles.roleIconBgAdmin}>
              <Text style={styles.roleIcon}>🏛️</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.roleRow}>
                <Text style={styles.roleName}>Admin Primăria TM</Text>
                <View style={styles.tagAdmin}>
                  <Text style={styles.tagAdminText}>Administrator</Text>
                </View>
              </View>
              <Text style={styles.roleEmail}>admin@timisoara-hub.ro</Text>
            </View>
          </View>

          <View style={styles.roleFeatures}>
            <Text style={styles.featureItem}>✓ Toate permisiunile de cetățean</Text>
            <Text style={styles.featureItem}>✓ Publicare avarii utilități & devieri traseu tramvai</Text>
            <Text style={styles.featureItem}>✓ Tablou de bord KPI & Audit Securitate Auth0 (Passkey MFA)</Text>
          </View>

          <View style={styles.buttonAdmin}>
            <Text style={styles.buttonAdminText}>Conectare ca Administrator →</Text>
          </View>
        </TouchableOpacity>

        {/* Email Single Sign-on alternative */}
        <View style={styles.ssoCard}>
          <Text style={styles.ssoTitle}>Sau introdu adresa de email (Auth0 SSO):</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="nume@timisoara-hub.ro"
              placeholderTextColor="#71717a"
              value={customEmail}
              onChangeText={setCustomEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.ssoButton, (!customEmail || submitting) && styles.ssoButtonDisabled]}
              onPress={handleCustomLogin}
              disabled={!customEmail || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.ssoButtonText}>Conectare</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerNote}>
          Date sincronizate securizat cu TimescaleDB Cloud (Tiger Data) & Auth0 Identity
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  badgeContainer: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderColor: '#d97706',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  noticeCard: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 24,
  },
  noticeTitle: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  noticeBody: {
    color: '#d4d4d8',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  roleCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginBottom: 16,
  },
  roleCardAdmin: {
    borderColor: '#6366f1',
    backgroundColor: '#131326',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconBgResident: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBgAdmin: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIcon: {
    fontSize: 22,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  roleEmail: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
  },
  tagResident: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagResidentText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
  },
  tagAdmin: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagAdminText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600',
  },
  roleFeatures: {
    marginVertical: 14,
    paddingLeft: 4,
  },
  featureItem: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 20,
  },
  buttonPrimary: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonAdmin: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonAdminText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  ssoCard: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginTop: 8,
  },
  ssoTitle: {
    color: '#d4d4d8',
    fontSize: 13,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  ssoButton: {
    backgroundColor: '#3f3f46',
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoButtonDisabled: {
    opacity: 0.5,
  },
  ssoButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  footerNote: {
    color: '#52525b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});

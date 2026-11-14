import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text, colors, radii, shadows } from '@hub/ui';
import { useAuth } from '../../src/core/auth';
import { WebAccessGate } from '../../src/core/WebAccessGate';

export default function ProfileTab() {
  return (
    <WebAccessGate featureName="profilul tău și setările contului">
      <ProfileContent />
    </WebAccessGate>
  );
}

function ProfileContent() {
  const { user, isAdmin, isResident, loginAsResident, loginAsAdmin, logout } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil & Identitate</Text>
          <Text style={styles.headerSub}>Timișoara City Hub • Cont Digital</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, isAdmin ? styles.avatarAdmin : styles.avatarResident]}>
              <Text style={styles.avatarText}>{isAdmin ? '🏛️' : '👤'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.userName}>{user?.name || 'Cetățean Timișoara'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.badgeRow}>
                {isAdmin ? (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>🏛️ ADMINISTRATOR PRIMĂRIE</Text>
                  </View>
                ) : (
                  <View style={styles.residentBadge}>
                    <Text style={styles.residentBadgeText}>👤 CETĂȚEAN (STANDARD USER)</Text>
                  </View>
                )}
                {user?.mfa_verified && (
                  <View style={styles.mfaBadge}>
                    <Text style={styles.mfaBadgeText}>🔐 MFA VERIFICAT</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cartier Rezidență</Text>
              <Text style={styles.infoValue}>{user?.neighbourhood || 'Cetate'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Furnizor Identitate</Text>
              <Text style={styles.infoValue}>{user?.idp || 'Auth0 Cloud'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nivel Securitate</Text>
              <Text style={styles.infoValue}>
                {isAdmin ? 'Tier 2 (FIDO2 Passkey)' : 'Tier 1 (Standard)'}
              </Text>
            </View>
          </View>
        </View>

        {/* ADMIN EXCLUSIVE SECTION */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>🛠️ Panou Administrație Municipală</Text>
              <View style={styles.adminTag}>
                <Text style={styles.adminTagText}>ADMIN ONLY</Text>
              </View>
            </View>
            <Text style={styles.sectionDescription}>
              Instrumente de dispecerat și management operativ pentru serviciile Timișoarei:
            </Text>

            <View style={styles.adminGrid}>
              <TouchableOpacity
                style={styles.adminActionCard}
                activeOpacity={0.8}
                onPress={() => router.push('/m/utilities')}
              >
                <Text style={styles.adminActionIcon}>📢</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.adminActionTitle}>Publicare Avarii Utilități</Text>
                  <Text style={styles.adminActionDesc}>
                    Emite alerte apă caldă, canalizare, Aquatim / Colterm
                  </Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminActionCard}
                activeOpacity={0.8}
                onPress={() => router.push('/m/transit')}
              >
                <Text style={styles.adminActionIcon}>🚌</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.adminActionTitle}>Devieri Trasee Transport</Text>
                  <Text style={styles.adminActionDesc}>
                    Actualizează rute STPT, linii tramvai 1, 2, 4, 5
                  </Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminActionCard}
                activeOpacity={0.8}
                onPress={() => router.push('/m/parkie')}
              >
                <Text style={styles.adminActionIcon}>🅿️</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.adminActionTitle}>Monitorizare Senzori Parcări</Text>
                  <Text style={styles.adminActionDesc}>
                    51.600+ detecții IoT în direct din TimescaleDB Cloud
                  </Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminActionCard}
                activeOpacity={0.8}
                onPress={() => router.push('/m/dashboard')}
              >
                <Text style={styles.adminActionIcon}>📊</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.adminActionTitle}>Tablou de Bord Urban (KPIs)</Text>
                  <Text style={styles.adminActionDesc}>
                    Calitatea aerului, zgomot, ocupare parcări și agregări
                  </Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STANDARD USER EXCLUSIVE SECTION */}
        {isResident && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Facilități Cetățenești Active</Text>
            <View style={styles.citizenCardsRow}>
              <TouchableOpacity
                style={styles.citizenCard}
                onPress={() => router.navigate('/community')}
              >
                <Text style={styles.citizenCardEmoji}>🎭</Text>
                <Text style={styles.citizenCardTitle}>Evenimente & Bilete</Text>
                <Text style={styles.citizenCardSub}>Vezi biletele Solana și înscrierile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.citizenCard}
                onPress={() => router.navigate('/community')}
              >
                <Text style={styles.citizenCardEmoji}>💬</Text>
                <Text style={styles.citizenCardTitle}>Forum Comunitar</Text>
                <Text style={styles.citizenCardSub}>Dezbateri cartier & inițiative</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Persona Switcher for Hackathon Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Comutare Rol (Demonstrație UNIHACK)</Text>
          <Text style={styles.sectionDescription}>
            Testează ambele tipuri de utilizatori pentru a observa diferențele de permisiuni:
          </Text>

          <View style={styles.switchRow}>
            {isAdmin ? (
              <TouchableOpacity
                style={[styles.switchButton, styles.switchButtonResident]}
                activeOpacity={0.8}
                onPress={loginAsResident}
              >
                <Text style={styles.switchBtnText}>👤 Comută pe Cetățean (Standard User)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.switchButton, styles.switchButtonAdmin]}
                activeOpacity={0.8}
                onPress={loginAsAdmin}
              >
                <Text style={styles.switchBtnText}>🏛️ Comută pe Administrator Primărie</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={logout}>
          <Text style={styles.logoutText}>🚪 Deconectare ({user?.email})</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Autentificare susținută de Auth0 & Baza de date TimescaleDB Tiger Cloud
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  container: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  headerSub: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 2,
  },
  userCard: {
    backgroundColor: '#18181b',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarResident: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  avatarAdmin: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 1.5,
    borderColor: '#6366f1',
  },
  avatarText: {
    fontSize: 28,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  residentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  residentBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  adminBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '700',
  },
  mfaBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mfaBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#71717a',
    fontSize: 11,
    marginBottom: 4,
  },
  infoValue: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  adminTag: {
    backgroundColor: '#ef4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  adminGrid: {
    gap: 10,
  },
  adminActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  adminActionIcon: {
    fontSize: 24,
  },
  adminActionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  adminActionDesc: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  citizenCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  citizenCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  citizenCardEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  citizenCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  citizenCardSub: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  switchRow: {
    marginTop: 8,
  },
  switchButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  switchButtonResident: {
    backgroundColor: '#10b981',
  },
  switchButtonAdmin: {
    backgroundColor: '#6366f1',
  },
  switchBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  logoutText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
  },
  footerNote: {
    color: '#52525b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { EventsHomeCard } from '../src/modules/m01-events/EventsHomeCard';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome Header */}
        <View style={styles.heroBox}>
          <Text style={styles.heroBadge}>UNIHACK 2026</Text>
          <Text style={styles.heroTitle}>Timișoara City Hub</Text>
          <Text style={styles.heroSub}>
            Platforma comunitară pentru rezidenți, studenți și vizitatori
          </Text>
        </View>

        {/* Home Event Card from M01 */}
        <EventsHomeCard onExplorePress={() => router.push('/m/events')} />

        {/* Quick Module Navigation Grid */}
        <Text style={styles.sectionHeader}>Module Comunitare Active (P3)</Text>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => router.push('/m/forum')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💬</Text>
            <Text style={styles.cardBadge}>M08</Text>
          </View>
          <Text style={styles.cardTitle}>Comunitate & Forum</Text>
          <Text style={styles.cardDesc}>
            Animale pierdute, întrebări locale, ajutor studențesc și inițiative de cartier.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => router.push('/m/events')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎭</Text>
            <Text style={styles.cardBadge}>M01</Text>
          </View>
          <Text style={styles.cardTitle}>Micro-Evenimente Culturale</Text>
          <Text style={styles.cardDesc}>
            Cinema independent la Faber, ateliere de olărit la Scârț, jazz pe malul Begăi.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => router.push('/m/buddy')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🤝</Text>
            <Text style={styles.cardBadge}>M07</Text>
          </View>
          <Text style={styles.cardTitle}>Cu Cine? (Event Buddy)</Text>
          <Text style={styles.cardDesc}>
            Mergi singur? Găsește parteneri de eveniment cu interese similare.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => router.push('/m/wallet')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎟️</Text>
            <Text style={[styles.cardBadge, { backgroundColor: '#1e1b4b', color: '#818cf8' }]}>
              Solana Devnet
            </Text>
          </View>
          <Text style={styles.cardTitle}>Portofel Bilete & POAP</Text>
          <Text style={styles.cardDesc}>
            Bilete de acces mintate pe blockchain și ecusoane Proof-of-Attendance.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 16 },
  heroBox: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  heroBadge: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  heroSub: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 10,
  },
  navCard: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: { fontSize: 24 },
  cardBadge: {
    backgroundColor: '#3b0764',
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  cardDesc: { color: '#a1a1aa', fontSize: 12, marginTop: 4, lineHeight: 16 },
});

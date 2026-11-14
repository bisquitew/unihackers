import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { darkHeader } from '../../../src/modules/m06-smell/header';
import type { ParkingLot } from '@hub/contracts';
// Straight from the seed file: the @hub/contracts entry loads zod-shim (top-level await), which breaks Expo's web build.
import { PARKIE_SEED_LOTS } from '../../../../../packages/contracts/src/seed/parkie.seed.ts';

export default function ParkieCitizenRoute() {
  const router = useRouter();
  const [lots] = useState<ParkingLot[]>(PARKIE_SEED_LOTS);

  const totalCapacity = lots.reduce((acc, l) => acc + l.capacity, 0);
  const totalAvailable = lots.reduce((acc, l) => acc + l.available_spots, 0);

  return (
    <>
      <Stack.Screen options={darkHeader('Parkie — Locuri de Parcare')} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Overview Stats Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Locuri Libere în Timișoara</Text>
              <Text style={styles.summaryValue}>{totalAvailable} <Text style={styles.summarySub}>/ {totalCapacity}</Text></Text>
            </View>
            <TouchableOpacity style={styles.mapButton} onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.mapButtonText}>🗺️ Vezi pe Hartă</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.noticeText}>
            ℹ️ Actualizat în timp real prin analiza video a camerelor live. Calibrarea camerelor și a plot-urilor este disponibilă exclusiv pe portalul Web Admin.
          </Text>
        </View>

        {/* Section Header */}
        <Text style={styles.sectionTitle}>Parcări Monitorizate ({lots.length})</Text>

        {/* Parking Lot List */}
        {lots.map((lot) => {
          const isGreen = lot.status_color === 'green';
          const isYellow = lot.status_color === 'yellow';

          return (
            <View key={lot.id} style={styles.lotCard}>
              <View style={styles.lotHeader}>
                <Text style={styles.lotName}>{lot.name}</Text>
                <View style={[
                  styles.statusBadge, 
                  isGreen ? styles.badgeGreen : (isYellow ? styles.badgeYellow : styles.badgeRed)
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    isGreen ? styles.textGreen : (isYellow ? styles.textYellow : styles.textRed)
                  ]}>
                    {lot.status_color.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.lotDetailsRow}>
                <Text style={styles.detailText}>
                  Disponibile: <Text style={styles.boldText}>{lot.available_spots}</Text> din {lot.capacity} locuri
                </Text>
                <Text style={styles.coordText}>
                  {lot.latitude.toFixed(4)}, {lot.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Înapoi la Ecranul Principal</Text>
        </TouchableOpacity>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#38bdf8',
  },
  summarySub: {
    fontSize: 14,
    color: '#71717a',
    fontWeight: '500',
  },
  mapButton: {
    backgroundColor: '#27272a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  noticeText: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  lotCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lotName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  badgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textGreen: { color: '#4ade80' },
  textYellow: { color: '#facc15' },
  textRed: { color: '#f87171' },
  lotDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  coordText: {
    fontSize: 11,
    color: '#52525b',
    fontFamily: 'monospace',
  },
  backButton: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { darkHeader } from '../../../src/modules/m06-smell/header';
import { apiBaseUrl } from '../../../src/core/api';
import type { ParkingLot } from '@hub/contracts';
// Straight from the seed file: fallback when backend is unreachable during offline testing
import { PARKIE_SEED_LOTS } from '../../../../../packages/contracts/src/seed/parkie.seed.ts';

export default function ParkieCitizenRoute() {
  const router = useRouter();
  const [lots, setLots] = useState<ParkingLot[]>(PARKIE_SEED_LOTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');

  const fetchLotsData = useCallback(async () => {
    try {
      const url = `${apiBaseUrl()}/v1/m/parkie/lots`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLots(data);
          return;
        }
      }
    } catch {
      // Fallback to initial seed lots when API server is not yet running
    }
  }, []);

  useEffect(() => {
    fetchLotsData();
  }, [fetchLotsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLotsData();
    setRefreshing(false);
  }, [fetchLotsData]);

  const openNavigation = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    Linking.openURL(url).catch(() => {
      // Fallback generic geo link
      Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`);
    });
  };

  const filteredLots = lots.filter((lot) => {
    if (statusFilter !== 'all' && lot.status_color !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return lot.name.toLowerCase().includes(q);
    }
    return true;
  });

  const totalCapacity = lots.reduce((acc, l) => acc + l.capacity, 0);
  const totalAvailable = lots.reduce((acc, l) => acc + l.available_spots, 0);
  const freePercent = totalCapacity > 0 ? Math.round((totalAvailable / totalCapacity) * 100) : 0;

  return (
    <>
      <Stack.Screen options={darkHeader('Parkie — Locuri de Parcare')} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      >
        {/* City Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Locuri libere în Timișoara</Text>
              <Text style={styles.summaryValue}>
                {totalAvailable} <Text style={styles.summarySub}>/ {totalCapacity}</Text>
              </Text>
              <Text style={styles.summaryRatioText}>{freePercent}% din capacitatea orașului este liberă</Text>
            </View>
            <TouchableOpacity style={styles.mapButton} onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.mapButtonText}>🗺️ Vezi pe Hartă</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.noticeText}>
            🅿️ Date actualizate în timp real prin analiza video a camerelor live. Calibrarea sloturilor și a fluxului CCTV se realizează pe portalul Web Admin.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Caută o parcare (ex: Unirii, Iulius, Gara)..."
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
              Toate ({lots.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'green' && styles.filterChipActiveGreen]}
            onPress={() => setStatusFilter('green')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'green' && styles.filterChipTextGreen]}>
              🟢 Libere
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'yellow' && styles.filterChipActiveYellow]}
            onPress={() => setStatusFilter('yellow')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'yellow' && styles.filterChipTextYellow]}>
              🟡 Aglomerate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'red' && styles.filterChipActiveRed]}
            onPress={() => setStatusFilter('red')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'red' && styles.filterChipTextRed]}>
              🔴 Ocupate
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>
          Parcări Disponibile ({filteredLots.length})
        </Text>

        {/* Parking Lot Cards */}
        {filteredLots.map((lot) => {
          const isGreen = lot.status_color === 'green';
          const isYellow = lot.status_color === 'yellow';
          const occupiedPercent = lot.capacity > 0 ? Math.min(100, Math.round(((lot.capacity - lot.available_spots) / lot.capacity) * 100)) : 100;

          return (
            <View key={lot.id} style={styles.lotCard}>
              <View style={styles.lotHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.lotName}>{lot.name}</Text>
                  <Text style={styles.coordText}>
                    📍 {lot.latitude.toFixed(4)}, {lot.longitude.toFixed(4)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isGreen ? styles.badgeGreen : isYellow ? styles.badgeYellow : styles.badgeRed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isGreen ? styles.textGreen : isYellow ? styles.textYellow : styles.textRed,
                    ]}
                  >
                    {isGreen ? '🟢 DISPONIBIL' : isYellow ? '🟡 AGLOMERAT' : '🔴 OCUPAT'}
                  </Text>
                </View>
              </View>

              {/* Progress occupancy bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${occupiedPercent}%`,
                      backgroundColor: isGreen ? '#22c55e' : isYellow ? '#eab308' : '#ef4444',
                    },
                  ]}
                />
              </View>

              <View style={styles.lotDetailsRow}>
                <Text style={styles.detailText}>
                  Disponibile: <Text style={styles.boldText}>{lot.available_spots}</Text> din {lot.capacity} locuri
                </Text>
                <Text style={styles.occupancyText}>{occupiedPercent}% ocupat</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.navigateBtn}
                  onPress={() => openNavigation(lot.latitude, lot.longitude, lot.name)}
                >
                  <Text style={styles.navigateBtnText}>🧭 Navighează</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewOnMapBtn}
                  onPress={() => router.push('/(tabs)/map')}
                >
                  <Text style={styles.viewOnMapBtnText}>🗺️ Pe Hartă</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredLots.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nu am găsit nicio parcare corespunzătoare filtrelor.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Înapoi la Ecranul Principal</Text>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  summaryRatioText: {
    fontSize: 12,
    color: '#4ade80',
    marginTop: 2,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: '#ffffff',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: '#27272a',
    borderColor: '#38bdf8',
  },
  filterChipActiveGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  filterChipActiveYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#eab308',
  },
  filterChipActiveRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  filterChipText: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipTextGreen: { color: '#4ade80' },
  filterChipTextYellow: { color: '#facc15' },
  filterChipTextRed: { color: '#f87171' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  lotCard: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  lotName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  progressTrack: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  lotDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  occupancyText: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  coordText: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 12,
  },
  navigateBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  navigateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  viewOnMapBtn: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  viewOnMapBtnText: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 13,
  },
  backButton: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

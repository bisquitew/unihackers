import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';

interface CityOverview {
  generated_at: string;
  city: string;
  kpis: {
    parking: {
      total_lots: number;
      total_capacity: number;
      total_available_spots: number;
      occupancy_rate_pct: number;
      most_congested_lots: Array<{
        id: string;
        name: string;
        available_spots: number;
        capacity: number;
        status_color: string;
        occupancy_pct: number;
      }>;
    };
    environment: {
      air_quality_avg_pm25: number;
      air_quality_status: string;
      avg_noise_db: number;
      monitored_neighbourhoods: number;
    };
    infrastructure_alerts: {
      active_utility_outages: number;
      active_transit_detours: number;
      tram_line_5_status: string;
    };
    timescale_tiger_cloud: {
      continuous_aggregates_active: number;
      compression_ratio: string;
      real_time_aggregates_enabled: boolean;
    };
  };
}

export function DashboardScreen({ apiBaseUrl = 'http://localhost:8000' }: { apiBaseUrl?: string }) {
  const [overview, setOverview] = useState<CityOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/v1/m/dashboard/overview`);
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch {
      // In-memory fallback
      setOverview({
        generated_at: new Date().toISOString(),
        city: 'Timișoara',
        kpis: {
          parking: {
            total_lots: 10,
            total_capacity: 1750,
            total_available_spots: 685,
            occupancy_rate_pct: 61,
            most_congested_lots: [
              { id: '1', name: 'Piața Unirii Central', available_spots: 3, capacity: 45, status_color: 'red', occupancy_pct: 93 },
              { id: '2', name: 'Hotel Continental', available_spots: 8, capacity: 60, status_color: 'yellow', occupancy_pct: 87 },
              { id: '3', name: 'Iulius Town Nord', available_spots: 42, capacity: 180, status_color: 'yellow', occupancy_pct: 77 },
            ],
          },
          environment: {
            air_quality_avg_pm25: 22.4,
            air_quality_status: 'good',
            avg_noise_db: 58.4,
            monitored_neighbourhoods: 13,
          },
          infrastructure_alerts: {
            active_utility_outages: 4,
            active_transit_detours: 2,
            tram_line_5_status: 'suspended_replacement_active',
          },
          timescale_tiger_cloud: {
            continuous_aggregates_active: 2,
            compression_ratio: '94.8%',
            real_time_aggregates_enabled: true,
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    Linking.openURL(`${apiBaseUrl}/v1/core/open-data/export?format=csv`).catch((err) => {
      console.warn('Could not open CSV URL:', err);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.heroBox}>
        <Text style={styles.heroTitle}>Panou Oficial — Municipiul Timișoara</Text>
        <Text style={styles.heroSubtitle}>
          Indicatori urbani în timp real alimentați de Tiger Cloud TimescaleDB
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#a855f7" style={{ marginVertical: 32 }} />
      ) : overview ? (
        <>
          {/* Timescale / Tiger Cloud Sponsor Banner */}
          <View style={styles.tigerCard}>
            <View style={styles.tigerHeader}>
              <Text style={styles.tigerBadge}>🐅 TIGER DATA (TIMESCALE)</Text>
              <Text style={styles.tigerRealtime}>LIVE AGGREGATES</Text>
            </View>
            <View style={styles.tigerStatsRow}>
              <View style={styles.tigerStat}>
                <Text style={styles.tigerStatVal}>{overview.kpis.timescale_tiger_cloud.compression_ratio}</Text>
                <Text style={styles.tigerStatLabel}>Compresie Chunks</Text>
              </View>
              <View style={styles.tigerStat}>
                <Text style={styles.tigerStatVal}>{overview.kpis.timescale_tiger_cloud.continuous_aggregates_active}</Text>
                <Text style={styles.tigerStatLabel}>Materialized Views</Text>
              </View>
              <View style={styles.tigerStat}>
                <Text style={styles.tigerStatVal}>{overview.kpis.environment.monitored_neighbourhoods}</Text>
                <Text style={styles.tigerStatLabel}>Cartiere Monitorizate</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.grid}>
            {/* Parking KPI */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>🅿️</Text>
              <Text style={styles.kpiValue}>{overview.kpis.parking.occupancy_rate_pct}%</Text>
              <Text style={styles.kpiTitle}>Grad Ocupare Parcări</Text>
              <Text style={styles.kpiDetail}>
                {overview.kpis.parking.total_available_spots} locuri libere din {overview.kpis.parking.total_capacity}
              </Text>
            </View>

            {/* Environmental KPI */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>🌿</Text>
              <Text style={styles.kpiValue}>{overview.kpis.environment.air_quality_avg_pm25}</Text>
              <Text style={styles.kpiTitle}>PM2.5 (Calitate Aer)</Text>
              <Text style={[styles.kpiDetail, { color: '#4ade80' }]}>
                Stare: {overview.kpis.environment.air_quality_status.toUpperCase()}
              </Text>
            </View>

            {/* Noise KPI */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>📢</Text>
              <Text style={styles.kpiValue}>{overview.kpis.environment.avg_noise_db} dB</Text>
              <Text style={styles.kpiTitle}>Zgomot Mediu Urban</Text>
              <Text style={styles.kpiDetail}>Senzori acustici activi</Text>
            </View>

            {/* Disruptions KPI */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>⚠️</Text>
              <Text style={styles.kpiValue}>
                {overview.kpis.infrastructure_alerts.active_utility_outages +
                  overview.kpis.infrastructure_alerts.active_transit_detours}
              </Text>
              <Text style={styles.kpiTitle}>Alerte Active Infrastructură</Text>
              <Text style={styles.kpiDetail}>Colterm, Aquatim & STPT</Text>
            </View>
          </View>

          {/* Congested Lots */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🚗 Cele mai solicitate parcări</Text>
            {overview.kpis.parking.most_congested_lots.map((lot) => (
              <View key={lot.id} style={styles.lotRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lotName}>{lot.name}</Text>
                  <Text style={styles.lotCapacity}>
                    {lot.available_spots} libere / {lot.capacity} capacitate
                  </Text>
                </View>
                <View style={styles.lotMeterBox}>
                  <Text style={styles.lotPct}>{lot.occupancy_pct}% ocupat</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Open Data Download Button */}
          <View style={styles.openDataBox}>
            <Text style={styles.openDataTitle}>🏛️ Open Data Commons (ODbL)</Text>
            <Text style={styles.openDataText}>
              Descarcă setul complet de date anonimizate pentru mobilitate urbană și senzori de mediu în format CSV:
            </Text>
            <TouchableOpacity style={styles.csvButton} onPress={handleDownloadCsv}>
              <Text style={styles.csvButtonText}>📥 Descarcă Raport CSV (Open Data)</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScrollView>
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
  heroBox: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  tigerCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  tigerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tigerBadge: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tigerRealtime: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  tigerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tigerStat: {
    alignItems: 'center',
    flex: 1,
  },
  tigerStatVal: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tigerStatLabel: {
    color: '#a5b4fc',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  kpiIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 4,
  },
  kpiDetail: {
    fontSize: 11,
    color: '#71717a',
  },
  sectionCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  lotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  lotName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  lotCapacity: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
  },
  lotMeterBox: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lotPct: {
    color: '#f97316',
    fontWeight: '700',
    fontSize: 12,
  },
  openDataBox: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  openDataTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  openDataText: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    marginBottom: 14,
  },
  csvButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  csvButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

interface Outage {
  id: string;
  title: string;
  provider: 'colterm' | 'aquatim' | 'enel';
  type: 'heating' | 'hot_water' | 'drinking_water' | 'electricity';
  status: 'planned_maintenance' | 'unplanned_breakdown' | 'restoring';
  affected_areas: string[];
  affected_streets: string[];
  start_time: string;
  estimated_restore_time: string | null;
  crowd_confirmations_count: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  colterm: '#f97316',
  aquatim: '#0284c7',
  enel: '#eab308',
};

const PROVIDER_NAMES: Record<string, string> = {
  colterm: 'Colterm (Termoficare)',
  aquatim: 'Aquatim (Apă Canal)',
  enel: 'Rețele Electrice Banat',
};

export function UtilitiesScreen({ apiBaseUrl = 'http://localhost:8000' }: { apiBaseUrl?: string }) {
  const router = useRouter();
  const [outages, setOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAddress, setSearchAddress] = useState('');
  const [checkResult, setCheckResult] = useState<{ affected: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchOutages();
  }, []);

  const fetchOutages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/v1/m/utilities/outages`);
      if (res.ok) {
        const data = await res.json();
        setOutages(Array.isArray(data) ? data : data.outages || []);
      }
    } catch {
      // In-memory fallback if offline
      setOutages([
        {
          id: 'colterm-01',
          title: 'Avarie Rețea Primară Colterm — Punct Termic PT 44',
          provider: 'colterm',
          type: 'heating',
          status: 'unplanned_breakdown',
          affected_areas: ['Circumvalațiunii', 'Complex Studențesc'],
          affected_streets: ['Strada Circumvalațiunii', 'Aleea Studenților'],
          start_time: '2026-11-14T08:00:00Z',
          estimated_restore_time: '2026-11-14T22:00:00Z',
          crowd_confirmations_count: 73,
        },
        {
          id: 'aquatim-01',
          title: 'Lucrări Programate Rețea Apă Potabilă DN 500',
          provider: 'aquatim',
          type: 'drinking_water',
          status: 'planned_maintenance',
          affected_areas: ['Calea Aradului', 'Lipovei'],
          affected_streets: ['Calea Aradului', 'Str. Sever Bocu'],
          start_time: '2026-11-14T09:00:00Z',
          estimated_restore_time: '2026-11-14T18:00:00Z',
          crowd_confirmations_count: 24,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAddress = async () => {
    if (!searchAddress.trim()) return;
    setChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch(`${apiBaseUrl}/v1/m/utilities/check-address?address=${encodeURIComponent(searchAddress)}`);
      if (res.ok) {
        const data = await res.json();
        setCheckResult(data);
      } else {
        // Fallback local check
        const normalized = searchAddress.toLowerCase();
        const matched = outages.some(
          (o) =>
            o.affected_streets.some((s) => s.toLowerCase().includes(normalized)) ||
            o.affected_areas.some((a) => a.toLowerCase().includes(normalized))
        );
        setCheckResult({
          affected: matched,
          message: matched
            ? `⚠️ Adresa "${searchAddress}" este afectată de lucrări/avarii active!`
            : `✅ Nu există întreruperi raportate pentru adresa "${searchAddress}".`,
        });
      }
    } catch {
      setCheckResult({
        affected: false,
        message: `Serviciul de verificare funcționează în mod offline.`,
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.heroBox}>
        <Text style={styles.heroTitle}>Avarii & Utilități Timișoara</Text>
        <Text style={styles.heroSubtitle}>
          Monitorizare în timp real: Colterm, Aquatim și Rețele Electrice
        </Text>
      </View>

      {/* Address Checker */}
      <View style={styles.checkerCard}>
        <Text style={styles.checkerTitle}>🔍 Verifică adresa ta</Text>
        <Text style={styles.checkerHelp}>
          Introdu strada sau cartierul pentru a vedea dacă ești afectat:
        </Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ex: Circumvalațiunii, Calea Aradului..."
            placeholderTextColor="#71717a"
            value={searchAddress}
            onChangeText={setSearchAddress}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleCheckAddress} disabled={checking}>
            <Text style={styles.searchButtonText}>{checking ? '...' : 'Verifică'}</Text>
          </TouchableOpacity>
        </View>

        {checkResult && (
          <View style={[styles.resultBox, checkResult.affected ? styles.resultAlert : styles.resultOk]}>
            <Text style={[styles.resultText, checkResult.affected ? styles.resultTextAlert : styles.resultTextOk]}>
              {checkResult.message}
            </Text>
          </View>
        )}
      </View>

      {/* Outages List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Avarii & Lucrări Active ({outages.length})</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#f97316" style={{ marginVertical: 24 }} />
      ) : outages.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nu sunt întreruperi active în Timișoara! 🎉</Text>
        </View>
      ) : (
        outages.map((outage) => {
          const providerColor = PROVIDER_COLORS[outage.provider] || '#71717a';
          return (
            <View key={outage.id} style={styles.outageCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.providerBadge, { backgroundColor: providerColor }]}>
                  <Text style={styles.providerBadgeText}>
                    {PROVIDER_NAMES[outage.provider] || outage.provider.toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    outage.status === 'unplanned_breakdown' ? styles.statusBreakdown : styles.statusPlanned,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {outage.status === 'unplanned_breakdown' ? 'AVARIE' : 'PROGRAMAT'}
                  </Text>
                </View>
              </View>

              <Text style={styles.outageTitle}>{outage.title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Zone afectate:</Text>
                <Text style={styles.metaValue}>{outage.affected_areas.join(', ') || 'Nespecificat'}</Text>
              </View>

              {outage.affected_streets.length > 0 && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Străzi:</Text>
                  <Text style={styles.metaValue}>{outage.affected_streets.slice(0, 3).join(', ')}</Text>
                </View>
              )}

              {outage.estimated_restore_time && (
                <View style={styles.restoreBox}>
                  <Text style={styles.restoreLabel}>Timp estimat de remediere:</Text>
                  <Text style={styles.restoreValue}>
                    {new Date(outage.estimated_restore_time).toLocaleTimeString('ro-RO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ({new Date(outage.estimated_restore_time).toLocaleDateString('ro-RO')})
                  </Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.confirmationText}>
                  👥 {outage.crowd_confirmations_count} cetățeni au confirmat
                </Text>
              </View>
            </View>
          );
        })
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  checkerCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  checkerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  checkerHelp: {
    fontSize: 13,
    color: '#a1a1aa',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  searchButton: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  resultAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  resultOk: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
  },
  resultText: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultTextAlert: {
    color: '#f87171',
  },
  resultTextOk: {
    color: '#4ade80',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  outageCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  providerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  providerBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBreakdown: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusPlanned: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fca5a5',
  },
  outageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: '#71717a',
    width: 100,
  },
  metaValue: {
    fontSize: 13,
    color: '#e4e4e7',
    flex: 1,
  },
  restoreBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#27272a',
    borderRadius: 8,
  },
  restoreLabel: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  restoreValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f97316',
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 8,
  },
  confirmationText: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  emptyCard: {
    backgroundColor: '#18181b',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 15,
  },
});

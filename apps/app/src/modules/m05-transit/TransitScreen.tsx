import { apiBaseUrl as defaultApiBase } from '../../core/api';
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
import { ListenButton } from '../m10-assistant/voice/ListenButton';

interface TransitLine {
  id: string;
  line_number: string;
  type: 'tram' | 'bus' | 'trolleybus';
  name: string;
  status: 'active' | 'suspended' | 'detoured' | 'temporary';
  description: string;
}

interface TransitDetour {
  id: string;
  line_number: string;
  reason: string;
  start_date: string;
  end_date: string | null;
  suspended_stations: string[];
  alternative_instructions: string;
}

export function TransitScreen({ apiBaseUrl = defaultApiBase() }: { apiBaseUrl?: string }) {
  const [lines, setLines] = useState<TransitLine[]>([]);
  const [detours, setDetours] = useState<TransitDetour[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationQuery, setStationQuery] = useState('');
  const [checkResult, setCheckResult] = useState<{ detour_active: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchTransitData();
  }, []);

  const fetchTransitData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/v1/m/transit/lines`);
      if (res.ok) {
        const data = await res.json();
        setLines(Array.isArray(data) ? data : data.lines || []);
      }
    } catch {
      // In-memory fallback
      setLines([
        {
          id: 'line-5',
          line_number: '5',
          type: 'tram',
          name: 'Linia 5 Tramvai (Ronaț - Piața Libertății)',
          status: 'suspended',
          description: 'Lucrări majore de modernizare pe Calea Bogdăneștilor. Traseu suspendat.',
        },
        {
          id: 'line-5c',
          line_number: '5C',
          type: 'bus',
          name: 'Linia 5C Autobuz Temporar',
          status: 'temporary',
          description: 'Înlocuitor temporar pentru Linia 5 tramvai pe perioada lucrărilor.',
        },
        {
          id: 'line-e2',
          line_number: 'E2',
          type: 'bus',
          name: 'Expres E2 (Continental - Calea Șagului)',
          status: 'detoured',
          description: 'Deviat temporar pe Bulevardul Take Ionescu din cauza lucrărilor la carosabil.',
        },
        {
          id: 'line-1',
          line_number: '1',
          type: 'tram',
          name: 'Linia 1 Tramvai (Gara de Nord - Meteo)',
          status: 'active',
          description: 'Circulă conform programului normal.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStation = async () => {
    if (!stationQuery.trim()) return;
    setChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch(`${apiBaseUrl}/v1/m/transit/check-stop?stop_name=${encodeURIComponent(stationQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setCheckResult(data);
      } else {
        const norm = stationQuery.toLowerCase();
        const isBogdanestilor = norm.includes('bogdanesti') || norm.includes('bogdăneșt');
        setCheckResult({
          detour_active: isBogdanestilor,
          message: isBogdanestilor
            ? `⚠️ Stația "${stationQuery}" este afectată de suspendarea Liniei 5! Folosiți autobuzul 5C din Piața Sf. Gheorghe.`
            : `✅ Stația "${stationQuery}" este deservită în regim normal.`,
        });
      }
    } catch {
      setCheckResult({
        detour_active: false,
        message: 'Mod offline: stația este marcată conform programului standard.',
      });
    } finally {
      setChecking(false);
    }
  };

  const getStatusBadge = (status: TransitLine['status']) => {
    switch (status) {
      case 'suspended':
        return { label: 'SUSPENDAT', bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' };
      case 'detoured':
        return { label: 'DEVIAT', bg: 'rgba(249, 115, 22, 0.2)', text: '#fdba74' };
      case 'temporary':
        return { label: 'TEMPORAR', bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd' };
      default:
        return { label: 'NORMAL', bg: 'rgba(34, 197, 94, 0.2)', text: '#86efac' };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.heroBox}>
        <Text style={styles.heroTitle}>Transport Public STPT</Text>
        <Text style={styles.heroSubtitle}>
          Alerte devieri, trasee temporare și suspendări pentru 2026
        </Text>
      </View>

      {/* Station Impact Checker */}
      <View style={styles.checkerCard}>
        <Text style={styles.checkerTitle}>🚊 Verifică stația ta</Text>
        <Text style={styles.checkerHelp}>
          Află dacă tramvaiul sau autobuzul tău mai oprește în stație:
        </Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ex: Calea Bogdăneștilor, Take Ionescu..."
            placeholderTextColor="#71717a"
            value={stationQuery}
            onChangeText={setStationQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleCheckStation} disabled={checking}>
            <Text style={styles.searchButtonText}>{checking ? '...' : 'Verifică'}</Text>
          </TouchableOpacity>
        </View>

        {checkResult && (
          <View style={[styles.resultBox, checkResult.detour_active ? styles.resultAlert : styles.resultOk]}>
            <Text style={[styles.resultText, checkResult.detour_active ? styles.resultTextAlert : styles.resultTextOk]}>
              {checkResult.message}
            </Text>
          </View>
        )}
      </View>

      {/* Lines Feed */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Starea Liniilor de Transport ({lines.length})</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 24 }} />
      ) : (
        lines.map((line) => {
          const badge = getStatusBadge(line.status);
          return (
            <View key={line.id} style={styles.lineCard}>
              <View style={styles.lineCardHeader}>
                <View style={styles.lineNumberBox}>
                  <Text style={styles.lineNumberText}>{line.line_number}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.lineNameText}>{line.name}</Text>
                  <Text style={styles.lineTypeText}>{line.type.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>

              <Text style={styles.lineDescription}>{line.description}</Text>
              <ListenButton lang="ro" text={`Linia ${line.line_number}, ${line.name}: ${badge.label}. ${line.description}`} />

              {line.status === 'suspended' && (
                <View style={styles.replacementAlert}>
                  <Text style={styles.replacementAlertText}>
                    💡 Alternativă: Folosiți linia temporară de autobuz 5C din Piața Sf. Gheorghe.
                  </Text>
                </View>
              )}
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
    backgroundColor: '#3b82f6',
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
  lineCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineNumberBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  lineNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  lineNameText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  lineTypeText: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  lineDescription: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 18,
  },
  replacementAlert: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  replacementAlertText: {
    color: '#93c5fd',
    fontSize: 12,
    lineHeight: 16,
  },
});

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';

export interface TicketBadgeProps {
  ticketId: string;
  eventTitle: string;
  txSignature: string;
  explorerUrl: string;
  isCheckedIn: boolean;
}

export function TicketBadge({
  ticketId,
  eventTitle,
  txSignature,
  explorerUrl,
  isCheckedIn,
}: TicketBadgeProps) {
  const handleOpenExplorer = () => {
    Linking.openURL(explorerUrl);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.badge}>🎟️ SOLANA DEVNET POAP</Text>
        <Text style={[styles.status, isCheckedIn && styles.statusCheckedIn]}>
          {isCheckedIn ? '✓ Check-in Confirmat' : 'Valid la intrare'}
        </Text>
      </View>

      <Text style={styles.eventTitle}>{eventTitle}</Text>
      <Text style={styles.ticketId}>ID: {ticketId}</Text>

      <View style={styles.txBox}>
        <Text style={styles.txLabel}>Semnătură Tranzacție On-Chain:</Text>
        <Text style={styles.txSig} numberOfLines={2}>
          {txSignature}
        </Text>
      </View>

      <TouchableOpacity style={styles.explorerBtn} onPress={handleOpenExplorer}>
        <Text style={styles.explorerBtnText}>🔍 Vezi pe Solana Explorer (Devnet) →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f0e17',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { color: '#a5b4fc', fontSize: 10, fontWeight: 'bold' },
  status: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  statusCheckedIn: { color: '#4ade80' },
  eventTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  ticketId: { color: '#71717a', fontSize: 11, marginTop: 2 },
  txBox: {
    backgroundColor: '#181824',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  txLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  txSig: { color: '#c7d2fe', fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  explorerBtn: {
    marginTop: 10,
    backgroundColor: '#312e81',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  explorerBtnText: { color: '#e0e7ff', fontSize: 11, fontWeight: '700' },
});

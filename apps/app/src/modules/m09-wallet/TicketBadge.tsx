import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';

export interface TicketBadgeProps {
  ticketId: string;
  eventTitle: string;
  txSignature: string;
  explorerUrl: string;
  isCheckedIn: boolean;
  onShowQR?: () => void;
  onCheckIn?: () => void;
}

export function TicketBadge({
  ticketId,
  eventTitle,
  txSignature,
  explorerUrl,
  isCheckedIn,
  onShowQR,
  onCheckIn,
}: TicketBadgeProps) {
  const handleOpenExplorer = () => {
    Linking.openURL(explorerUrl);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.badge}>🎟️ SOLANA DEVNET BILET</Text>
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

      {/* Action Buttons Row */}
      <View style={styles.btnRow}>
        {onShowQR && (
          <TouchableOpacity style={styles.qrBtn} onPress={onShowQR}>
            <Text style={styles.qrBtnText}>📱 Afișează QR</Text>
          </TouchableOpacity>
        )}

        {!isCheckedIn && onCheckIn && (
          <TouchableOpacity style={styles.checkInBtn} onPress={onCheckIn}>
            <Text style={styles.checkInBtnText}>⚡ Check-in Ușă</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.explorerBtn} onPress={handleOpenExplorer}>
          <Text style={styles.explorerBtnText}>🔍 Explorer →</Text>
        </TouchableOpacity>
      </View>
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
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  qrBtn: {
    flex: 1,
    backgroundColor: '#3b0764',
    borderColor: '#7e22ce',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrBtnText: { color: '#e9d5ff', fontSize: 11, fontWeight: '700' },
  checkInBtn: {
    flex: 1,
    backgroundColor: '#14532d',
    borderColor: '#16a34a',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkInBtnText: { color: '#86efac', fontSize: 11, fontWeight: '700' },
  explorerBtn: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  explorerBtnText: { color: '#c7d2fe', fontSize: 11, fontWeight: '700' },
});

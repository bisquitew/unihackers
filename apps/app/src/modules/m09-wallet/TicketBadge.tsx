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
        <Text style={styles.badge}>🎟️ SOLANA DEVNET TICKET</Text>
        <Text style={[styles.status, isCheckedIn && styles.statusCheckedIn]}>
          {isCheckedIn ? '✓ Checked In' : 'Valid for Entry'}
        </Text>
      </View>

      <Text style={styles.eventTitle}>{eventTitle}</Text>
      <Text style={styles.ticketId}>ID: {ticketId}</Text>

      <View style={styles.txBox}>
        <Text style={styles.txLabel}>On-Chain Transaction Signature:</Text>
        <Text style={styles.txSig} numberOfLines={2}>
          {txSignature}
        </Text>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.btnRow}>
        {onShowQR && (
          <TouchableOpacity style={styles.qrBtn} onPress={onShowQR}>
            <Text style={styles.qrBtnText}>📱 Show QR</Text>
          </TouchableOpacity>
        )}

        {!isCheckedIn && onCheckIn && (
          <TouchableOpacity style={styles.checkInBtn} onPress={onCheckIn}>
            <Text style={styles.checkInBtnText}>⚡ Door Check-in</Text>
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
    borderColor: '#2e1065',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  status: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#052e16',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusCheckedIn: {
    color: '#94a3b8',
    backgroundColor: '#1e293b',
  },
  eventTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ticketId: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  txBox: {
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  txLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 2,
  },
  txSig: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qrBtn: {
    flex: 1,
    backgroundColor: '#7c3aed',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkInBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkInBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  explorerBtn: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  explorerBtnText: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '600',
  },
});

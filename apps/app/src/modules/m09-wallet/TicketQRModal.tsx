import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { MintedTicketResult } from '@hub/solana';
import { QRCodeView } from './QRCodeView';

interface TicketQRModalProps {
  visible: boolean;
  ticket: MintedTicketResult | null;
  onClose: () => void;
  onSimulateScan: (ticket: MintedTicketResult) => void;
}

export function TicketQRModal({
  visible,
  ticket,
  onClose,
  onSimulateScan,
}: TicketQRModalProps) {
  const [qrMode, setQrMode] = useState<'explorer' | 'json'>('explorer');

  if (!ticket) return null;

  const currentQrValue = qrMode === 'explorer' ? ticket.explorerUrl : ticket.qrPayload;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.tag}>🎟️ SOLANA DEVNET ACCESS TICKET</Text>
              <Text style={styles.title} numberOfLines={1}>
                {ticket.eventTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Format Toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, qrMode === 'explorer' && styles.toggleBtnActive]}
                onPress={() => setQrMode('explorer')}
              >
                <Text style={[styles.toggleBtnText, qrMode === 'explorer' && styles.toggleBtnTextActive]}>
                  📱 Camera (Explorer Link)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, qrMode === 'json' && styles.toggleBtnActive]}
                onPress={() => setQrMode('json')}
              >
                <Text style={[styles.toggleBtnText, qrMode === 'json' && styles.toggleBtnTextActive]}>
                  📋 Door Scanner (JSON)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Visual Real QR Code */}
            <View style={styles.qrContainer}>
              <QRCodeView value={currentQrValue} size={230} />
            </View>
            <Text style={styles.qrScanHint}>
              {qrMode === 'explorer'
                ? '🔍 Scan with phone camera to open on Solana Devnet (ensure top cluster says Devnet)'
                : '⚡ Formatted for the venue door reader console.'}
            </Text>

            {/* Status Pill */}
            <View
              style={[
                styles.statusPill,
                ticket.isCheckedIn ? styles.statusCheckedIn : styles.statusActive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  ticket.isCheckedIn ? styles.statusTextCheckedIn : styles.statusTextActive,
                ]}
              >
                {ticket.isCheckedIn ? '✓ Check-in Confirmed' : '🟢 Valid Ticket • Present at Entrance'}
              </Text>
            </View>

            {/* Ticket Info Card */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Attendee:</Text>
                <Text style={styles.infoValue}>{ticket.attendeeName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ticket ID:</Text>
                <Text style={styles.infoValueMono}>{ticket.ticketId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Citizen Wallet:</Text>
                <Text style={styles.infoValueMono}>
                  {ticket.ownerWallet.slice(0, 10)}...{ticket.ownerWallet.slice(-6)}
                </Text>
              </View>
            </View>

            {/* Solana Signature */}
            <View style={styles.txBox}>
              <Text style={styles.txLabel}>On-Chain Transaction Signature:</Text>
              <Text style={styles.txSig} numberOfLines={2}>
                {ticket.txSignature}
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.explorerBtn}
              onPress={() => Linking.openURL(ticket.explorerUrl)}
            >
              <Text style={styles.explorerBtnText}>🔍 View on Solana Explorer (Devnet) →</Text>
            </TouchableOpacity>

            {!ticket.isCheckedIn && (
              <TouchableOpacity
                style={styles.simulateScanBtn}
                onPress={() => {
                  onClose();
                  onSimulateScan(ticket);
                }}
              >
                <Text style={styles.simulateScanBtnText}>
                  ⚡ Simulate Door Check-in Scan (Staff Demo) →
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#09090b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 30,
    borderColor: '#27272a',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  tag: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: '#a1a1aa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#3b0764',
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  toggleBtnText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#f3e8ff',
    fontWeight: '700',
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  qrScanHint: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusActive: {
    backgroundColor: '#052e16',
    borderColor: '#16a34a',
    borderWidth: 1,
  },
  statusCheckedIn: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#4ade80',
  },
  statusTextCheckedIn: {
    color: '#94a3b8',
  },
  infoBox: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 12,
    borderColor: '#27272a',
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoValueMono: {
    color: '#c084fc',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  txBox: {
    backgroundColor: '#121215',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 16,
  },
  txLabel: {
    color: '#71717a',
    fontSize: 10,
    marginBottom: 2,
  },
  txSig: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  explorerBtn: {
    backgroundColor: '#2e1065',
    borderColor: '#7e22ce',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  explorerBtnText: {
    color: '#f3e8ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  simulateScanBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  simulateScanBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

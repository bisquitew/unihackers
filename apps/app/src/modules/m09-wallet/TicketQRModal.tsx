import React from 'react';
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
  if (!ticket) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.tag}>🎟️ BILET DE ACCES SOLANA DEVNET</Text>
              <Text style={styles.title} numberOfLines={1}>
                {ticket.eventTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Visual QR Code */}
            <View style={styles.qrContainer}>
              <QRCodeView value={ticket.qrPayload} size={200} />
            </View>

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
                {ticket.isCheckedIn ? '✓ Check-in Deja Confirmat' : '🟢 Bilet Valid • Prezintă la Intrare'}
              </Text>
            </View>

            {/* Ticket Info Card */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Participant:</Text>
                <Text style={styles.infoValue}>{ticket.attendeeName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bilet ID:</Text>
                <Text style={styles.infoValueMono}>{ticket.ticketId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Portofel Rezident:</Text>
                <Text style={styles.infoValueMono}>
                  {ticket.ownerWallet.slice(0, 10)}...{ticket.ownerWallet.slice(-6)}
                </Text>
              </View>
            </View>

            {/* Solana Signature */}
            <View style={styles.txBox}>
              <Text style={styles.txLabel}>Semnătură Tranzacție On-Chain:</Text>
              <Text style={styles.txSig} numberOfLines={2}>
                {ticket.txSignature}
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.explorerBtn}
              onPress={() => Linking.openURL(ticket.explorerUrl)}
            >
              <Text style={styles.explorerBtnText}>🔍 Vezi pe Solana Explorer (Devnet) →</Text>
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
                  ⚡ Simulează Scanarea la Ușă (Staff Demo) →
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121216',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingBottom: 12,
  },
  tag: { color: '#a855f7', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  title: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 2, maxWidth: 280 },
  closeBtn: {
    backgroundColor: '#27272a',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  content: { paddingVertical: 14, alignItems: 'center' },
  qrContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 10,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 12,
  },
  statusActive: { backgroundColor: '#14532d', borderWidth: 1, borderColor: '#16a34a' },
  statusCheckedIn: { backgroundColor: '#27272a', borderWidth: 1, borderColor: '#3f3f46' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  statusTextActive: { color: '#86efac' },
  statusTextCheckedIn: { color: '#a1a1aa' },

  infoBox: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: { color: '#a1a1aa', fontSize: 12 },
  infoValue: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  infoValueMono: { color: '#c084fc', fontSize: 11, fontFamily: 'monospace' },

  txBox: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  txLabel: { color: '#71717a', fontSize: 10, fontWeight: '600' },
  txSig: { color: '#a5b4fc', fontSize: 10, fontFamily: 'monospace', marginTop: 3 },

  explorerBtn: {
    backgroundColor: '#2e1065',
    borderColor: '#7e22ce',
    borderWidth: 1,
    paddingVertical: 10,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  explorerBtnText: { color: '#d8b4fe', fontSize: 12, fontWeight: 'bold' },

  simulateScanBtn: {
    backgroundColor: '#8d23be',
    paddingVertical: 12,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
  },
  simulateScanBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
});

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MintedTicketResult, PoapResult } from '@hub/solana';
import { ticketStore } from './ticketStore';

interface ScannerModalProps {
  visible: boolean;
  ticket: MintedTicketResult | null;
  onClose: () => void;
  onSuccess: (poap: PoapResult) => void;
}

export function ScannerModal({ visible, ticket, onClose, onSuccess }: ScannerModalProps) {
  const [scanStep, setScanStep] = useState<number>(0);
  const [issuedPoap, setIssuedPoap] = useState<PoapResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !ticket) {
      setScanStep(0);
      setIssuedPoap(null);
      setErrorMessage(null);
      return;
    }

    if (ticket.isCheckedIn) {
      setErrorMessage('Acest bilet a fost deja utilizat pentru check-in!');
      return;
    }

    let isMounted = true;

    const runScan = async () => {
      // Step 1: Laser scanning
      setScanStep(1);
      await new Promise((r) => setTimeout(r, 700));
      if (!isMounted) return;

      // Step 2: Validating cryptographic signature on Solana Devnet
      setScanStep(2);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMounted) return;

      // Step 3: Minting POAP Attendance Badge
      setScanStep(3);
      const result = await ticketStore.checkInTicket(ticket.ticketId);
      if (!isMounted) return;

      // Step 4: Complete
      if (result.success && result.poap) {
        setIssuedPoap(result.poap);
        setScanStep(4);
        onSuccess(result.poap);
      } else {
        setErrorMessage(result.error || 'Eroare la validarea biletului');
      }
    };

    runScan();

    return () => {
      isMounted = false;
    };
  }, [visible, ticket]);

  if (!ticket) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.tag}>📱 SCANNER BILETE LA INTRARE • STAFF DEMO</Text>
              <Text style={styles.title} numberOfLines={1}>
                {ticket.eventTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner Viewfinder Box */}
          {scanStep < 4 && !errorMessage && (
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinderBox}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                <View style={styles.laserLine} />

                <Text style={styles.viewfinderText}>
                  {scanStep === 1 && '🔍 Scanare cod QR bilet...'}
                  {scanStep === 2 && '🔐 Verificare Ed25519 pe Solana Devnet...'}
                  {scanStep === 3 && '🏅 Minting Ecuson POAP On-Chain...'}
                </Text>
                <ActivityIndicator size="small" color="#c084fc" style={{ marginTop: 12 }} />
              </View>

              <View style={styles.ticketDetailsBox}>
                <Text style={styles.ticketIdText}>Bilet ID: {ticket.ticketId}</Text>
                <Text style={styles.walletText} numberOfLines={1}>
                  Participant: {ticket.attendeeName} ({ticket.ownerWallet.slice(0, 8)}...{ticket.ownerWallet.slice(-6)})
                </Text>
              </View>
            </View>
          )}

          {/* Error State */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Acces Refuzat</Text>
              <Text style={styles.errorDesc}>{errorMessage}</Text>
              <TouchableOpacity style={styles.errorCloseBtn} onPress={onClose}>
                <Text style={styles.errorCloseBtnText}>Închide</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success / POAP Badge Awarded State */}
          {scanStep === 4 && issuedPoap && (
            <View style={styles.successContainer}>
              <View style={styles.badgeCelebration}>
                <Text style={styles.badgeIcon}>🏅</Text>
                <Text style={styles.badgeCongratulations}>Bilet Verificat • Acces Permis!</Text>
                <Text style={styles.poapUnlockedTag}>✨ NOU ECUSON POAP EMIS PE SOLANA</Text>
                <Text style={styles.poapTitle}>{issuedPoap.badgeName}</Text>
              </View>

              <View style={styles.poapDetailsBox}>
                <Text style={styles.poapDetailLabel}>Semnătură Tranzacție POAP Devnet:</Text>
                <Text style={styles.poapSig} numberOfLines={2}>
                  {issuedPoap.txSignature}
                </Text>
                <Text style={styles.poapTime}>
                  Verificat: {new Date(issuedPoap.issuedAt).toLocaleTimeString()} • Timișoara Culture Hub
                </Text>
              </View>

              <TouchableOpacity
                style={styles.explorerBtn}
                onPress={() => Linking.openURL(issuedPoap.explorerUrl)}
              >
                <Text style={styles.explorerBtnText}>🔍 Vezi POAP pe Solana Explorer →</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>✓ Finalizează Check-in</Text>
              </TouchableOpacity>
            </View>
          )}
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
    marginBottom: 16,
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

  // Viewfinder
  viewfinderContainer: { alignItems: 'center', paddingVertical: 10 },
  viewfinderBox: {
    width: 220,
    height: 220,
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#09090b',
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#8d23be',
  },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  laserLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#c084fc',
    position: 'absolute',
    top: '45%',
    shadowColor: '#c084fc',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  viewfinderText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 40,
  },
  ticketDetailsBox: {
    marginTop: 16,
    backgroundColor: '#18181b',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  ticketIdText: { color: '#a1a1aa', fontSize: 11, fontWeight: 'bold' },
  walletText: { color: '#ffffff', fontSize: 12, marginTop: 4 },

  // Error State
  errorBox: { alignItems: 'center', paddingVertical: 30 },
  errorIcon: { fontSize: 40, marginBottom: 10 },
  errorTitle: { color: '#ef4444', fontSize: 18, fontWeight: 'bold' },
  errorDesc: { color: '#d4d4d8', fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 },
  errorCloseBtn: {
    marginTop: 20,
    backgroundColor: '#27272a',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  errorCloseBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  // Success State
  successContainer: { alignItems: 'center', paddingVertical: 10 },
  badgeCelebration: {
    alignItems: 'center',
    backgroundColor: '#2e1065',
    borderColor: '#7e22ce',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 18,
    width: '100%',
  },
  badgeIcon: { fontSize: 44, marginBottom: 6 },
  badgeCongratulations: { color: '#4ade80', fontSize: 16, fontWeight: 'bold' },
  poapUnlockedTag: { color: '#facc15', fontSize: 10, fontWeight: '800', marginTop: 6, letterSpacing: 1 },
  poapTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  poapDetailsBox: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  poapDetailLabel: { color: '#a1a1aa', fontSize: 10, fontWeight: '600' },
  poapSig: { color: '#c084fc', fontSize: 10, fontFamily: 'monospace', marginTop: 3 },
  poapTime: { color: '#71717a', fontSize: 10, marginTop: 6 },
  explorerBtn: {
    marginTop: 14,
    backgroundColor: '#3b0764',
    borderColor: '#6b21a8',
    borderWidth: 1,
    paddingVertical: 10,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
  },
  explorerBtnText: { color: '#e9d5ff', fontSize: 12, fontWeight: 'bold' },
  doneBtn: {
    marginTop: 10,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
  },
  doneBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
});

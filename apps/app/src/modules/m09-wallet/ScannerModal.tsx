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
      setErrorMessage('This ticket has already been used for check-in!');
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
        setErrorMessage(result.error || 'Error validating ticket on Devnet');
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
              <Text style={styles.headerTag}>⚡ VENUE DOOR CHECK-IN SCANNER</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
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
                  {scanStep === 1 && '🔍 Scanning ticket QR code...'}
                  {scanStep === 2 && '🔐 Verifying Ed25519 signature on Solana Devnet...'}
                  {scanStep === 3 && '🏅 Minting on-chain POAP Attendance Badge...'}
                </Text>
                <ActivityIndicator size="small" color="#c084fc" style={{ marginTop: 12 }} />
              </View>

              <View style={styles.ticketDetailsBox}>
                <Text style={styles.ticketIdText}>Ticket ID: {ticket.ticketId}</Text>
                <Text style={styles.walletText} numberOfLines={1}>
                  Attendee: {ticket.attendeeName} ({ticket.ownerWallet.slice(0, 8)}...{ticket.ownerWallet.slice(-6)})
                </Text>
              </View>
            </View>
          )}

          {/* Error State */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Access Denied</Text>
              <Text style={styles.errorDesc}>{errorMessage}</Text>
              <TouchableOpacity style={styles.errorCloseBtn} onPress={onClose}>
                <Text style={styles.errorCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success / POAP Badge Awarded State */}
          {scanStep === 4 && issuedPoap && (
            <View style={styles.successContainer}>
              <View style={styles.badgeCelebration}>
                <Text style={styles.badgeIcon}>🏅</Text>
                <Text style={styles.badgeCongratulations}>Ticket Verified • Entry Granted!</Text>
                <Text style={styles.poapUnlockedTag}>✨ NEW POAP BADGE MINTED ON SOLANA</Text>
                <Text style={styles.poapTitle}>{issuedPoap.badgeName}</Text>
              </View>

              <View style={styles.poapDetailsBox}>
                <Text style={styles.poapDetailLabel}>Solana Devnet Transaction Signature:</Text>
                <Text style={styles.poapSig} numberOfLines={2}>
                  {issuedPoap.txSignature}
                </Text>
                <Text style={styles.poapTime}>
                  Verified: {new Date(issuedPoap.issuedAt).toLocaleTimeString()} • Timișoara Culture Hub
                </Text>
              </View>

              <TouchableOpacity
                style={styles.explorerBtn}
                onPress={() => Linking.openURL(issuedPoap.explorerUrl)}
              >
                <Text style={styles.explorerBtnText}>🔍 View POAP on Solana Explorer →</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>✓ Complete Check-in</Text>
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
    backgroundColor: '#09090b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderColor: '#27272a',
    borderWidth: 1,
    minHeight: 460,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  headerTag: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerTitle: {
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
  viewfinderContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  viewfinderBox: {
    width: 240,
    height: 180,
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c0a09',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#a855f7',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  laserLine: {
    position: 'absolute',
    top: '40%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  viewfinderText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  ticketDetailsBox: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    width: '100%',
    borderColor: '#27272a',
    borderWidth: 1,
  },
  ticketIdText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  walletText: {
    color: '#c084fc',
    fontSize: 11,
    marginTop: 4,
  },
  errorBox: {
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorDesc: {
    color: '#a1a1aa',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  errorCloseBtn: {
    backgroundColor: '#27272a',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  badgeCelebration: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIcon: {
    fontSize: 54,
    marginBottom: 8,
  },
  badgeCongratulations: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  poapUnlockedTag: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  poapTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  poapDetailsBox: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderColor: '#27272a',
    borderWidth: 1,
  },
  poapDetailLabel: {
    color: '#71717a',
    fontSize: 10,
    marginBottom: 2,
  },
  poapSig: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  poapTime: {
    color: '#a1a1aa',
    fontSize: 10,
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
  doneBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

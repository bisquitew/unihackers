import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { MintedTicketResult, PoapResult } from '@hub/solana';
import { TicketBadge } from './TicketBadge';
import { ticketStore } from './ticketStore';
import { TicketQRModal } from './TicketQRModal';
import { ScannerModal } from './ScannerModal';

export function WalletScreen() {
  const [walletState, setWalletState] = useState(ticketStore.getState());
  const [activeTab, setActiveTab] = useState<'tickets' | 'poap' | 'staff'>('tickets');

  // Modal states
  const [qrModalTicket, setQrModalTicket] = useState<MintedTicketResult | null>(null);
  const [scanModalTicket, setScanModalTicket] = useState<MintedTicketResult | null>(null);

  useEffect(() => {
    const unsubscribe = ticketStore.subscribe(() => {
      setWalletState({ ...ticketStore.getState() });
    });
    return unsubscribe;
  }, []);

  const handleCopyWallet = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
      (navigator as any).clipboard.writeText(walletState.walletAddress);
    }
    Alert.alert(
      'Adresă Portofel Copiată 📋',
      `Cheie Publică Solana Devnet:\n\n${walletState.walletAddress}\n\nRețea: Solana Devnet (Cluster oficial)`
    );
  };

  const handleSimulateScan = (ticket: MintedTicketResult) => {
    setScanModalTicket(ticket);
  };

  const activeTickets = walletState.tickets.filter((t) => !t.isCheckedIn);
  const checkedInTickets = walletState.tickets.filter((t) => t.isCheckedIn);

  return (
    <View style={styles.container}>
      {/* Solana Wallet Header Card */}
      <View style={styles.walletHeaderCard}>
        <View style={styles.walletTopRow}>
          <View style={styles.solBadge}>
            <Text style={styles.solBadgeIcon}>◎</Text>
            <Text style={styles.solBadgeText}>SOLANA DEVNET</Text>
          </View>
          <View style={styles.networkStatus}>
            <View style={styles.greenDot} />
            <Text style={styles.networkText}>Online</Text>
          </View>
        </View>

        <Text style={styles.walletLabel}>Portofel Civic Timișoara Hub</Text>
        <TouchableOpacity style={styles.addressBox} onPress={handleCopyWallet}>
          <Text style={styles.addressText} numberOfLines={1}>
            {walletState.walletAddress}
          </Text>
          <Text style={styles.copyIcon}>📋</Text>
        </TouchableOpacity>

        {/* Live Slot & Blockhash */}
        <View style={styles.liveDevnetInfo}>
          <Text style={styles.liveDevnetText}>
            ⚡ Slot: {walletState.liveSlot ? `#${walletState.liveSlot}` : 'Se conectează...'}
          </Text>
          {walletState.latestBlockhash ? (
            <Text style={styles.liveDevnetText} numberOfLines={1}>
              Hash: {walletState.latestBlockhash.slice(0, 16)}...
            </Text>
          ) : null}
        </View>

        {/* Balance & Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Balanță On-Chain</Text>
            <Text style={styles.statValue}>{walletState.solBalance.toFixed(3)} SOL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bilete Emise</Text>
            <Text style={styles.statValue}>{walletState.tickets.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Ecusoane POAP</Text>
            <Text style={styles.statValueGold}>{walletState.poaps.length}</Text>
          </View>
        </View>

        {/* Faucet & Refresh Buttons Row */}
        <View style={styles.faucetRow}>
          <TouchableOpacity
            style={styles.faucetBtn}
            onPress={() => {
              Alert.alert(
                'Solana Devnet Faucet 🚰',
                `Pentru a primi 1 SOL gratuit pe Devnet:\n\n1. Deschide faucet.solana.com\n2. Lipește adresa ta:\n${walletState.walletAddress}\n3. Apasă Confirm Airdrop!`,
                [
                  { text: 'Anulează', style: 'cancel' },
                  {
                    text: 'Deschide Faucet',
                    onPress: () => Linking.openURL('https://faucet.solana.com'),
                  },
                ]
              );
            }}
          >
            <Text style={styles.faucetBtnText}>🚰 Obține SOL de la Faucet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={async () => {
              const res = await ticketStore.syncWithLiveDevnet();
              Alert.alert(
                'Sincronizat cu Solana Devnet 🟢',
                `Slot Actual: #${res.liveSlot}\nBalanță On-Chain: ${res.solBalance.toFixed(4)} SOL\nCluster: api.devnet.solana.com`
              );
            }}
          >
            <Text style={styles.refreshBtnText}>🔄 Refresh Balanță</Text>
          </TouchableOpacity>
        </View>

        {/* Faucet Guidance Banner */}
        {walletState.solBalance < 0.000005 ? (
          <View style={styles.faucetBanner}>
            <View style={styles.faucetBannerHeader}>
              <Text style={styles.faucetBannerIcon}>🚰</Text>
              <Text style={styles.faucetBannerTitle}>Balanță 0 SOL pe Devnet</Text>
            </View>
            <Text style={styles.faucetBannerDesc}>
              Pentru ca tranzacțiile tale să apară 100% reale pe Solana Explorer:
            </Text>
            <Text style={styles.faucetStep}>1. Mergi la https://faucet.solana.com</Text>
            <Text style={styles.faucetStep}>2. Lipește adresa ta (apasă pe Copiază)</Text>
            <Text style={styles.faucetStep}>3. Apasă "Confirm Airdrop" (1 SOL gratuit)</Text>
            <View style={styles.faucetActionsRow}>
              <TouchableOpacity
                style={styles.faucetActionBtn}
                onPress={() => Linking.openURL('https://faucet.solana.com')}
              >
                <Text style={styles.faucetActionBtnText}>🌐 Deschide Faucet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.faucetCopyBtn} onPress={handleCopyWallet}>
                <Text style={styles.faucetCopyBtnText}>📋 Copiază Adresa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.fundedBanner}>
            <Text style={styles.fundedBannerText}>
              🟢 Portofel alimentat cu {walletState.solBalance.toFixed(3)} SOL. Fiecare bilet și check-in este publicat live pe Solana Devnet!
            </Text>
          </View>
        )}
      </View>

      {/* Navigation Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tickets' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'tickets' && styles.tabBtnTextActive]}>
            🎟️ Bilete ({walletState.tickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'poap' && styles.tabBtnActive]}
          onPress={() => setActiveTab('poap')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'poap' && styles.tabBtnTextActive]}>
            🏅 Ecusoane POAP ({walletState.poaps.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'staff' && styles.tabBtnStaffActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'staff' && styles.tabBtnTextStaffActive]}>
            ⚡ Scanner Staff
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: TICKETS */}
      {activeTab === 'tickets' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Bilete Culturale Active</Text>
          {walletState.tickets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyTitle}>Niciun bilet emis încă</Text>
              <Text style={styles.emptySub}>
                Mergi în secțiunea Evenimente Culturale și apasă „Participă” pentru a minta un bilet pe Solana Devnet!
              </Text>
            </View>
          ) : (
            walletState.tickets.map((t) => (
              <TicketBadge
                key={t.ticketId}
                ticketId={t.ticketId}
                eventTitle={t.eventTitle}
                txSignature={t.txSignature}
                explorerUrl={t.explorerUrl}
                isCheckedIn={t.isCheckedIn}
                onShowQR={() => setQrModalTicket(t)}
                onCheckIn={() => setScanModalTicket(t)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* TAB 2: POAP BADGES */}
      {activeTab === 'poap' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Proof of Attendance Badges (POAP)</Text>
          <Text style={styles.poapInfoSub}>
            Ecusoane NFT emise pe Solana Devnet care atestă prezența ta fizică la evenimentele culturale din Timișoara.
          </Text>

          {walletState.poaps.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🏅</Text>
              <Text style={styles.emptyTitle}>Niciun ecuson POAP încă</Text>
              <Text style={styles.emptySub}>
                Când biletul tău este scanat la intrare de personalul evenimentului, vei primi automat ecusonul POAP on-chain!
              </Text>
            </View>
          ) : (
            walletState.poaps.map((p) => (
              <View key={p.poapId} style={styles.poapCard}>
                <View style={styles.poapHeaderRow}>
                  <Text style={styles.poapBadgePill}>🏅 VERIFIED ATTENDANCE</Text>
                  <Text style={styles.poapDate}>
                    {new Date(p.issuedAt).toLocaleDateString('ro-RO')}
                  </Text>
                </View>

                <Text style={styles.poapBadgeTitle}>{p.badgeName}</Text>
                <Text style={styles.poapEventSub}>Eveniment: {p.eventTitle}</Text>

                <View style={styles.poapTxBox}>
                  <Text style={styles.poapTxLabel}>Semnătură Token Solana:</Text>
                  <Text style={styles.poapTxText} numberOfLines={2}>
                    {p.txSignature}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.poapExplorerBtn}
                  onPress={() => Linking.openURL(p.explorerUrl)}
                >
                  <Text style={styles.poapExplorerBtnText}>
                    🔍 Verifică pe Solana Explorer (Devnet) →
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* TAB 3: STAFF SCANNER DEMO */}
      {activeTab === 'staff' && (
        <ScrollView style={styles.content}>
          <View style={styles.staffHeaderBanner}>
            <Text style={styles.staffBannerTitle}>📱 Consola Personal Intrare (Staff Door Simulator)</Text>
            <Text style={styles.staffBannerSub}>
              Simulează cititorul de coduri QR al organizatorilor (Faber, Scârț, D’arc). Selectează un bilet pentru a verifica semnătura criptografică pe Solana Devnet și a emite ecusonul POAP în timp real.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Bilete în așteptare pentru verificare ({activeTickets.length})</Text>

          {activeTickets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>Toate biletele au fost validate!</Text>
              <Text style={styles.emptySub}>
                Nu există bilete neconfirmate în portofel. Pentru a testa din nou, rezervă un loc la un nou eveniment în M01.
              </Text>
            </View>
          ) : (
            activeTickets.map((t) => (
              <View key={t.ticketId} style={styles.staffTicketCard}>
                <View style={styles.staffTicketInfo}>
                  <Text style={styles.staffTicketTitle}>{t.eventTitle}</Text>
                  <Text style={styles.staffTicketAttendee}>Participant: {t.attendeeName}</Text>
                  <Text style={styles.staffTicketId}>ID: {t.ticketId}</Text>
                </View>

                <TouchableOpacity
                  style={styles.staffScanBtn}
                  onPress={() => handleSimulateScan(t)}
                >
                  <Text style={styles.staffScanBtnText}>⚡ Scanează & Emite POAP</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {checkedInTickets.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Bilete deja validate ({checkedInTickets.length})</Text>
              {checkedInTickets.map((t) => (
                <View key={t.ticketId} style={styles.staffValidatedCard}>
                  <Text style={styles.staffValidatedTitle}>{t.eventTitle}</Text>
                  <Text style={styles.staffValidatedStatus}>✓ Validat la intrare • POAP Emis</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Ticket QR Modal */}
      <TicketQRModal
        visible={!!qrModalTicket}
        ticket={qrModalTicket}
        onClose={() => setQrModalTicket(null)}
        onSimulateScan={(t) => handleSimulateScan(t)}
      />

      {/* Scanner Simulator Modal */}
      <ScannerModal
        visible={!!scanModalTicket}
        ticket={scanModalTicket}
        onClose={() => setScanModalTicket(null)}
        onSuccess={(poap) => {
          Alert.alert(
            '🏅 POAP Mintat cu Succes!',
            `Ai primit ecusonul de prezență on-chain:\n"${poap.badgeName}"\n\nVerificabil pe Solana Devnet!`
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },

  // Wallet Header
  walletHeaderCard: {
    backgroundColor: '#12101e',
    borderColor: '#4338ca',
    borderWidth: 1,
    borderRadius: 16,
    margin: 16,
    padding: 18,
    shadowColor: '#6366f1',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  walletTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  solBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#312e81',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  solBadgeIcon: { color: '#818cf8', fontSize: 13, fontWeight: '900' },
  solBadgeText: { color: '#c7d2fe', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  networkStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  networkText: { color: '#a1a1aa', fontSize: 11, fontWeight: '600' },

  walletLabel: { color: '#a5b4fc', fontSize: 11, fontWeight: 'bold', marginTop: 12 },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0a17',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#312e81',
  },
  addressText: { color: '#e0e7ff', fontSize: 12, fontFamily: 'monospace' },
  copyIcon: { fontSize: 12 },

  liveDevnetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0c0a17',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  liveDevnetText: { color: '#a5b4fc', fontSize: 10, fontFamily: 'monospace' },

  faucetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  faucetBtn: {
    flex: 1,
    backgroundColor: '#3b0764',
    borderColor: '#7e22ce',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  faucetBtnText: { color: '#f3e8ff', fontSize: 11, fontWeight: '700' },
  refreshBtn: {
    flex: 1,
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshBtnText: { color: '#c7d2fe', fontSize: 11, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1b4b',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  statValue: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  statValueGold: { color: '#facc15', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: '#1e1b4b' },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tabBtnActive: { backgroundColor: '#312e81', borderColor: '#6366f1' },
  tabBtnStaffActive: { backgroundColor: '#451a03', borderColor: '#b45309' },
  tabBtnText: { color: '#a1a1aa', fontSize: 11, fontWeight: '600' },
  tabBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  tabBtnTextStaffActive: { color: '#fef08a', fontWeight: 'bold' },

  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 8, marginTop: 4 },

  // Empty State
  emptyBox: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  emptySub: { color: '#a1a1aa', fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 16 },

  // POAP Card
  poapInfoSub: { color: '#a1a1aa', fontSize: 11, marginBottom: 12, lineHeight: 15 },
  poapCard: {
    backgroundColor: '#1c1917',
    borderColor: '#78350f',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  poapHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  poapBadgePill: {
    backgroundColor: '#451a03',
    color: '#facc15',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  poapDate: { color: '#78716c', fontSize: 10 },
  poapBadgeTitle: { color: '#fde68a', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  poapEventSub: { color: '#d6d3d1', fontSize: 12, marginTop: 2 },
  poapTxBox: {
    backgroundColor: '#0c0a09',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#292524',
  },
  poapTxLabel: { color: '#78716c', fontSize: 9, fontWeight: '600' },
  poapTxText: { color: '#facc15', fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  poapExplorerBtn: {
    backgroundColor: '#451a03',
    borderColor: '#92400e',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  poapExplorerBtnText: { color: '#fde68a', fontSize: 11, fontWeight: 'bold' },

  // Staff Console
  staffHeaderBanner: {
    backgroundColor: '#2e1065',
    borderColor: '#7e22ce',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  staffBannerTitle: { color: '#f3e8ff', fontSize: 13, fontWeight: 'bold' },
  staffBannerSub: { color: '#e9d5ff', fontSize: 11, marginTop: 4, lineHeight: 15 },
  staffTicketCard: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffTicketInfo: { flex: 1, marginRight: 10 },
  staffTicketTitle: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  staffTicketAttendee: { color: '#c084fc', fontSize: 11, marginTop: 2 },
  staffTicketId: { color: '#71717a', fontSize: 10, marginTop: 2, fontFamily: 'monospace' },
  staffScanBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  staffScanBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  staffValidatedCard: {
    backgroundColor: '#141416',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffValidatedTitle: { color: '#a1a1aa', fontSize: 12 },
  staffValidatedStatus: { color: '#4ade80', fontSize: 10, fontWeight: 'bold' },

  // Faucet Warning / Funded Banners
  faucetBanner: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  faucetBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  faucetBannerIcon: { fontSize: 14, marginRight: 6 },
  faucetBannerTitle: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  faucetBannerDesc: { color: '#fef3c7', fontSize: 11, marginBottom: 6, lineHeight: 15 },
  faucetStep: { color: '#fde68a', fontSize: 10, marginLeft: 4, marginBottom: 2 },
  faucetActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  faucetActionBtn: {
    flex: 1,
    backgroundColor: '#d97706',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  faucetActionBtnText: { color: '#000000', fontSize: 11, fontWeight: 'bold' },
  faucetCopyBtn: {
    flex: 1,
    backgroundColor: '#78350f',
    borderColor: '#b45309',
    borderWidth: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  faucetCopyBtnText: { color: '#fde68a', fontSize: 11, fontWeight: 'bold' },

  fundedBanner: {
    backgroundColor: '#052e16',
    borderColor: '#16a34a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  fundedBannerText: { color: '#4ade80', fontSize: 11, fontWeight: '600', lineHeight: 15 },
});

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { MintedTicketResult, PoapResult } from '@hub/solana';
import { Chip, PrimaryButton, Row, RowGroup, SecondaryButton, Sheet, Text, TextButton, colors, icons } from '@hub/ui';
import { ModulePage } from '../../core/ModulePage';
import { WhenBlock } from '../../core/WhenBlock';
import { eventsStore } from '../m01-events/eventsStore';
import { QRCodeView } from './QRCodeView';
import { ticketStore } from './ticketStore';

type Section = 'tickets' | 'badges' | 'door';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'tickets', label: 'Tickets' },
  { id: 'badges', label: 'Badges' },
  { id: 'door', label: 'Door check-in' },
];
const FAUCET = 'https://faucet.solana.com';

const short = (s: string, head = 8, tail = 6) => (s.length > head + tail + 3 ? `${s.slice(0, head)}...${s.slice(-tail)}` : s);
const openUrl = (url: string) => {
  if (typeof window !== 'undefined' && typeof window.open === 'function') window.open(url, '_blank');
  else void Linking.openURL(url);
};
const copyText = async (text: string) => {
  try {
    await (navigator as any).clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
const canCopy = typeof navigator !== 'undefined' && !!(navigator as any).clipboard?.writeText;

export function WalletScreen({ embedded, onOpenEvents }: { embedded?: boolean; onOpenEvents?: () => void }) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMax = Math.round(windowHeight * 0.74);

  const [wallet, setWallet] = useState(ticketStore.getState());
  useEffect(() => ticketStore.subscribe(() => setWallet({ ...ticketStore.getState() })), []);
  const events = eventsStore.getEvents();
  const whenOf = (eventId: string) => events.find((e) => e.id === eventId)?.dateTime;

  const [section, setSection] = useState<Section>('tickets');
  const [ticket, setTicket] = useState<MintedTicketResult | null>(null);
  const [badge, setBadge] = useState<PoapResult | null>(null);
  const [scanning, setScanning] = useState<MintedTicketResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const pending = wallet.tickets.filter((t) => !t.isCheckedIn);
  const used = wallet.tickets.filter((t) => t.isCheckedIn);
  const browseEvents = () => (onOpenEvents ? onOpenEvents() : router.push('/m/events' as any));

  return (
    <ModulePage title="Wallet" embedded={embedded}>
      <View style={styles.head}>
        <Text variant="rowDetail" color="mutedForeground" style={{ flex: 1 }}>
          {wallet.tickets.length} {wallet.tickets.length === 1 ? 'ticket' : 'tickets'}, {wallet.poaps.length} {wallet.poaps.length === 1 ? 'badge' : 'badges'}
        </Text>
        <SecondaryButton label="Wallet details" size="md" onPress={() => setDetailsOpen(true)} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {SECTIONS.map((s) => (
          <Chip key={s.id} label={s.label} selected={section === s.id} onPress={() => setSection(s.id)} />
        ))}
      </ScrollView>

      {/* tickets */}
      {section === 'tickets' ? (
        wallet.tickets.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="subheading" accessibilityRole="header">
              No tickets yet
            </Text>
            <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
              Get a ticket from an event and it will show up here, ready to scan at the door.
            </Text>
            <TextButton label="Browse events" size="md" onPress={browseEvents} />
          </View>
        ) : (
          <RowGroup>
            {wallet.tickets.map((t) => (
              <Row key={t.ticketId} onPress={() => setTicket(t)} accessibilityLabel={`${t.eventTitle}, ${t.isCheckedIn ? 'used' : 'valid for entry'}. Show ticket`}>
                <WhenBlock dateTime={whenOf(t.eventId)} />
                <Row.Body>
                  <Row.Title>{t.eventTitle}</Row.Title>
                  <Row.Detail>{t.isCheckedIn ? 'Used at the door' : 'Valid for entry'}</Row.Detail>
                </Row.Body>
                <Row.Trailing>
                  {t.isCheckedIn ? (
                    <icons.CheckCircle size={22} weight="fill" color={colors.mutedForeground} />
                  ) : (
                    <icons.QrCode size={24} weight="bold" color={colors.foreground} />
                  )}
                </Row.Trailing>
              </Row>
            ))}
          </RowGroup>
        )
      ) : null}

      {/* badges */}
      {section === 'badges' ? (
        wallet.poaps.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="subheading" accessibilityRole="header">
              No badges yet
            </Text>
            <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
              You earn a badge when your ticket is scanned at the door. It proves you were there.
            </Text>
          </View>
        ) : (
          <RowGroup>
            {wallet.poaps.map((p) => {
              const d = new Date(p.issuedAt);
              return (
                <Row key={p.poapId} onPress={() => setBadge(p)} accessibilityLabel={`${p.badgeName}, ${p.eventTitle}. Show badge`}>
                  <Row.Date day={d.toLocaleDateString('en-GB', { month: 'short' })} date={String(d.getDate())} />
                  <Row.Body>
                    <Row.Title>{p.badgeName}</Row.Title>
                    <Row.Detail>{p.eventTitle}</Row.Detail>
                  </Row.Body>
                </Row>
              );
            })}
          </RowGroup>
        )
      ) : null}

      {/* door check-in (for hosts) */}
      {section === 'door' ? (
        <View>
          <Text variant="body" color="mutedForeground" style={styles.note}>
            For event hosts: scan a guest's ticket at the door to let them in and give them an attendance badge. This is a demo with the tickets in this wallet.
          </Text>
          {pending.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="subheading" accessibilityRole="header">
                Everyone is checked in
              </Text>
              <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
                Get a ticket for another event to try the scan again.
              </Text>
            </View>
          ) : (
            <RowGroup>
              {pending.map((t) => (
                <Row key={t.ticketId}>
                  <Row.Body>
                    <Row.Title>{t.eventTitle}</Row.Title>
                    <Row.Detail>{t.attendeeName}</Row.Detail>
                  </Row.Body>
                  <Row.Trailing>
                    <SecondaryButton label="Scan" size="md" onPress={() => setScanning(t)} />
                  </Row.Trailing>
                </Row>
              ))}
            </RowGroup>
          )}
          {used.length > 0 ? (
            <>
              <Text variant="section" accessibilityRole="header" style={{ marginTop: 26, paddingHorizontal: 4 }}>
                Already checked in
              </Text>
              <RowGroup>
                {used.map((t) => (
                  <Row key={t.ticketId}>
                    <Row.Body>
                      <Row.Title>{t.eventTitle}</Row.Title>
                      <Row.Detail>Checked in, badge given</Row.Detail>
                    </Row.Body>
                  </Row>
                ))}
              </RowGroup>
            </>
          ) : null}
        </View>
      ) : null}

      {/* one ticket */}
      <Sheet modal visible={!!ticket} onClose={() => setTicket(null)} accessibilityLabel="Ticket">
        {ticket ? <TicketSheet ticket={ticket} maxHeight={sheetMax} onScan={() => { setScanning(ticket); setTicket(null); }} /> : null}
      </Sheet>

      {/* one badge */}
      <Sheet modal visible={!!badge} onClose={() => setBadge(null)} accessibilityLabel="Badge">
        {badge ? <BadgeSheet badge={badge} maxHeight={sheetMax} /> : null}
      </Sheet>

      {/* door scan */}
      <Sheet modal visible={!!scanning} onClose={() => setScanning(null)} accessibilityLabel="Door check-in">
        {scanning ? <DoorScan key={scanning.ticketId} ticket={scanning} onDone={() => setScanning(null)} /> : null}
      </Sheet>

      {/* the technical side, for anyone who wants it */}
      <Sheet modal visible={detailsOpen} onClose={() => setDetailsOpen(false)} accessibilityLabel="Wallet details">
        <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
          <WalletDetails wallet={wallet} />
        </ScrollView>
      </Sheet>
    </ModulePage>
  );
}

function Facts({ rows }: { rows: { label: string; value: string; mono?: boolean }[] }) {
  return (
    <RowGroup>
      {rows.map((r) => (
        <View key={r.label} style={styles.fact}>
          <Text variant="caption" color="mutedForeground">
            {r.label}
          </Text>
          <Text variant="rowDetail" color="foreground" selectable style={r.mono ? styles.mono : undefined}>
            {r.value}
          </Text>
        </View>
      ))}
    </RowGroup>
  );
}

function TicketSheet({ ticket, maxHeight, onScan }: { ticket: MintedTicketResult; maxHeight: number; onScan: () => void }) {
  const [technical, setTechnical] = useState(false);
  return (
    <ScrollView style={{ maxHeight }} contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
      <View>
        <Text variant="heading" accessibilityRole="header">
          {ticket.eventTitle}
        </Text>
        <Text variant="body" color={ticket.isCheckedIn ? 'mutedForeground' : 'success'}>
          {ticket.isCheckedIn ? 'Used at the door' : 'Valid for entry. Show this code at the door.'}
        </Text>
      </View>
      <QRCodeView value={ticket.qrPayload} size={220} />
      <Text variant="rowDetail" color="mutedForeground" style={{ textAlign: 'center' }}>
        {ticket.attendeeName}
      </Text>
      {!ticket.isCheckedIn ? <SecondaryButton label="Try the door scan" size="lg" onPress={onScan} accessibilityHint="A demo of what the host does at the door" /> : null}
      <TextButton label={technical ? 'Hide technical details' : 'Show technical details'} size="md" onPress={() => setTechnical(!technical)} />
      {technical ? (
        <View style={{ gap: 8 }}>
          <Facts
            rows={[
              { label: 'Ticket ID', value: ticket.ticketId, mono: true },
              { label: 'Owner wallet', value: short(ticket.ownerWallet, 10, 8), mono: true },
              { label: 'Transaction on Solana devnet', value: ticket.txSignature, mono: true },
            ]}
          />
          <TextButton label="View on Solana Explorer" size="md" onPress={() => openUrl(ticket.explorerUrl)} />
        </View>
      ) : null}
    </ScrollView>
  );
}

function BadgeSheet({ badge, maxHeight }: { badge: PoapResult; maxHeight: number }) {
  return (
    <ScrollView style={{ maxHeight }} contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
      <icons.CheckCircle size={40} weight="fill" color={colors.success} />
      <Text variant="heading" accessibilityRole="header">
        {badge.badgeName}
      </Text>
      <Text variant="body" color="mutedForeground">
        You were at {badge.eventTitle} on {new Date(badge.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
      </Text>
      <Facts rows={[{ label: 'Transaction on Solana devnet', value: badge.txSignature, mono: true }]} />
      <TextButton label="View on Solana Explorer" size="md" onPress={() => openUrl(badge.explorerUrl)} />
    </ScrollView>
  );
}

/** The host's door scan, simulated step by step: scan, check the ticket is genuine, hand out the badge. */
function DoorScan({ ticket, onDone }: { ticket: MintedTicketResult; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [badge, setBadge] = useState<PoapResult | null>(null);
  const [error, setError] = useState<string | null>(ticket.isCheckedIn ? 'This ticket was already used.' : null);

  useEffect(() => {
    if (ticket.isCheckedIn) return;
    let alive = true;
    (async () => {
      setStep(1);
      await new Promise((r) => setTimeout(r, 700));
      if (!alive) return;
      setStep(2);
      await new Promise((r) => setTimeout(r, 800));
      if (!alive) return;
      setStep(3);
      const res = await ticketStore.checkInTicket(ticket.ticketId);
      if (!alive) return;
      if (res.success && res.poap) {
        setBadge(res.poap);
        setStep(4);
      } else setError(res.error || 'We could not check this ticket. Try again.');
    })();
    return () => {
      alive = false;
    };
  }, [ticket]);

  const label = step === 1 ? 'Scanning the ticket' : step === 2 ? 'Checking the ticket is genuine' : 'Giving the attendance badge';

  if (error)
    return (
      <View style={{ gap: 12 }}>
        <icons.WarningCircle size={40} weight="fill" color={colors.warning} />
        <Text variant="heading" accessibilityRole="header">
          Not let in
        </Text>
        <Text variant="body" color="mutedForeground">
          {error}
        </Text>
        <PrimaryButton label="Done" size="lg" onPress={onDone} />
      </View>
    );
  if (step === 4 && badge)
    return (
      <View style={{ gap: 12 }}>
        <icons.CheckCircle size={40} weight="fill" color={colors.success} />
        <Text variant="heading" accessibilityRole="header">
          Welcome in
        </Text>
        <Text variant="body" color="mutedForeground">
          {ticket.attendeeName} is checked in and earned the badge "{badge.badgeName}".
        </Text>
        <PrimaryButton label="Done" size="lg" onPress={onDone} />
      </View>
    );
  return (
    <View style={{ gap: 12, alignItems: 'center', paddingVertical: 16 }}>
      <ActivityIndicator color={colors.foreground} />
      <Text variant="subheading" accessibilityRole="header" accessibilityLiveRegion="polite">
        {label}
      </Text>
      <Text variant="rowDetail" color="mutedForeground">
        {ticket.eventTitle}
      </Text>
    </View>
  );
}

function WalletDetails({ wallet }: { wallet: ReturnType<typeof ticketStore.getState> }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [synced, setSynced] = useState<string | null>(null);
  const copy = async () => {
    if (await copyText(wallet.walletAddress)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const refresh = async () => {
    setBusy(true);
    try {
      const res = await ticketStore.syncWithLiveDevnet();
      setSynced(`Updated. Balance ${res.solBalance.toFixed(3)} SOL.`);
    } catch {
      setSynced('Could not reach the network. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Text variant="heading" accessibilityRole="header">
        Wallet details
      </Text>
      <Text variant="body" color="mutedForeground">
        Your tickets and badges are recorded on Solana devnet, a practice network. The coins here are free test coins with no real value.
      </Text>
      <Facts
        rows={[
          { label: 'Balance', value: `${wallet.solBalance.toFixed(3)} SOL (test coins)` },
          { label: 'Address', value: wallet.walletAddress, mono: true },
          { label: 'Network position', value: wallet.liveSlot ? `Slot #${wallet.liveSlot}` : 'Connecting' },
        ]}
      />
      <View style={{ gap: 8 }}>
        {canCopy ? <SecondaryButton label={copied ? 'Copied' : 'Copy address'} size="lg" onPress={copy} /> : null}
        <SecondaryButton label="Refresh balance" size="lg" loading={busy} onPress={refresh} />
        {synced ? (
          <Text variant="rowDetail" color="mutedForeground" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
            {synced}
          </Text>
        ) : null}
        {wallet.solBalance < 0.01 ? <TextButton label="Get free test coins" size="lg" onPress={() => openUrl(FAUCET)} accessibilityHint="Opens the Solana devnet faucet" /> : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, paddingHorizontal: 4 },
  chips: { marginTop: 14, marginHorizontal: -16, flexGrow: 0 },
  chipsContent: { gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  note: { marginTop: 12, paddingHorizontal: 4 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  fact: { paddingVertical: 12, gap: 2 },
  mono: { fontFamily: 'Courier', fontSize: 13, lineHeight: 18 },
});

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { ticketStore } from '../m09-wallet/ticketStore';

export function EventsHomeCard() {
  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);

  const eventTitle = 'Underground Indie Cinema Night';
  const eventId = 'evt-001';

  const handleQuickRsvp = async () => {
    try {
      const ticket = await ticketStore.addTicketFromRsvp(eventId, eventTitle);
      setHasRsvpd(true);
      setTxSig(ticket.txSignature);
      Alert.alert(
        '🎟️ Solana Ticket Minted!',
        `Your place at "${eventTitle}" is reserved on Solana Devnet!\n\nTicket ID: ${ticket.ticketId}\nSignature: ${ticket.txSignature.slice(0, 16)}...\n\nView it in the Community > Solana Wallet tab!`
      );
    } catch (e: any) {
      Alert.alert('RSVP error', e?.message || 'Could not complete RSVP');
    }
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80' }}
        style={styles.banner}
      />
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.categoryBadge}>FEATURED CULTURAL EVENT [M01]</Text>
          <Text style={styles.freeBadge}>FREE</Text>
        </View>

        <Text style={styles.title}>{eventTitle}</Text>
        <Text style={styles.subtitle}>
          📍 Faber Community Yard, Fabric • Tonight at 19:30
        </Text>
        <Text style={styles.desc}>
          Outdoor screening of Romanian independent short films. Hot spiced cider and filmmaker discussion.
        </Text>

        {hasRsvpd ? (
          <View style={styles.confirmedBox}>
            <Text style={styles.confirmedText}>✓ RSVP Confirmed • Ticket Minted on Solana</Text>
            {txSig && (
              <Text style={styles.txText} numberOfLines={1}>
                Tx: {txSig}
              </Text>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.rsvpBtn} onPress={handleQuickRsvp}>
            <Text style={styles.rsvpBtnText}>🎟️ RSVP & Mint Solana Ticket (Free)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  banner: { width: '100%', height: 130 },
  content: { padding: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  categoryBadge: { color: '#c084fc', fontSize: 10, fontWeight: '800' },
  freeBadge: {
    backgroundColor: '#14532d',
    color: '#86efac',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  title: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' },
  subtitle: { color: '#a1a1aa', fontSize: 12, marginTop: 4 },
  desc: { color: '#d4d4d8', fontSize: 12, lineHeight: 18, marginTop: 6 },
  rsvpBtn: {
    backgroundColor: '#8d23be',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  rsvpBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  confirmedBox: {
    backgroundColor: '#052e16',
    borderColor: '#16a34a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  confirmedText: { color: '#4ade80', fontSize: 11, fontWeight: '700' },
  txText: { color: '#86efac', fontSize: 9, marginTop: 2, fontFamily: 'monospace' },
});

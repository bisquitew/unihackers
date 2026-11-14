import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

export interface EventCardProps {
  id: string;
  title: string;
  category: string;
  locationName: string;
  neighbourhood: string;
  dateTime: string;
  description: string;
  attendeeCount: number;
  isFree: boolean;
  priceAmount?: number;
  imageUrl?: string;
  onRsvp: (eventId: string) => void;
  onFindBuddy: (eventId: string, eventTitle: string) => void;
  hasRsvpd?: boolean;
  solanaTx?: string;
}

export function EventCard({
  id,
  title,
  category,
  locationName,
  neighbourhood,
  dateTime,
  description,
  attendeeCount,
  isFree,
  priceAmount,
  imageUrl,
  onRsvp,
  onFindBuddy,
  hasRsvpd,
  solanaTx,
}: EventCardProps) {
  return (
    <View style={styles.card}>
      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.banner} />}

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.categoryBadge}>{category.toUpperCase()}</Text>
          <Text style={styles.neighbourhoodBadge}>📍 {neighbourhood}</Text>
          <Text style={styles.priceBadge}>{isFree ? 'FREE' : `${priceAmount} RON`}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.timeLocation}>🕒 {new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {locationName}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.attendeeRow}>
          <Text style={styles.attendees}>👥 {attendeeCount} confirmed attendees</Text>
        </View>

        {hasRsvpd && (
          <View style={styles.solanaBadge}>
            <Text style={styles.solanaBadgeText}>✓ Ticket Minted on Solana Devnet</Text>
            {solanaTx && (
              <Text style={styles.solanaTxText} numberOfLines={1}>Tx: {solanaTx}</Text>
            )}
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.rsvpBtn, hasRsvpd && styles.rsvpBtnActive]}
            onPress={() => onRsvp(id)}
            disabled={hasRsvpd}
          >
            <Text style={styles.rsvpBtnText}>{hasRsvpd ? '✓ Ticket Confirmed' : '🎟️ RSVP & Mint Ticket'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buddyBtn}
            onPress={() => onFindBuddy(id, title)}
          >
            <Text style={styles.buddyBtnText}>🤝 Find Buddy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  banner: { width: '100%', height: 140 },
  body: { padding: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryBadge: {
    backgroundColor: '#3b0764',
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  neighbourhoodBadge: { color: '#a1a1aa', fontSize: 11, fontWeight: '500' },
  priceBadge: {
    marginLeft: 'auto',
    backgroundColor: '#14532d',
    color: '#86efac',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  title: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' },
  timeLocation: { color: '#c084fc', fontSize: 12, marginTop: 4, fontWeight: '500' },
  description: { color: '#d4d4d8', fontSize: 13, marginTop: 6, lineHeight: 18 },
  attendeeRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  attendees: { color: '#a1a1aa', fontSize: 12 },
  solanaBadge: {
    backgroundColor: '#1e1b4b',
    borderColor: '#6366f1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  solanaBadgeText: { color: '#a5b4fc', fontSize: 11, fontWeight: 'bold' },
  solanaTxText: { color: '#818cf8', fontSize: 10, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rsvpBtn: {
    flex: 1.2,
    backgroundColor: '#8d23be',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rsvpBtnActive: { backgroundColor: '#22c55e' },
  rsvpBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  buddyBtn: {
    flex: 0.8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buddyBtnText: { color: '#f4f4f5', fontSize: 12, fontWeight: '600' },
});

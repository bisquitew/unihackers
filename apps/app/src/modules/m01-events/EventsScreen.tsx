import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { EventCard } from './EventCard';

interface EventItem {
  id: string;
  title: string;
  category: 'cinema' | 'music' | 'workshop' | 'showcase' | 'social';
  locationName: string;
  neighbourhood: string;
  dateTime: string;
  description: string;
  attendeeCount: number;
  isFree: boolean;
  priceAmount?: number;
  imageUrl?: string;
}

const SEED_EVENTS: EventItem[] = [
  {
    id: 'evt-001',
    title: 'Underground Indie Cinema Night',
    category: 'cinema',
    locationName: 'Faber Community Yard',
    neighbourhood: 'Fabric',
    dateTime: '2026-11-13T19:30:00Z',
    description: 'Outdoor screening of Romanian independent short films. Hot spiced cider and discussion with filmmakers.',
    attendeeCount: 38,
    isFree: true,
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
  },
  {
    id: 'evt-002',
    title: 'Beginner Pottery & Clay Jam',
    category: 'workshop',
    locationName: 'Scârț Loc Lejer',
    neighbourhood: 'Elisabetin',
    dateTime: '2026-11-14T15:00:00Z',
    description: 'Casual pottery and clay shaping workshop designed for students and newcomers. All materials included.',
    attendeeCount: 16,
    isFree: false,
    priceAmount: 25,
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80',
  },
  {
    id: 'evt-003',
    title: 'Sunset Acoustic & Jazz Session',
    category: 'music',
    locationName: 'D’arc pe Mal',
    neighbourhood: 'Iosefin',
    dateTime: '2026-11-14T18:00:00Z',
    description: 'Local student musicians playing acoustic indie and jazz standards right on the deck along the Bega canal.',
    attendeeCount: 45,
    isFree: true,
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=80',
  },
];

interface EventsScreenProps {
  onSelectBuddyForEvent?: (eventId: string, eventTitle: string) => void;
}

export function EventsScreen({ onSelectBuddyForEvent }: EventsScreenProps) {
  const [events, setEvents] = useState<EventItem[]>(SEED_EVENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [rsvps, setRsvps] = useState<{ [id: string]: { hasRsvpd: boolean; tx?: string } }>({});

  const filtered = events.filter(
    (e) => selectedCategory === 'all' || e.category === selectedCategory
  );

  const handleRsvp = (eventId: string) => {
    // Generate simulated Solana devnet tx
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let sig = '';
    for (let i = 0; i < 88; i++) sig += chars.charAt(Math.floor(Math.random() * chars.length));

    setRsvps((prev) => ({
      ...prev,
      [eventId]: { hasRsvpd: true, tx: sig },
    }));

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, attendeeCount: e.attendeeCount + 1 } : e))
    );

    Alert.alert(
      '🎉 Bilet Emis cu Succes!',
      `Locul tău a fost rezervat!\n\nBiletul tău de intrare a fost mintat pe Solana Devnet.\nTx: ${sig.slice(0, 24)}...`
    );
  };

  const handleFindBuddy = (eventId: string, eventTitle: string) => {
    if (onSelectBuddyForEvent) {
      onSelectBuddyForEvent(eventId, eventTitle);
    } else {
      Alert.alert('Cu Cine?', `Căutăm parteneri pentru ${eventTitle}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Micro-Evenimente Culturale</Text>
        <Text style={styles.headerSub}>Timișoara Cultural Hub [M01]</Text>
      </View>

      {/* Categories */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'all', label: 'Toate' },
            { id: 'cinema', label: '🎬 Cinema & Film' },
            { id: 'music', label: '🎵 Muzică & Jazz' },
            { id: 'workshop', label: '🎨 Workshop & Artă' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {filtered.map((item) => (
          <EventCard
            key={item.id}
            id={item.id}
            title={item.title}
            category={item.category}
            locationName={item.locationName}
            neighbourhood={item.neighbourhood}
            dateTime={item.dateTime}
            description={item.description}
            attendeeCount={item.attendeeCount}
            isFree={item.isFree}
            priceAmount={item.priceAmount}
            imageUrl={item.imageUrl}
            onRsvp={handleRsvp}
            onFindBuddy={handleFindBuddy}
            hasRsvpd={rsvps[item.id]?.hasRsvpd}
            solanaTx={rsvps[item.id]?.tx}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#a1a1aa', fontSize: 11, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12 },
  categoryChip: {
    backgroundColor: '#18181b',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  categoryChipActive: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  categoryChipText: { color: '#a1a1aa', fontSize: 12, fontWeight: '500' },
  categoryChipTextActive: { color: '#ffffff', fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 16 },
});

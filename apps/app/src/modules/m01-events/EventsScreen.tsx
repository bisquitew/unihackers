import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { EventCard } from './EventCard';
import { ticketStore } from '../m09-wallet/ticketStore';
import { eventsStore, EventItem } from './eventsStore';
import { useAuth } from '../../core/auth';

interface EventsScreenProps {
  onSelectBuddyForEvent?: (eventId: string, eventTitle: string) => void;
}

export function EventsScreen({ onSelectBuddyForEvent }: EventsScreenProps) {
  const { isLoggedIn, loginAsResident } = useAuth();
  const isGuestWeb = Platform.OS === 'web' && !isLoggedIn;

  const [events, setEvents] = useState<EventItem[]>(eventsStore.getEvents());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [rsvps, setRsvps] = useState<{ [id: string]: { hasRsvpd: boolean; tx?: string } }>({});
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    const unsub = eventsStore.subscribe(() => {
      setEvents(eventsStore.getEvents());
    });
    return unsub;
  }, []);

  // Create event form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'cinema' | 'music' | 'workshop' | 'showcase'>('cinema');
  const [newNeighbourhood, setNewNeighbourhood] = useState('Fabric');
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsFree, setNewIsFree] = useState(true);
  const [newPrice, setNewPrice] = useState('');

  const filtered = events.filter((e) => {
    const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchArea = selectedArea === 'all' || e.neighbourhood.toLowerCase() === selectedArea.toLowerCase();
    const matchAge = selectedAge === 'all' || e.ageGroup === selectedAge || e.ageGroup === 'all';
    return matchCat && matchArea && matchAge;
  });

  const displayedEvents = isGuestWeb ? filtered.slice(0, 3) : filtered;

  const isEventRsvpd = (eventId: string) => {
    return Boolean(
      rsvps[eventId]?.hasRsvpd ||
      ticketStore.getState().tickets.some((t) => t.eventId === eventId)
    );
  };

  const getEventSolanaTx = (eventId: string) => {
    if (rsvps[eventId]?.tx) return rsvps[eventId].tx;
    const t = ticketStore.getState().tickets.find((t) => t.eventId === eventId);
    return t?.txSignature;
  };

  const handleRsvp = async (eventId: string) => {
    if (isGuestWeb) {
      Alert.alert(
        'Autentificare Necesară',
        'Pentru a rezerva un bilet pe blockchain Solana și a primi un POAP, te rugăm să te conectezi ca Cetățean.',
        [
          { text: 'Anulează', style: 'cancel' },
          { text: 'Conectare Cetățean', onPress: () => loginAsResident() }
        ]
      );
      return;
    }

    if (isEventRsvpd(eventId)) {
      Alert.alert(
        'Already Reserved 🎟️',
        'You already hold an active Solana Devnet ticket for this event!\n\nOpen the Wallet tab to view your ticket and entry QR code.'
      );
      return;
    }

    const targetEvent = events.find((e) => e.id === eventId);
    const eventTitle = targetEvent ? targetEvent.title : 'Timișoara Cultural Event';
    const newTicket = await ticketStore.addTicketFromRsvp(eventId, eventTitle);
    eventsStore.rsvpEvent(eventId);

    setRsvps((prev) => ({
      ...prev,
      [eventId]: { hasRsvpd: true, tx: newTicket.txSignature },
    }));

    Alert.alert(
      '🎉 Ticket Minted on Solana Devnet!',
      `Your spot has been secured!\n\nTicket ID: ${newTicket.ticketId}\nTx: ${newTicket.txSignature.slice(0, 20)}...\n\nYour ticket and QR code are now active in your Solana Wallet [M09]!`
    );
  };

  const handleFindBuddy = (eventId: string, eventTitle: string) => {
    if (onSelectBuddyForEvent) {
      onSelectBuddyForEvent(eventId, eventTitle);
    } else {
      Alert.alert('Event Buddy Finder', `Searching for event companions for: ${eventTitle}`);
    }
  };

  const handleCreateEvent = () => {
    if (!newTitle.trim() || !newLocation.trim()) {
      Alert.alert('Required Fields', 'Please enter event title and venue name.');
      return;
    }

    const created = eventsStore.createEvent({
      title: newTitle.trim(),
      category: newCategory,
      locationName: newLocation.trim(),
      neighbourhood: newNeighbourhood,
      dateTime: 'Upcoming',
      description: newDesc.trim() || 'Join us for this community cultural gathering!',
      isFree: newIsFree,
      priceAmount: newIsFree ? undefined : parseInt(newPrice || '15', 10),
      ageGroup: 'all',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    });

    setCreateModalVisible(false);
    setNewTitle('');
    setNewLocation('');
    setNewDesc('');
    setNewPrice('');
    Alert.alert('Event Published 🎉', `"${created.title}" is now published and open for Solana RSVP!`);
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cultural Micro-Events</Text>
          <Text style={styles.headerSub}>Timișoara Cultural Hub [M01]</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.createBtnText}>+ Create Event</Text>
        </TouchableOpacity>
      </View>

      {/* Multi-Dimension Filters */}
      <View style={styles.filterSection}>
        {/* Category Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { id: 'all', label: 'All Types' },
            { id: 'cinema', label: '🎬 Cinema & Film' },
            { id: 'music', label: '🎵 Music & Jazz' },
            { id: 'workshop', label: '🎨 Workshops & Art' },
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

        {/* Neighbourhood / Area Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterRow, { marginTop: 6 }]}>
          {[
            { id: 'all', label: '📍 All Areas' },
            { id: 'Fabric', label: 'Fabric' },
            { id: 'Cetate', label: 'Cetate' },
            { id: 'Iosefin', label: 'Iosefin' },
            { id: 'Elisabetin', label: 'Elisabetin' },
          ].map((area) => (
            <TouchableOpacity
              key={area.id}
              style={[
                styles.areaChip,
                selectedArea === area.id && styles.areaChipActive,
              ]}
              onPress={() => setSelectedArea(area.id)}
            >
              <Text
                style={[
                  styles.areaChipText,
                  selectedArea === area.id && styles.areaChipTextActive,
                ]}
              >
                {area.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* View Switcher: List vs Map Layer */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 }}>
        <TouchableOpacity
          style={[
            styles.viewSwitchBtn,
            viewMode === 'list' && styles.viewSwitchBtnActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text
            style={[
              styles.viewSwitchText,
              viewMode === 'list' && styles.viewSwitchTextActive,
            ]}
          >
            📋 List View ({filtered.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewSwitchBtn,
            viewMode === 'map' && styles.viewSwitchBtnActive,
          ]}
          onPress={() => setViewMode('map')}
        >
          <Text
            style={[
              styles.viewSwitchText,
              viewMode === 'map' && styles.viewSwitchTextActive,
            ]}
          >
            🗺️ Map Layer View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Layer View */}
      {viewMode === 'map' && (
        <ScrollView style={styles.content}>
          <View style={styles.mapBanner}>
            <Text style={styles.mapBannerTitle}>🗺️ Timișoara Cultural Venue Map Layer</Text>
            <Text style={styles.mapBannerSub}>
              Active micro-events pinned across Fabric, Cetate, Elisabetin and Iosefin.
            </Text>
          </View>

          {[
            {
              id: 'evt-001',
              title: 'Underground Indie Cinema Night',
              venue: 'Faber Community Yard',
              coords: '45.7562° N, 21.2486° E',
              area: 'Fabric',
              time: 'Tonight, 19:30',
              status: 'Open for RSVP',
            },
            {
              id: 'evt-002',
              title: 'Beginner Pottery & Clay Jam',
              venue: 'Scârț Loc Lejer',
              coords: '45.7412° N, 21.2261° E',
              area: 'Elisabetin',
              time: 'Tomorrow, 15:00',
              status: '25 RON',
            },
            {
              id: 'evt-003',
              title: 'Sunset Acoustic & Jazz Session',
              venue: 'D’arc pe Mal',
              coords: '45.7489° N, 21.2184° E',
              area: 'Iosefin (Bega Canal)',
              time: 'Tomorrow, 18:00',
              status: 'Free Entry',
            },
          ].map((pin) => (
            <View key={pin.id} style={styles.mapCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.mapPinIcon}>📍 {pin.venue}</Text>
                <Text style={styles.mapCoordsText}>{pin.coords}</Text>
              </View>
              <Text style={styles.mapPinTitle}>{pin.title}</Text>
              <Text style={styles.mapPinMeta}>🕒 {pin.time} • Area: {pin.area}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.mapActionBtn, { backgroundColor: '#8d23be' }]}
                  onPress={() => handleRsvp(pin.id)}
                >
                  <Text style={styles.mapActionBtnText}>🎟️ RSVP Ticket</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mapActionBtn, { backgroundColor: '#27272a' }]}
                  onPress={() => handleFindBuddy(pin.id, pin.title)}
                >
                  <Text style={[styles.mapActionBtnText, { color: '#f4f4f5' }]}>🤝 Find Buddy</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Events List */}
      {viewMode === 'list' && (
      <ScrollView style={styles.content}>
        {isGuestWeb && (
          <View style={styles.guestBanner}>
            <View style={styles.guestBannerHeader}>
              <Text style={styles.guestBannerTitle}>👀 Mod Vizitator Web</Text>
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>{displayedEvents.length} DIN {filtered.length} EVENIMENTE</Text>
              </View>
            </View>
            <Text style={styles.guestBannerText}>
              Afișezi o previzualizare limitată de evenimente din Timișoara. Conectează-te ca Cetățean pentru a vedea lista completă, a rezerva bilete pe Solana și a găsi parteneri de eveniment.
            </Text>
            <TouchableOpacity
              style={styles.guestBannerBtn}
              activeOpacity={0.8}
              onPress={() => loginAsResident()}
            >
              <Text style={styles.guestBannerBtnText}>👤 Conectare ca Cetățean (Standard) →</Text>
            </TouchableOpacity>
          </View>
        )}

        {displayedEvents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🎭</Text>
            <Text style={styles.emptyTitle}>No events match current filters</Text>
            <Text style={styles.emptySub}>Try selecting "All Types" or "All Areas" to see all events.</Text>
          </View>
        ) : (
          displayedEvents.map((item) => (
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
              hasRsvpd={isEventRsvpd(item.id)}
              solanaTx={getEventSolanaTx(item.id)}
            />
          ))
        )}
      </ScrollView>
      )}

      {/* Create Event Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Host a Cultural Micro-Event</Text>
            <Text style={styles.modalSub}>
              Publish an event in Timișoara with on-chain Solana ticket minting.
            </Text>

            <Text style={styles.inputLabel}>Event Title</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="E.g. Acoustic Canal Jam"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>Venue & Location Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newLocation}
              onChangeText={setNewLocation}
              placeholder="E.g. Scârț Loc Lejer or Faber Yard"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>Neighbourhood Area</Text>
            <View style={styles.catOptionRow}>
              {['Fabric', 'Cetate', 'Iosefin', 'Elisabetin'].map((area) => (
                <TouchableOpacity
                  key={area}
                  style={[
                    styles.catOption,
                    newNeighbourhood === area && styles.catOptionActive,
                  ]}
                  onPress={() => setNewNeighbourhood(area)}
                >
                  <Text style={styles.catOptionText}>{area}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              multiline
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="What will happen at this gathering?"
              placeholderTextColor="#71717a"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handleCreateEvent}
              >
                <Text style={styles.publishBtnText}>Publish Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#a1a1aa', fontSize: 11, marginTop: 2 },
  createBtn: {
    backgroundColor: '#8d23be',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  filterSection: { paddingVertical: 10 },
  filterRow: { paddingHorizontal: 16 },
  categoryChip: {
    backgroundColor: '#18181b',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  categoryChipActive: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  categoryChipText: { color: '#a1a1aa', fontSize: 11, fontWeight: '500' },
  categoryChipTextActive: { color: '#ffffff', fontWeight: 'bold' },
  areaChip: {
    backgroundColor: '#18181b',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  areaChipActive: { backgroundColor: '#3b0764', borderColor: '#7e22ce' },
  areaChipText: { color: '#71717a', fontSize: 10, fontWeight: '600' },
  areaChipTextActive: { color: '#c084fc', fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  emptySub: { color: '#71717a', fontSize: 12, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalTitle: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' },
  modalSub: { color: '#a1a1aa', fontSize: 11, marginTop: 2, marginBottom: 12 },
  inputLabel: { color: '#d4d4d8', fontSize: 11, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#ffffff',
    fontSize: 12,
  },
  catOptionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  catOption: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  catOptionActive: { backgroundColor: '#8d23be', borderColor: '#a855f7' },
  catOptionText: { color: '#ffffff', fontSize: 10, fontWeight: '600' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  cancelBtnText: { color: '#a1a1aa', fontSize: 12 },
  publishBtn: {
    backgroundColor: '#8d23be',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  publishBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  viewSwitchBtn: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewSwitchBtnActive: {
    backgroundColor: '#3b0764',
    borderColor: '#a855f7',
  },
  viewSwitchText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  viewSwitchTextActive: {
    color: '#f3e8ff',
    fontWeight: 'bold',
  },
  mapBanner: {
    backgroundColor: '#1e102a',
    borderColor: '#7e22ce',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  mapBannerTitle: { color: '#f3e8ff', fontSize: 13, fontWeight: 'bold' },
  mapBannerSub: { color: '#c084fc', fontSize: 11, marginTop: 2 },
  mapCard: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  mapPinIcon: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  mapCoordsText: { color: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' },
  mapPinTitle: { color: '#e4e4e7', fontSize: 14, fontWeight: '600', marginTop: 4 },
  mapPinMeta: { color: '#a1a1aa', fontSize: 11, marginTop: 2 },
  mapActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  mapActionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  guestBanner: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  guestBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  guestBannerTitle: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '700',
  },
  guestBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  guestBadgeText: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '700',
  },
  guestBannerText: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  guestBannerBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  guestBannerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

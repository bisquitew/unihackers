import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';

export interface BuddyListing {
  id: string;
  eventId: string;
  eventTitle: string;
  userName: string;
  university: string;
  bio: string;
  interests: string[];
  icebreakerPrompt: string;
  matchScore?: number;
}

interface ChatMessage {
  id: string;
  sender: 'me' | 'buddy' | 'group';
  authorName?: string;
  text: string;
  time: string;
}

const INITIAL_BUDDIES: BuddyListing[] = [
  {
    id: 'bud-001',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    userName: 'Lucas Weber',
    university: 'Erasmus UPT Electro',
    bio: 'Erasmus student from Munich studying Computer Science. Big fan of European cinema and craft beer.',
    interests: ['cinema', 'photography', 'craft beer', 'coffee'],
    icebreakerPrompt: 'Favorite A24 or European arthouse movie?',
    matchScore: 95,
  },
  {
    id: 'bud-002',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    userName: 'Ioana Moldovan',
    university: 'Architecture UPT',
    bio: 'Architecture student at Faculty of Architecture Timișoara. Love discussing ideas after film screenings!',
    interests: ['cinema', 'architecture', 'drawing', 'tea'],
    icebreakerPrompt: 'Shall we meet 20 minutes before to grab good seats?',
    matchScore: 88,
  },
  {
    id: 'bud-003',
    eventId: 'evt-002',
    eventTitle: 'Beginner Pottery & Clay Jam',
    userName: 'Sarah Jenkins',
    university: 'Alumni / Professional',
    bio: 'Newcomer in Timișoara working remotely in tech. Looking to meet creative people and learn pottery.',
    interests: ['pottery', 'crafts', 'hiking', 'languages'],
    icebreakerPrompt: 'Have you ever tried making a ceramic mug?',
    matchScore: 78,
  },
  {
    id: 'bud-004',
    eventId: 'evt-003',
    eventTitle: 'Sunset Acoustic & Jazz Session',
    userName: 'Radu Ionescu',
    university: 'UVT Music & Arts',
    bio: 'Guitar player and indie enthusiast. Want to sit on the Bega deck and listen to live sets together.',
    interests: ['jazz', 'acoustic', 'music', 'bega'],
    icebreakerPrompt: 'What’s your favorite local live music venue in Timișoara?',
    matchScore: 92,
  },
];

export function BuddyScreen() {
  const [buddies, setBuddies] = useState<BuddyListing[]>(INITIAL_BUDDIES);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeChat, setActiveChat] = useState<{
    groupTitle: string;
    participants: string[];
    messages: ChatMessage[];
  } | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Create form state
  const [newUserName, setNewUserName] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('Underground Indie Cinema Night');
  const [newBio, setNewBio] = useState('');
  const [newInterests, setNewInterests] = useState('');

  const filteredBuddies =
    selectedFilter === 'all'
      ? buddies
      : buddies.filter((b) => b.eventTitle.toLowerCase().includes(selectedFilter.toLowerCase()) || b.interests.includes(selectedFilter));

  const handleOpenChat = (buddy: BuddyListing) => {
    setActiveChat({
      groupTitle: `${buddy.eventTitle} • Small Group`,
      participants: [buddy.userName, 'Ioana Moldovan', 'You'],
      messages: [
        {
          id: 'm1',
          sender: 'buddy',
          authorName: buddy.userName,
          text: `Hey! Glad you reached out for ${buddy.eventTitle}!`,
          time: '12:45 PM',
        },
        {
          id: 'm2',
          sender: 'group',
          authorName: 'Ioana Moldovan',
          text: `Super excited! Shall we meet near the entrance deck 15 minutes before?`,
          time: '12:48 PM',
        },
        {
          id: 'm3',
          sender: 'buddy',
          authorName: buddy.userName,
          text: buddy.icebreakerPrompt,
          time: '12:50 PM',
        },
      ],
    });
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeChat) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      authorName: 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveChat((prev) =>
      prev ? { ...prev, messages: [...prev.messages, userMsg] } : null
    );
    setChatInput('');

    // Simulated responsive reply from a group member
    setTimeout(() => {
      if (!activeChat) return;
      const autoReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'buddy',
        authorName: activeChat.participants[0],
        text: 'Sounds great! I also minted my ticket on Solana Devnet. See you there! 🍿',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActiveChat((prev) =>
        prev ? { ...prev, messages: [...prev.messages, autoReply] } : null
      );
    }, 1100);
  };

  const handleCreateRequest = () => {
    if (!newUserName.trim() || !newBio.trim()) {
      Alert.alert('Required Fields', 'Please enter your name and a brief bio.');
      return;
    }

    const created: BuddyListing = {
      id: `bud-${Date.now()}`,
      eventId: 'evt-custom',
      eventTitle: newEventTitle,
      userName: newUserName.trim(),
      university: 'Resident / Student',
      bio: newBio.trim(),
      interests: newInterests ? newInterests.split(',').map((s) => s.trim()) : ['culture', 'events'],
      icebreakerPrompt: 'Looking forward to meeting up!',
      matchScore: 90,
    };

    setBuddies([created, ...buddies]);
    setCreateModalVisible(false);
    setNewUserName('');
    setNewBio('');
    setNewInterests('');
    Alert.alert('Success 🎉', 'Your buddy request has been posted! Other attendees can now connect with you.');
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTag}>🤝 BUDDY FINDER • EVENT COMPANIONS [M07]</Text>
          <Text style={styles.headerTitle}>Looking for Company?</Text>
          <Text style={styles.headerSub}>
            Find attendees with matching interests or start a small group chat.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.postBtnText}>+ Post Request</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'Cinema', label: '🎬 Indie Cinema' },
            { id: 'Pottery', label: '🎨 Pottery & Art' },
            { id: 'Jazz', label: '🎵 Live Jazz' },
            { id: 'coffee', label: '☕ Coffee & Chat' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                selectedFilter === cat.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(cat.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === cat.id && styles.filterChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Buddy Cards List */}
      <ScrollView style={styles.content}>
        {filteredBuddies.map((buddy) => (
          <View key={buddy.id} style={styles.buddyCard}>
            {/* Top row */}
            <View style={styles.cardTopRow}>
              <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeText} numberOfLines={1}>
                  🎟️ {buddy.eventTitle}
                </Text>
              </View>
              {buddy.matchScore && (
                <View style={styles.matchPill}>
                  <Text style={styles.matchText}>🎯 {buddy.matchScore}% Match</Text>
                </View>
              )}
            </View>

            {/* Profile info */}
            <View style={styles.profileRow}>
              <View>
                <Text style={styles.userName}>{buddy.userName}</Text>
                <Text style={styles.university}>🏫 {buddy.university}</Text>
              </View>
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={() => handleOpenChat(buddy)}
              >
                <Text style={styles.connectBtnText}>💬 Group Chat</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.bio}>{buddy.bio}</Text>

            {/* Interest Tags */}
            <View style={styles.tagsRow}>
              {buddy.interests.map((tag) => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>

            {/* Icebreaker Box */}
            <View style={styles.icebreakerBox}>
              <Text style={styles.icebreakerLabel}>💡 Icebreaker Question:</Text>
              <Text style={styles.icebreakerPrompt}>"{buddy.icebreakerPrompt}"</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Small Group Chat Modal */}
      {activeChat && (
        <Modal visible={!!activeChat} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.chatSheet}>
              {/* Chat Header */}
              <View style={styles.chatHeader}>
                <View>
                  <Text style={styles.chatTitle} numberOfLines={1}>
                    💬 {activeChat.groupTitle}
                  </Text>
                  <Text style={styles.chatSub}>
                    Participants: {activeChat.participants.join(', ')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveChat(null)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Messages List */}
              <ScrollView style={styles.chatMessagesList}>
                {activeChat.messages.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.chatBubble,
                      m.sender === 'me'
                        ? styles.myBubble
                        : m.sender === 'group'
                        ? styles.groupMemberBubble
                        : styles.buddyBubble,
                    ]}
                  >
                    {m.authorName && m.sender !== 'me' && (
                      <Text style={styles.bubbleAuthor}>{m.authorName}</Text>
                    )}
                    <Text
                      style={[
                        styles.bubbleText,
                        m.sender === 'me' ? styles.myBubbleText : styles.buddyBubbleText,
                      ]}
                    >
                      {m.text}
                    </Text>
                    <Text style={styles.bubbleTime}>{m.time}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Quick Reply Chips */}
              <View style={styles.quickRepliesRow}>
                {[
                  '🍿 See you at the entrance!',
                  '☕ Grab a drink before?',
                  '🎟️ Got my Solana ticket!',
                ].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={styles.quickReplyChip}
                    onPress={() => {
                      setChatInput(chip);
                    }}
                  >
                    <Text style={styles.quickReplyText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input Bar */}
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Type a message to the group..."
                  placeholderTextColor="#71717a"
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleSendMessage}
                >
                  <Text style={styles.sendBtnText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Post "Looking for Company" Request Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.createModalContent}>
            <Text style={styles.createModalTitle}>Looking for Company</Text>
            <Text style={styles.createModalSub}>
              Post a request so other attendees can find you and form a group.
            </Text>

            <Text style={styles.inputLabel}>Event</Text>
            <TextInput
              style={styles.input}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              placeholder="Event name"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="E.g. Elena"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>About You (Short Bio)</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              multiline
              value={newBio}
              onChangeText={setNewBio}
              placeholder="What do you study or enjoy discussing?"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>Interests (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={newInterests}
              onChangeText={setNewInterests}
              placeholder="cinema, jazz, photography, tech"
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
                style={styles.submitBtn}
                onPress={handleCreateRequest}
              >
                <Text style={styles.submitBtnText}>Post Request</Text>
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
  headerTag: { color: '#c084fc', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  headerSub: { color: '#a1a1aa', fontSize: 11, marginTop: 2, maxWidth: 240 },
  postBtn: {
    backgroundColor: '#8d23be',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  postBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10 },
  filterChip: {
    backgroundColor: '#18181b',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: { backgroundColor: '#3b0764', borderColor: '#a855f7' },
  filterChipText: { color: '#a1a1aa', fontSize: 11, fontWeight: '500' },
  filterChipTextActive: { color: '#f3e8ff', fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 16 },
  buddyCard: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 220,
  },
  eventBadgeText: { color: '#c084fc', fontSize: 10, fontWeight: '700' },
  matchPill: {
    backgroundColor: '#052e16',
    borderColor: '#16a34a',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  matchText: { color: '#4ade80', fontSize: 10, fontWeight: '700' },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  university: { color: '#a1a1aa', fontSize: 11, marginTop: 1 },
  connectBtn: {
    backgroundColor: '#3b0764',
    borderColor: '#7e22ce',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  connectBtnText: { color: '#f3e8ff', fontSize: 11, fontWeight: '700' },
  bio: { color: '#d4d4d8', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tagBadge: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { color: '#a855f7', fontSize: 10, fontWeight: '600' },
  icebreakerBox: {
    backgroundColor: '#09090b',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8d23be',
  },
  icebreakerLabel: { color: '#a1a1aa', fontSize: 10, fontWeight: '600' },
  icebreakerPrompt: { color: '#e4e4e7', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  chatSheet: {
    backgroundColor: '#09090b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  chatTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', maxWidth: 280 },
  chatSub: { color: '#a1a1aa', fontSize: 10, marginTop: 2 },
  closeBtn: { padding: 6 },
  closeBtnText: { color: '#a1a1aa', fontSize: 16, fontWeight: 'bold' },
  chatMessagesList: { flex: 1, paddingVertical: 12 },
  chatBubble: { maxWidth: '82%', padding: 10, borderRadius: 12, marginBottom: 10 },
  myBubble: { backgroundColor: '#8d23be', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  buddyBubble: { backgroundColor: '#18181b', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  groupMemberBubble: { backgroundColor: '#1e1b4b', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  bubbleAuthor: { color: '#c084fc', fontSize: 9, fontWeight: '700', marginBottom: 2 },
  bubbleText: { fontSize: 12, lineHeight: 17 },
  myBubbleText: { color: '#ffffff' },
  buddyBubbleText: { color: '#f4f4f5' },
  bubbleTime: { color: '#a1a1aa', fontSize: 9, alignSelf: 'flex-end', marginTop: 4 },
  quickRepliesRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  quickReplyChip: {
    backgroundColor: '#18181b',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  quickReplyText: { color: '#d4d4d8', fontSize: 10 },
  chatInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chatInput: {
    flex: 1,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
  },
  sendBtn: {
    backgroundColor: '#8d23be',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sendBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  createModalContent: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  createModalTitle: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' },
  createModalSub: { color: '#a1a1aa', fontSize: 11, marginTop: 2, marginBottom: 14 },
  inputLabel: { color: '#d4d4d8', fontSize: 11, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#ffffff',
    fontSize: 12,
  },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  cancelBtnText: { color: '#a1a1aa', fontSize: 12 },
  submitBtn: {
    backgroundColor: '#8d23be',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  submitBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
});

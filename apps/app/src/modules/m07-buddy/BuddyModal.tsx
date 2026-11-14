import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';

interface BuddyRequestItem {
  id: string;
  userName: string;
  university: string;
  bio: string;
  interests: string[];
  icebreakerPrompt: string;
}

interface ChatMessage {
  id: string;
  sender: 'me' | 'buddy';
  text: string;
  time: string;
}

const SEED_BUDDIES: BuddyRequestItem[] = [
  {
    id: 'b-1',
    userName: 'Lucas Weber',
    university: 'Erasmus UPT Electro',
    bio: 'Student from Germany passionate about European indie films and photography.',
    interests: ['cinema', 'craft beer', 'photo'],
    icebreakerPrompt: 'What indie film impressed you the most recently?',
  },
  {
    id: 'b-2',
    userName: 'Ioana Moldovan',
    university: 'Architecture UPT',
    bio: 'I love discussing design after screenings and meeting creative people!',
    interests: ['architecture', 'cinema', 'coffee'],
    icebreakerPrompt: 'Shall we meet 20 minutes before to grab good seats?',
  },
];

interface BuddyModalProps {
  visible: boolean;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export function BuddyModal({ visible, eventId, eventTitle, onClose }: BuddyModalProps) {
  const [buddies, setBuddies] = useState<BuddyRequestItem[]>(SEED_BUDDIES);
  const [viewMode, setViewMode] = useState<'list' | 'post' | 'chat'>('list');
  const [activeBuddy, setActiveBuddy] = useState<BuddyRequestItem | null>(null);

  // New buddy request form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interestsText, setInterestsText] = useState('');

  // Interactive Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleStartChat = (buddy: BuddyRequestItem) => {
    setActiveBuddy(buddy);
    // Seed initial greeting and icebreaker from the buddy
    setMessages([
      {
        id: 'msg-1',
        sender: 'buddy',
        text: `Hey! Glad to meet up for ${eventTitle}!`,
        time: 'Just now',
      },
      {
        id: 'msg-2',
        sender: 'buddy',
        text: buddy.icebreakerPrompt,
        time: 'Just now',
      },
    ]);
    setViewMode('chat');
  };

  const handleSendMessage = (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Simulated responsive answer from the buddy after 1 second for live demo
    setTimeout(() => {
      const replies = [
        'Awesome! See you at the entrance 15 minutes before. 🍿',
        'Sounds good! Look for me near the outdoor terrace. I will text you when I arrive!',
        'Perfect, looking forward to meeting up! I also minted my ticket on Solana.',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const buddyReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'buddy',
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, buddyReply]);
    }, 1100);
  };

  const handlePostRequest = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    const newBuddy: BuddyRequestItem = {
      id: `b-${Date.now()}`,
      userName: name.trim(),
      university: 'Student / Resident',
      bio: bio.trim() || 'Looking for great company for this event!',
      interests: interestsText ? interestsText.split(',').map((s) => s.trim()) : ['culture', 'city'],
      icebreakerPrompt: 'Shall we meet at the entrance?',
    };

    setBuddies([newBuddy, ...buddies]);
    setViewMode('list');
    setName('');
    setBio('');
    setInterestsText('');
    Alert.alert('Success', 'Your buddy request has been posted!');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.tag}>🤝 BUDDY FINDER • EVENT COMPANIONS [M07]</Text>
              <Text style={styles.title} numberOfLines={1}>{eventTitle}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setViewMode('list');
                setActiveBuddy(null);
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* VIEW MODE 1: LIST BUDDIES */}
          {viewMode === 'list' && (
            <>
              <Text style={styles.sub}>
                Attending alone? Connect with other students and locals in Timișoara:
              </Text>

              <ScrollView style={styles.list}>
                {buddies.map((b) => (
                  <View key={b.id} style={styles.buddyCard}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.buddyName}>{b.userName}</Text>
                        <Text style={styles.buddyUni}>{b.university}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => handleStartChat(b)}
                      >
                        <Text style={styles.connectBtnText}>💬 Open Chat</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.buddyBio}>{b.bio}</Text>

                    <View style={styles.tagRow}>
                      {b.interests.map((tag) => (
                        <Text key={tag} style={styles.interestTag}>#{tag}</Text>
                      ))}
                    </View>

                    <View style={styles.icebreakerBox}>
                      <Text style={styles.icebreakerLabel}>💡 Icebreaker Question:</Text>
                      <Text style={styles.icebreakerText}>"{b.icebreakerPrompt}"</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.postBtn}
                onPress={() => setViewMode('post')}
              >
                <Text style={styles.postBtnText}>+ Look for a buddy for this event</Text>
              </TouchableOpacity>
            </>
          )}

          {/* VIEW MODE 2: INTERACTIVE LIVE CHAT */}
          {viewMode === 'chat' && activeBuddy && (
            <View style={styles.chatContainer}>
              {/* Chat Sub-Header */}
              <View style={styles.chatSubHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setViewMode('list')}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.chatBuddyInfo}>
                  <Text style={styles.chatBuddyName}>{activeBuddy.userName}</Text>
                  <Text style={styles.chatBuddyStatus}>🟢 Online now • {activeBuddy.university}</Text>
                </View>
              </View>

              {/* Icebreaker Callout */}
              <View style={styles.chatIcebreakerBanner}>
                <Text style={styles.chatIcebreakerTitle}>💡 Question from {activeBuddy.userName}:</Text>
                <Text style={styles.chatIcebreakerPrompt}>"{activeBuddy.icebreakerPrompt}"</Text>
              </View>

              {/* Message History */}
              <ScrollView style={styles.messageList}>
                {messages.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.messageBubble,
                      m.sender === 'me' ? styles.myMessage : styles.buddyMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        m.sender === 'me' ? styles.myMessageText : styles.buddyMessageText,
                      ]}
                    >
                      {m.text}
                    </Text>
                    <Text style={styles.messageTime}>{m.time}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Quick Reply Chips */}
              <View style={styles.quickRepliesRow}>
                {[
                  '🎬 I love indie movies!',
                  '☕ Meet 15 mins before?',
                  '🎟️ Got my Solana ticket!',
                ].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={styles.quickChip}
                    onPress={() => handleSendMessage(chip)}
                  >
                    <Text style={styles.quickChipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chat Input Bar */}
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatTextInput}
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  placeholder={`Reply to ${activeBuddy.userName}...`}
                  placeholderTextColor="#71717a"
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => handleSendMessage()}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* VIEW MODE 3: POST REQUEST FORM */}
          {viewMode === 'post' && (
            <ScrollView style={styles.form}>
              <Text style={styles.formTitle}>Find an Event Buddy</Text>

              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="E.g. Elena"
                placeholderTextColor="#71717a"
              />

              <Text style={styles.label}>About You (Short Bio)</Text>
              <TextInput
                style={styles.input}
                value={bio}
                onChangeText={setBio}
                placeholder="What do you study or enjoy doing?"
                placeholderTextColor="#71717a"
              />

              <Text style={styles.label}>Interests (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={interestsText}
                onChangeText={setInterestsText}
                placeholder="cinema, jazz, theater, coffee"
                placeholderTextColor="#71717a"
              />

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setViewMode('list')}
                >
                  <Text style={styles.cancelBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handlePostRequest}
                >
                  <Text style={styles.submitBtnText}>Post Request</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tag: { color: '#c084fc', fontSize: 10, fontWeight: '700' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 2, maxWidth: 260 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#a1a1aa', fontWeight: 'bold' },
  sub: { color: '#a1a1aa', fontSize: 12, marginBottom: 12 },
  list: { maxHeight: 380 },
  buddyCard: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buddyName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  buddyUni: { color: '#a855f7', fontSize: 11, marginTop: 2 },
  connectBtn: {
    backgroundColor: '#8d23be',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  connectBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  buddyBio: { color: '#d4d4d8', fontSize: 12, marginTop: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  interestTag: { color: '#818cf8', fontSize: 10, fontWeight: '600' },
  icebreakerBox: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  icebreakerLabel: { color: '#fbbf24', fontSize: 10, fontWeight: '600' },
  icebreakerText: { color: '#e4e4e7', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  postBtn: {
    backgroundColor: '#8d23be',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  postBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },

  // Interactive Chat Styles
  chatContainer: { height: 420, display: 'flex', flexDirection: 'column' },
  chatSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  backButton: {
    backgroundColor: '#27272a',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  backButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  chatBuddyInfo: { flex: 1 },
  chatBuddyName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  chatBuddyStatus: { color: '#4ade80', fontSize: 10, marginTop: 1 },
  chatIcebreakerBanner: {
    backgroundColor: '#2e1065',
    borderColor: '#7e22ce',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  chatIcebreakerTitle: { color: '#c084fc', fontSize: 10, fontWeight: 'bold' },
  chatIcebreakerPrompt: { color: '#f3e8ff', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  messageList: { flex: 1, paddingVertical: 6 },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  buddyMessage: {
    backgroundColor: '#27272a',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  myMessage: {
    backgroundColor: '#8d23be',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  messageText: { fontSize: 13, lineHeight: 17 },
  buddyMessageText: { color: '#ffffff' },
  myMessageText: { color: '#ffffff' },
  messageTime: { fontSize: 9, color: '#a1a1aa', marginTop: 4, alignSelf: 'flex-end' },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 6,
  },
  quickChip: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  quickChipText: { color: '#e4e4e7', fontSize: 10 },
  chatInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: '#8d23be',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sendButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },

  // Form Styles
  form: { paddingVertical: 10 },
  formTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  label: { color: '#a1a1aa', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    color: '#ffffff',
    padding: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#27272a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#ffffff' },
  submitBtn: {
    flex: 1,
    backgroundColor: '#8d23be',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold' },
});

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

const SEED_BUDDIES: BuddyRequestItem[] = [
  {
    id: 'b-1',
    userName: 'Lucas Weber',
    university: 'Erasmus UPT Electro',
    bio: 'Student din Germania pasionat de film european și fotografie.',
    interests: ['film', 'craft beer', 'foto'],
    icebreakerPrompt: 'Ce film te-a impresionat cel mai mult anul acesta?',
  },
  {
    id: 'b-2',
    userName: 'Ioana Moldovan',
    university: 'Arhitectură UPT',
    bio: 'Îmi place să discut idei după proiecții și să cunosc oameni noi!',
    interests: ['arhitectură', 'film', 'ceai'],
    icebreakerPrompt: 'Mergem cu 20 de minute înainte să prindem locuri bune?',
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
  const [isPosting, setIsPosting] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interestsText, setInterestsText] = useState('');

  const handleConnect = (buddy: BuddyRequestItem) => {
    Alert.alert(
      'Grup de discuție creat! 💬',
      `Te-ai conectat cu ${buddy.userName}!\n\nIcebreaker: "${buddy.icebreakerPrompt}"`
    );
  };

  const handlePostRequest = () => {
    if (!name.trim()) {
      Alert.alert('Eroare', 'Te rugăm să introduci numele tău.');
      return;
    }

    const newBuddy: BuddyRequestItem = {
      id: `b-${Date.now()}`,
      userName: name.trim(),
      university: 'Student / Rezident',
      bio: bio.trim() || 'Căutăm companie plăcută pentru acest eveniment!',
      interests: interestsText ? interestsText.split(',').map((s) => s.trim()) : ['cultură', 'oraș'],
      icebreakerPrompt: 'Ne vedem la intrare?',
    };

    setBuddies([newBuddy, ...buddies]);
    setIsPosting(false);
    setName('');
    setBio('');
    setInterestsText('');
    Alert.alert('Succes', 'Cererea ta a fost adăugată în lista evenimentului!');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.tag}>🤝 CU CINE? • BUDDY FINDER [M07]</Text>
              <Text style={styles.title} numberOfLines={1}>{eventTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!isPosting ? (
            <>
              <Text style={styles.sub}>
                Mergi singur? Conectează-te cu alți studenți sau rezidenți din Timișoara:
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
                        onPress={() => handleConnect(b)}
                      >
                        <Text style={styles.connectBtnText}>+ Conectează-te</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.buddyBio}>{b.bio}</Text>

                    <View style={styles.tagRow}>
                      {b.interests.map((tag) => (
                        <Text key={tag} style={styles.interestTag}>#{tag}</Text>
                      ))}
                    </View>

                    <View style={styles.icebreakerBox}>
                      <Text style={styles.icebreakerLabel}>💡 Întrebare de început:</Text>
                      <Text style={styles.icebreakerText}>"{b.icebreakerPrompt}"</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.postBtn}
                onPress={() => setIsPosting(true)}
              >
                <Text style={styles.postBtnText}>+ Caut și eu un Buddy la acest eveniment</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView style={styles.form}>
              <Text style={styles.formTitle}>Caută un partener de eveniment</Text>

              <Text style={styles.label}>Numele tău</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Elena"
                placeholderTextColor="#71717a"
              />

              <Text style={styles.label}>Despre tine (Bio scurt)</Text>
              <TextInput
                style={styles.input}
                value={bio}
                onChangeText={setBio}
                placeholder="Ce studiezi sau ce pasiuni ai?"
                placeholderTextColor="#71717a"
              />

              <Text style={styles.label}>Interese (separate prin virgulă)</Text>
              <TextInput
                style={styles.input}
                value={interestsText}
                onChangeText={setInterestsText}
                placeholder="film, jazz, teatru, cafea"
                placeholderTextColor="#71717a"
              />

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsPosting(false)}
                >
                  <Text style={styles.cancelBtnText}>Înapoi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handlePostRequest}
                >
                  <Text style={styles.submitBtnText}>Publică cererea</Text>
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
    maxHeight: '85%',
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
    backgroundColor: '#2e1065',
    borderColor: '#7e22ce',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  connectBtnText: { color: '#d8b4fe', fontSize: 11, fontWeight: '700' },
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

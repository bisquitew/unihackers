import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  category: 'lost_pets' | 'neighbourhood' | 'help' | 'buy_sell' | 'cultural';
  title: string;
  content: string;
  authorName: string;
  neighbourhood: string;
  photos: string[];
  upvotes: number;
  commentsCount: number;
  comments: Comment[];
  isReported: boolean;
  reportCount: number;
  reportReason?: string;
  createdAt: string;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 'post-001',
    category: 'lost_pets',
    title: 'Pisică portocalie pierdută în Fabric (Str. Ștefan cel Mare)',
    content: 'Motan roșcat, 2 ani, răspunde la numele Milo. Are o zgardă albastră cu clopoțel. S-a speriat și a fugit spre malul Begăi.',
    authorName: 'Ana Radu',
    neighbourhood: 'Fabric',
    photos: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80'],
    upvotes: 18,
    commentsCount: 2,
    comments: [
      { id: 'c1', authorName: 'Ion Ionescu', content: 'Cred că l-am văzut în spatele bisericii Millennium!', createdAt: '1h în urmă' },
      { id: 'c2', authorName: 'Ana Radu', content: 'Mergem să căutăm, mulțumim mult!', createdAt: '30m în urmă' },
    ],
    isReported: false,
    reportCount: 0,
    createdAt: 'Azi, 11:00',
  },
  {
    id: 'post-002',
    category: 'neighbourhood',
    title: 'Ecologizare voluntară malul Begăi (Iosefin / D’arc)',
    content: 'Sâmbătă la 10:00 ne strângem să adunăm deșeurile de pe faleză. Asigurăm saci și mănuși!',
    authorName: 'Mihai Voinea',
    neighbourhood: 'Iosefin',
    photos: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80'],
    upvotes: 34,
    commentsCount: 1,
    comments: [
      { id: 'c3', authorName: 'Elena D.', content: 'Vin și eu cu doi colegi de la UPT!', createdAt: '2h în urmă' },
    ],
    isReported: false,
    reportCount: 0,
    createdAt: 'Azi, 10:15',
  },
  {
    id: 'post-003',
    category: 'help',
    title: 'Căldura oprită în Complexul Studențesc — spații calde de studiu?',
    content: 'Avarie Colterm pe rețea. Unde putem merge să învățăm într-un spațiu cald cu Wi-Fi bun?',
    authorName: 'Alex Popa',
    neighbourhood: 'Complexul Studențesc',
    photos: [],
    upvotes: 27,
    commentsCount: 1,
    comments: [
      { id: 'c4', authorName: 'Maria C.', content: 'La Faber și la Biblioteca Centrală Universitară (BCUT) e perfect!', createdAt: '45m în urmă' },
    ],
    isReported: false,
    reportCount: 0,
    createdAt: 'Azi, 13:50',
  },
  {
    id: 'post-004',
    category: 'buy_sell',
    title: 'Bilete concert la suprapreț Piața Unirii',
    content: 'Vând 3 bilete la concertul de la filarmonică cu preț dublu, plata doar cash în Piața Unirii.',
    authorName: 'Anonim99',
    neighbourhood: 'Cetate',
    photos: [],
    upvotes: 0,
    commentsCount: 0,
    comments: [],
    isReported: true,
    reportCount: 3,
    reportReason: 'Speculă ilegală de bilete și spam',
    createdAt: 'Azi, 14:10',
  },
];

export function ForumScreen() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'lost_pets' | 'neighbourhood' | 'help'>('neighbourhood');
  const [newNeighbourhood, setNewNeighbourhood] = useState('Cetate');

  const reportedPosts = posts.filter((p) => p.isReported);

  const filteredPosts =
    selectedCategory === 'moderation'
      ? reportedPosts
      : posts.filter(
          (p) => selectedCategory === 'all' || p.category === selectedCategory
        );

  const handleUpvote = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p))
    );
  };

  const handleReport = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isReported: true,
              reportCount: p.reportCount + 1,
              reportReason: 'Sesizare transmisă de un rezident',
            }
          : p
      )
    );
    Alert.alert(
      'Postare raportată 🛡️',
      'Mulțumim! Postarea a fost trimisă în coada de analiză a moderatorilor.'
    );
  };

  // Moderator Actions
  const handleApprovePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isReported: false, reportCount: 0, reportReason: undefined }
          : p
      )
    );
    Alert.alert('Postare Aprobată ✓', 'Postarea a fost verificată și păstrată în feed-ul comunității.');
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Confirmă ștergerea',
      'Sigur doriți să eliminați această postare din platformă?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge definitiv',
          style: 'destructive',
          onPress: () => {
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            Alert.alert('Șters', 'Postarea a fost eliminată cu succes.');
          },
        },
      ]
    );
  };

  const handleAddComment = (postId: string) => {
    if (!newCommentText.trim()) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const c: Comment = {
            id: `c-${Date.now()}`,
            authorName: 'Tu (Rezident)',
            content: newCommentText.trim(),
            createdAt: 'Chiar acum',
          };
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...p.comments, c],
          };
        }
        return p;
      })
    );
    setNewCommentText('');
  };

  const handleCreatePost = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Eroare', 'Vă rugăm să completați titlul și descrierea postării.');
      return;
    }

    const post: Post = {
      id: `post-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      authorName: 'Tu (Rezident)',
      neighbourhood: newNeighbourhood,
      photos: [],
      upvotes: 1,
      commentsCount: 0,
      comments: [],
      isReported: false,
      reportCount: 0,
      createdAt: 'Chiar acum',
    };

    setPosts([post, ...posts]);
    setModalVisible(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Comunitate & Vecinătate</Text>
          <Text style={styles.headerSub}>Timișoara • Forum Cetățenesc [M08]</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.createButtonText}>+ Scrie Postare</Text>
        </TouchableOpacity>
      </View>

      {/* Category & Moderator Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'all', label: 'Toate' },
            { id: 'lost_pets', label: '🐾 Animale Pierdute' },
            { id: 'help', label: '🤝 Ajutor & Întrebări' },
            { id: 'neighbourhood', label: '🏘️ Inițiative Cartier' },
            {
              id: 'moderation',
              label: `🛡️ Panou Moderare ${reportedPosts.length > 0 ? `(${reportedPosts.length})` : ''}`,
            },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
                cat.id === 'moderation' && styles.moderationChip,
                cat.id === 'moderation' && selectedCategory === 'moderation' && styles.moderationChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextActive,
                  cat.id === 'moderation' && styles.moderationChipText,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MODERATOR VIEW BANNER (When Moderation Tab is Selected) */}
      {selectedCategory === 'moderation' && (
        <View style={styles.modBanner}>
          <Text style={styles.modBannerTitle}>🛡️ Panou de Moderare Comunitate</Text>
          <Text style={styles.modBannerSub}>
            Postările raportate de rezidenți pentru spam, înșelăciuni sau limbaj nepotrivit.
          </Text>
        </View>
      )}

      {/* Empty State for Moderation */}
      {selectedCategory === 'moderation' && reportedPosts.length === 0 && (
        <View style={styles.emptyModBox}>
          <Text style={styles.emptyModIcon}>✨</Text>
          <Text style={styles.emptyModTitle}>Nicio postare raportată!</Text>
          <Text style={styles.emptyModDesc}>
            Toate postările din Timișoara sunt verificate. Comunitatea este în siguranță.
          </Text>
        </View>
      )}

      {/* Posts List */}
      <ScrollView style={styles.content}>
        {filteredPosts.map((post) => (
          <View
            key={post.id}
            style={[
              styles.postCard,
              post.isReported && selectedCategory === 'moderation' && styles.reportedPostCard,
            ]}
          >
            <View style={styles.postHeader}>
              <View>
                <View style={styles.badgeRow}>
                  <Text style={styles.categoryBadge}>{post.category.toUpperCase().replace('_', ' ')}</Text>
                  <Text style={styles.neighbourhoodBadge}>📍 {post.neighbourhood}</Text>
                </View>
                <Text style={styles.postAuthor}>{post.authorName} • {post.createdAt}</Text>
              </View>

              {/* Report pill or badge */}
              {selectedCategory !== 'moderation' ? (
                <TouchableOpacity onPress={() => handleReport(post.id)}>
                  <Text style={styles.reportText}>{post.isReported ? '⚠️ Raportat' : '⚑ Raportează'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.modReportPill}>
                  <Text style={styles.modReportPillText}>⚠️ {post.reportCount} sesizări</Text>
                </View>
              )}
            </View>

            {/* Moderation Warning Note */}
            {post.isReported && (
              <View style={styles.reportedReasonBox}>
                <Text style={styles.reportedReasonTitle}>Motiv semnalare:</Text>
                <Text style={styles.reportedReasonText}>
                  {post.reportReason || 'Semnalat de comunitate pentru verificare'}
                </Text>
              </View>
            )}

            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>

            {post.photos.length > 0 && (
              <Image source={{ uri: post.photos[0] }} style={styles.postImage} />
            )}

            {/* If NOT in moderator view: Normal Upvote & Comment Actions */}
            {selectedCategory !== 'moderation' ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpvote(post.id)}>
                  <Text style={styles.actionBtnText}>👍 {post.upvotes} Susțineri</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    setActiveCommentsPostId(
                      activeCommentsPostId === post.id ? null : post.id
                    )
                  }
                >
                  <Text style={styles.actionBtnText}>💬 {post.commentsCount} Comentarii</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* MODERATOR CONTROL BUTTONS */
              <View style={styles.modActionRow}>
                <TouchableOpacity
                  style={styles.modApproveBtn}
                  onPress={() => handleApprovePost(post.id)}
                >
                  <Text style={styles.modApproveBtnText}>✓ Aprobă & Păstrează</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modDeleteBtn}
                  onPress={() => handleDeletePost(post.id)}
                >
                  <Text style={styles.modDeleteBtnText}>🗑️ Șterge Postarea</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Comments Drawer */}
            {activeCommentsPostId === post.id && (
              <View style={styles.commentsBox}>
                {post.comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <Text style={styles.commentAuthor}>{c.authorName}</Text>
                    <Text style={styles.commentContent}>{c.content}</Text>
                  </View>
                ))}
                <View style={styles.addCommentRow}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Scrie un răspuns..."
                    placeholderTextColor="#71717a"
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                  />
                  <TouchableOpacity
                    style={styles.sendCommentBtn}
                    onPress={() => handleAddComment(post.id)}
                  >
                    <Text style={styles.sendCommentText}>Trimite</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Create Post Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Postare nouă în comunitate</Text>

            <Text style={styles.inputLabel}>Categorie</Text>
            <View style={styles.catSelectRow}>
              {(['neighbourhood', 'lost_pets', 'help'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catOption,
                    newCategory === cat && styles.catOptionActive,
                  ]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={styles.catOptionText}>
                    {cat === 'lost_pets' ? '🐾 Animal' : cat === 'help' ? '🤝 Ajutor' : '🏘️ Cartier'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Cartier</Text>
            <TextInput
              style={styles.modalInput}
              value={newNeighbourhood}
              onChangeText={setNewNeighbourhood}
              placeholder="Ex: Fabric, Iosefin, Cetate, Elisabetin"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>Titlu</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Despre ce este vorba?"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>Detalii</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              multiline
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Scrie detaliile postării..."
              placeholderTextColor="#71717a"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handleCreatePost}
              >
                <Text style={styles.publishBtnText}>Publică</Text>
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
  createButton: {
    backgroundColor: '#8d23be',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  createButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
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
  moderationChip: { borderColor: '#b45309' },
  moderationChipActive: { backgroundColor: '#b45309', borderColor: '#f59e0b' },
  moderationChipText: { color: '#fbbf24' },
  content: { flex: 1, paddingHorizontal: 16 },

  // Moderator Banner & Empty State
  modBanner: {
    backgroundColor: '#451a03',
    borderColor: '#b45309',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
  },
  modBannerTitle: { color: '#fde68a', fontSize: 13, fontWeight: 'bold' },
  modBannerSub: { color: '#fef3c7', fontSize: 11, marginTop: 2 },
  emptyModBox: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  emptyModIcon: { fontSize: 32, marginBottom: 8 },
  emptyModTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  emptyModDesc: { color: '#a1a1aa', fontSize: 12, textAlign: 'center', marginTop: 4 },

  postCard: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  reportedPostCard: {
    borderColor: '#b45309',
    backgroundColor: '#1c130d',
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  categoryBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#c084fc',
    backgroundColor: '#2e1065',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  neighbourhoodBadge: { fontSize: 10, color: '#e4e4e7', fontWeight: '500' },
  postAuthor: { color: '#71717a', fontSize: 11 },
  reportText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
  modReportPill: {
    backgroundColor: '#7c2d12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modReportPillText: { color: '#fdba74', fontSize: 10, fontWeight: 'bold' },

  reportedReasonBox: {
    backgroundColor: '#291409',
    borderColor: '#9a3412',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  reportedReasonTitle: { color: '#fdba74', fontSize: 10, fontWeight: 'bold' },
  reportedReasonText: { color: '#ffedd5', fontSize: 11, marginTop: 2 },

  postTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginTop: 8 },
  postContent: { color: '#d4d4d8', fontSize: 13, marginTop: 6, lineHeight: 18 },
  postImage: { width: '100%', height: 160, borderRadius: 10, marginTop: 10 },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { color: '#a1a1aa', fontSize: 12, fontWeight: '500' },

  // Moderator Control Buttons
  modActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#451a03',
  },
  modApproveBtn: {
    flex: 1,
    backgroundColor: '#14532d',
    borderColor: '#16a34a',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modApproveBtnText: { color: '#86efac', fontSize: 11, fontWeight: 'bold' },
  modDeleteBtn: {
    flex: 1,
    backgroundColor: '#7f1d1d',
    borderColor: '#dc2626',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modDeleteBtnText: { color: '#fca5a5', fontSize: 11, fontWeight: 'bold' },

  commentsBox: { marginTop: 10, backgroundColor: '#0f0f12', padding: 10, borderRadius: 10 },
  commentItem: { marginBottom: 8 },
  commentAuthor: { color: '#c084fc', fontSize: 11, fontWeight: 'bold' },
  commentContent: { color: '#e4e4e7', fontSize: 12 },
  addCommentRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  commentInput: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#ffffff',
    fontSize: 12,
  },
  sendCommentBtn: {
    backgroundColor: '#8d23be',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  sendCommentText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  inputLabel: { color: '#a1a1aa', fontSize: 11, marginBottom: 4, fontWeight: '600' },
  modalInput: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    color: '#ffffff',
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  catSelectRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
  },
  catOptionActive: { backgroundColor: '#8d23be' },
  catOptionText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#ffffff', fontWeight: '600' },
  publishBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#8d23be',
    alignItems: 'center',
  },
  publishBtnText: { color: '#ffffff', fontWeight: 'bold' },
});

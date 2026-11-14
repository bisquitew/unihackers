import React, { useState, useEffect } from 'react';
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
import { forumStore, Post, Comment } from './forumStore';

export function ForumScreen() {
  const [posts, setPosts] = useState<Post[]>(forumStore.getPosts());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Dev toggle to test Moderator role directly
  const [isModeratorView, setIsModeratorView] = useState(false);

  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'lost_pets' | 'neighbourhood' | 'help'>('neighbourhood');
  const [newNeighbourhood, setNewNeighbourhood] = useState('Cetate');

  useEffect(() => {
    const unsub = forumStore.subscribe(() => {
      setPosts(forumStore.getPosts());
    });
    return unsub;
  }, []);

  const reportedPosts = posts.filter((p) => p.isReported);

  const filteredPosts =
    selectedCategory === 'moderation' || isModeratorView
      ? reportedPosts
      : posts.filter(
          (p) => selectedCategory === 'all' || p.category === selectedCategory
        );

  const handleUpvote = (postId: string) => {
    forumStore.toggleUpvote(postId);
  };

  const handleReport = (postId: string) => {
    const res = forumStore.reportPost(postId, 'Flagged by citizen for review');
    if (res.alreadyReported) {
      Alert.alert(
        'Already Reported ℹ️',
        'You have already reported this post for moderator review.'
      );
    } else {
      Alert.alert(
        'Post Reported 🛡️',
        'Thank you! The post has been queued in the Moderation Panel.'
      );
    }
  };

  // Moderator Actions
  const handleApprovePost = (postId: string) => {
    forumStore.approvePost(postId);
    Alert.alert('Post Approved ✓', 'Post has been verified and kept in the community feed.');
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to remove this post from the platform?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            forumStore.deletePost(postId);
            Alert.alert('Deleted', 'Post was successfully removed.');
          },
        },
      ]
    );
  };

  const handleAddComment = (postId: string) => {
    if (!newCommentText.trim()) return;
    forumStore.addComment(postId, 'You (Resident)', newCommentText);
    setNewCommentText('');
  };

  const handleCreatePost = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Error', 'Please fill out both the title and details of your post.');
      return;
    }

    forumStore.createPost({
      title: newTitle,
      content: newContent,
      category: newCategory,
      neighbourhood: newNeighbourhood,
      authorName: 'You (Resident)',
    });

    setModalVisible(false);
    setNewTitle('');
    setNewContent('');
    Alert.alert('Success 🎉', 'Your post has been published and saved!');
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Community & Neighbourhoods</Text>
          <Text style={styles.headerSub}>Timișoara • Civic Forum [M08]</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.createButtonText}>+ Create Post</Text>
        </TouchableOpacity>
      </View>

      {/* Category & Moderator Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'groups', label: '👥 Community Groups' },
            { id: 'lost_pets', label: '🐾 Lost & Found Pets' },
            { id: 'help', label: '🤝 Help & Questions' },
            { id: 'neighbourhood', label: '🏘️ Local Initiatives' },
            {
              id: 'moderation',
              label: `🛡️ Moderation Panel ${reportedPosts.length > 0 ? `(${reportedPosts.length})` : ''}`,
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
          <Text style={styles.modBannerTitle}>🛡️ Community Moderation Panel</Text>
          <Text style={styles.modBannerSub}>
            Posts flagged by residents for spam, scalping, or inappropriate content.
          </Text>
        </View>
      )}

      {/* Empty State for Moderation */}
      {selectedCategory === 'moderation' && reportedPosts.length === 0 && (
        <View style={styles.emptyModBox}>
          <Text style={styles.emptyModIcon}>✨</Text>
          <Text style={styles.emptyModTitle}>No flagged posts!</Text>
          <Text style={styles.emptyModDesc}>
            All Timișoara community posts are verified. Feed is clean and safe.
          </Text>
        </View>
      )}

      {/* Community Groups View */}
      {selectedCategory === 'groups' && (
        <ScrollView style={styles.content}>
          <View style={styles.modBanner}>
            <Text style={styles.modBannerTitle}>👥 Timișoara Community Groups</Text>
            <Text style={styles.modBannerSub}>
              Join local neighborhood councils, student associations, and volunteer civic circles.
            </Text>
          </View>

          {[
            {
              id: 'grp-1',
              name: 'Fabric Creative Hub & Yard',
              area: 'Fabric',
              members: 142,
              desc: 'Artists, cultural organizers, and residents around Faber Yard and Traian Square.',
              tags: ['culture', 'art', 'events'],
            },
            {
              id: 'grp-2',
              name: 'UPT & UVT Student Socials',
              area: 'Complexul Studențesc',
              members: 380,
              desc: 'Campus news, study spots, student discounts, and indie social meetups.',
              tags: ['students', 'campus', 'study'],
            },
            {
              id: 'grp-3',
              name: 'Timișoara Lost & Found Pets Network',
              area: 'All Timișoara',
              members: 95,
              desc: 'Rapid rescue and alert coordination for lost dogs and cats in Timișoara.',
              tags: ['pets', 'rescue', 'emergency'],
            },
            {
              id: 'grp-4',
              name: 'Bega Clean & Green Volunteers',
              area: 'Iosefin / D’arc',
              members: 64,
              desc: 'Environmental cleanups along the Bega canal banks and eco-workshops.',
              tags: ['ecology', 'volunteering', 'bega'],
            },
          ].map((grp) => (
            <View key={grp.id} style={styles.postCard}>
              <View style={styles.badgeRow}>
                <Text style={styles.categoryBadge}>GROUP</Text>
                <Text style={styles.neighbourhoodBadge}>📍 {grp.area}</Text>
                <Text style={[styles.neighbourhoodBadge, { marginLeft: 'auto', color: '#c084fc' }]}>
                  👥 {grp.members} members
                </Text>
              </View>
              <Text style={styles.postTitle}>{grp.name}</Text>
              <Text style={styles.postContent}>{grp.desc}</Text>
              <View style={[styles.badgeRow, { marginTop: 10 }]}>
                {grp.tags.map((t) => (
                  <Text key={t} style={{ color: '#a855f7', fontSize: 10, marginRight: 8 }}>
                    #{t}
                  </Text>
                ))}
              </View>
              <View style={[styles.actionRow, { marginTop: 12 }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#8d23be' }]}
                  onPress={() => Alert.alert('Joined Group ✓', `You are now a member of ${grp.name}!`)}
                >
                  <Text style={[styles.actionBtnText, { color: '#ffffff', fontWeight: 'bold' }]}>
                    + Join Group
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={styles.actionBtnText}>View Posts →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Posts List */}
      {selectedCategory !== 'groups' && (
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
                  <Text style={[styles.reportText, forumStore.hasUserReported(post.id) && styles.reportTextActive]}>
                    {forumStore.hasUserReported(post.id) ? '⚠️ Reported' : post.isReported ? '⚠️ Flagged' : '⚑ Report'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.modReportPill}>
                  <Text style={styles.modReportPillText}>⚠️ {post.reportCount} reports</Text>
                </View>
              )}
            </View>

            {/* Moderation Warning Note */}
            {post.isReported && (
              <View style={styles.reportedReasonBox}>
                <Text style={styles.reportedReasonTitle}>Flag reason:</Text>
                <Text style={styles.reportedReasonText}>
                  {post.reportReason || 'Flagged by community for review'}
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
                <TouchableOpacity
                  style={[styles.actionBtn, forumStore.hasUserUpvoted(post.id) && styles.actionBtnUpvoted]}
                  onPress={() => handleUpvote(post.id)}
                >
                  <Text style={[styles.actionBtnText, forumStore.hasUserUpvoted(post.id) && styles.actionBtnTextUpvoted]}>
                    {forumStore.hasUserUpvoted(post.id) ? '👍 Upvoted' : '👍 Upvote'} ({post.upvotes})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    setActiveCommentsPostId(
                      activeCommentsPostId === post.id ? null : post.id
                    )
                  }
                >
                  <Text style={styles.actionBtnText}>💬 {post.commentsCount} Comments</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* MODERATOR CONTROL BUTTONS */
              <View style={styles.modActionRow}>
                <TouchableOpacity
                  style={styles.modApproveBtn}
                  onPress={() => handleApprovePost(post.id)}
                >
                  <Text style={styles.modApproveBtnText}>✓ Approve & Keep</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modDeleteBtn}
                  onPress={() => handleDeletePost(post.id)}
                >
                  <Text style={styles.modDeleteBtnText}>🗑️ Delete Post</Text>
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
                    placeholder="Write a reply..."
                    placeholderTextColor="#71717a"
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                  />
                  <TouchableOpacity
                    style={styles.sendCommentBtn}
                    onPress={() => handleAddComment(post.id)}
                  >
                    <Text style={styles.sendCommentText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      )}

      {/* Create Post Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Community Post</Text>

            <Text style={styles.inputLabel}>Category</Text>
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
                    {cat === 'lost_pets' ? '🐾 Pet' : cat === 'help' ? '🤝 Help' : '🏘️ Local'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Neighbourhood</Text>
            <TextInput
              style={styles.modalInput}
              value={newNeighbourhood}
              onChangeText={setNewNeighbourhood}
              placeholder="E.g. Fabric, Iosefin, Cetate, Elisabetin"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="What is this regarding?"
              placeholderTextColor="#71717a"
            />

            <Text style={styles.inputLabel}>Details</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              multiline
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Write the details of your post..."
              placeholderTextColor="#71717a"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handleCreatePost}
              >
                <Text style={styles.publishBtnText}>Publish</Text>
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
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  actionBtnUpvoted: {
    backgroundColor: '#3b0764',
    borderColor: '#9333ea',
  },
  actionBtnText: { color: '#a1a1aa', fontSize: 12, fontWeight: '500' },
  actionBtnTextUpvoted: { color: '#f3e8ff', fontWeight: 'bold' },
  reportTextActive: { color: '#ef4444', fontWeight: 'bold' },

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

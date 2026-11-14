import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { Avatar, Chip, Field, IconButton, PrimaryButton, RowGroup, SecondaryButton, Sheet, Text, TextButton, colors, fonts, icons, moduleArt, palette, radii } from '@hub/ui';
import { ModulePage } from '../../core/ModulePage';
import { initialsOf, toneFor } from '../../core/people';
import { forumStore, type Post } from './forumStore';

const CATEGORY_LABEL: Record<Post['category'], string> = {
  lost_pets: 'Lost pets',
  neighbourhood: 'Local',
  help: 'Help',
  buy_sell: 'Buy and sell',
  cultural: 'Culture',
};
// The dot before a post's category: apricot for something urgent, mint for people helping people, blue for local news.
const CATEGORY_DOT: Record<Post['category'], string> = {
  lost_pets: palette.apricot500,
  help: palette.mint500,
  neighbourhood: palette.blue500,
  buy_sell: palette.ink600,
  cultural: palette.blue500,
};
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'lost_pets', label: 'Lost pets' },
  { id: 'help', label: 'Help' },
  { id: 'neighbourhood', label: 'Local' },
  { id: 'groups', label: 'Groups' },
];
const NEW_CATEGORIES: { id: 'neighbourhood' | 'lost_pets' | 'help'; label: string }[] = [
  { id: 'neighbourhood', label: 'Local' },
  { id: 'lost_pets', label: 'Lost pet' },
  { id: 'help', label: 'Help' },
];
const AREAS = ['Cetate', 'Fabric', 'Iosefin', 'Elisabetin'];
const GROUPS = [
  { id: 'grp-1', name: 'Fabric Creative Hub & Yard', area: 'Fabric', members: 142, desc: 'Artists, cultural organizers, and residents around Faber Yard and Traian Square.', tags: ['culture', 'art', 'events'] },
  { id: 'grp-2', name: 'UPT & UVT Student Socials', area: 'Complexul Studențesc', members: 380, desc: 'Campus news, study spots, student discounts, and indie social meetups.', tags: ['students', 'campus', 'study'] },
  { id: 'grp-3', name: 'Timișoara Lost & Found Pets Network', area: 'All Timișoara', members: 95, desc: 'Rapid rescue and alert coordination for lost dogs and cats in Timișoara.', tags: ['pets', 'rescue'] },
  { id: 'grp-4', name: 'Bega Clean & Green Volunteers', area: 'Iosefin and D’arc', members: 64, desc: 'Environmental cleanups along the Bega canal banks and eco-workshops.', tags: ['ecology', 'volunteering', 'bega'] },
];
const QUICK_REPLIES = ['Thanks for sharing', 'I can help with this', 'Where exactly?'];

export function ForumScreen({ embedded }: { embedded?: boolean }) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetMax = Math.round(windowHeight * 0.72);

  const [posts, setPosts] = useState<Post[]>(forumStore.getPosts());
  useEffect(() => forumStore.subscribe(() => setPosts(forumStore.getPosts())), []);
  const reported = posts.filter((p) => p.isReported);

  const [filter, setFilter] = useState<string>('all');
  const [moderation, setModeration] = useState(false);
  const feed = moderation ? reported : posts.filter((p) => filter === 'all' || p.category === filter);

  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const commentPost = posts.find((p) => p.id === commentsFor) ?? null;
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [joined, setJoined] = useState<string[]>([]);

  // writing a post
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState({ title: '', content: '', category: 'neighbourhood' as 'neighbourhood' | 'lost_pets' | 'help', area: 'Cetate' });
  const canPublish = draft.title.trim().length > 0 && draft.content.trim().length > 0;
  const publish = () => {
    if (!canPublish) return;
    forumStore.createPost({ title: draft.title, content: draft.content, category: draft.category, neighbourhood: draft.area, authorName: 'You' });
    setWriting(false);
    setDraft({ title: '', content: '', category: 'neighbourhood', area: 'Cetate' });
    setModeration(false);
    setFilter('all');
  };

  return (
    <ModulePage title="Forum" embedded={embedded}>
      <View style={styles.head}>
        <Text variant="rowDetail" color="mutedForeground" style={{ flex: 1 }}>
          What your neighbours are talking about
        </Text>
        <PrimaryButton label="New post" size="md" onPress={() => setWriting(true)} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            selected={!moderation && filter === f.id}
            onPress={() => {
              setModeration(false);
              setFilter(f.id);
            }}
          />
        ))}
        <Chip label={reported.length ? `Moderation, ${reported.length}` : 'Moderation'} selected={moderation} onPress={() => setModeration(true)} />
      </ScrollView>

      {moderation ? (
        <Text variant="rowDetail" color="mutedForeground" style={styles.note}>
          Posts that residents flagged for spam or inappropriate content.
        </Text>
      ) : null}

      {!moderation && filter === 'groups' ? (
        <RowGroup>
          {GROUPS.map((g) => {
            const isIn = joined.includes(g.id);
            return (
              <View key={g.id} style={styles.post}>
                <Avatar initials={initialsOf(g.name)} tone={toneFor(g.id)} size={44} />
                <View style={styles.postMain}>
                  <Text variant="subheading">{g.name}</Text>
                  <Text variant="rowDetail" color="mutedForeground">
                    {g.area}, {g.members + (isIn ? 1 : 0)} members
                  </Text>
                  <Text variant="body" style={{ marginTop: 6 }}>
                    {g.desc}
                  </Text>
                  <View style={styles.tags}>
                    {g.tags.map((t) => (
                      <Text key={t} variant="label" color="info">
                        #{t}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.actions}>
                    {isIn ? (
                      <SecondaryButton label="Joined" size="md" onPress={() => setJoined(joined.filter((x) => x !== g.id))} />
                    ) : (
                      <SecondaryButton label="Join group" size="md" onPress={() => setJoined([...joined, g.id])} />
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </RowGroup>
      ) : feed.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="subheading" accessibilityRole="header">
            {moderation ? 'Nothing flagged' : 'No posts here yet'}
          </Text>
          <Text variant="body" color="mutedForeground" style={{ textAlign: 'center' }}>
            {moderation ? 'Every post is verified. The feed is clean.' : 'Start the conversation with a new post.'}
          </Text>
        </View>
      ) : (
        <RowGroup>
          {feed.map((post) => {
            const upvoted = forumStore.hasUserUpvoted(post.id);
            const iReported = forumStore.hasUserReported(post.id);
            return (
              <View key={post.id} style={styles.post}>
                <Avatar initials={initialsOf(post.authorName)} tone={toneFor(post.authorName)} size={44} />
                <View style={styles.postMain}>
                  <View style={styles.byline}>
                    <Text variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {post.authorName}
                    </Text>
                    <Text variant="rowDetail" color="mutedForeground" numberOfLines={1}>
                      {post.createdAt}
                    </Text>
                  </View>
                  <View style={styles.category}>
                    <View style={[styles.dot, { backgroundColor: CATEGORY_DOT[post.category] }]} />
                    <Text variant="caption" color="mutedForeground">
                      {CATEGORY_LABEL[post.category]}, {post.neighbourhood}
                    </Text>
                  </View>
                  <Text variant="subheading" style={{ marginTop: 8 }}>
                    {post.title}
                  </Text>
                  <Text variant="body" style={{ marginTop: 4 }}>
                    {post.content}
                  </Text>
                  {post.photos[0] ? <Image source={{ uri: post.photos[0] }} accessibilityLabel={`Photo for ${post.title}`} style={styles.photo} /> : null}
                  {post.isReported ? (
                    <Text variant="rowDetail" color="warning" style={{ marginTop: 8 }}>
                      {moderation ? `Flagged ${post.reportCount} ${post.reportCount === 1 ? 'time' : 'times'}: ${post.reportReason || 'Flagged by residents'}` : 'Flagged for review'}
                    </Text>
                  ) : null}

                  {moderation ? (
                    <View style={styles.actions}>
                      <SecondaryButton label="Keep post" size="md" onPress={() => forumStore.approvePost(post.id)} />
                      <TextButton label="Remove" size="md" onPress={() => setRemoveId(post.id)} />
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <Pill
                        label={`${upvoted ? 'Remove upvote' : 'Upvote'}, ${post.upvotes}`}
                        text={String(post.upvotes)}
                        active={upvoted}
                        icon={(c) => <icons.ThumbsUp size={18} weight={upvoted ? 'fill' : 'bold'} color={c} />}
                        onPress={() => forumStore.toggleUpvote(post.id)}
                      />
                      <Pill label={`Comments, ${post.commentsCount}`} text={String(post.commentsCount)} icon={(c) => <icons.ChatCircle size={18} weight="bold" color={c} />} onPress={() => setCommentsFor(post.id)} />
                      <View style={{ flex: 1 }} />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={iReported ? 'Reported' : 'Report this post'}
                        onPress={() => forumStore.reportPost(post.id, 'Flagged by a resident for review')}
                        hitSlop={8}
                        style={({ pressed }) => [styles.report, pressed && { opacity: 0.6 }]}
                      >
                        <icons.Flag size={18} weight={iReported ? 'fill' : 'bold'} color={iReported ? colors.warning : colors.mutedForeground} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </RowGroup>
      )}

      {/* comments */}
      <Sheet modal visible={!!commentPost} onClose={() => setCommentsFor(null)} accessibilityLabel="Comments">
        {commentPost ? <Comments post={commentPost} maxHeight={Math.round(windowHeight * 0.42)} /> : null}
      </Sheet>

      {/* confirm a removal */}
      <Sheet modal visible={!!removeId} onClose={() => setRemoveId(null)} accessibilityLabel="Remove post">
        <View style={{ gap: 12 }}>
          <Text variant="heading" accessibilityRole="header">
            Remove this post?
          </Text>
          <Text variant="body" color="mutedForeground">
            It will be taken off the forum for everyone. This cannot be undone.
          </Text>
          <View style={{ gap: 8, marginTop: 4 }}>
            <SecondaryButton
              label="Remove post"
              size="lg"
              onPress={() => {
                if (removeId) forumStore.deletePost(removeId);
                setRemoveId(null);
              }}
            />
            <TextButton label="Keep it" size="lg" onPress={() => setRemoveId(null)} />
          </View>
        </View>
      </Sheet>

      {/* write a post */}
      <Sheet modal visible={writing} onClose={() => setWriting(false)} accessibilityLabel="New post">
        <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text variant="heading" accessibilityRole="header">
            New post
          </Text>
          <Text variant="subheading">What is it about?</Text>
          <View style={styles.wrap}>
            {NEW_CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} selected={draft.category === c.id} onPress={() => setDraft({ ...draft, category: c.id })} />
            ))}
          </View>
          <Text variant="subheading">Where</Text>
          <View style={styles.wrap}>
            {AREAS.map((a) => (
              <Chip key={a} label={a} selected={draft.area === a} onPress={() => setDraft({ ...draft, area: a })} />
            ))}
          </View>
          <Field label="Title" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} maxLength={90} />
          <Field label="Details" value={draft.content} onChangeText={(content) => setDraft({ ...draft, content })} multiline maxLength={400} />
          <PrimaryButton label="Publish" size="lg" disabled={!canPublish} onPress={publish} />
          {!canPublish ? (
            <Text variant="rowDetail" color="mutedForeground" style={{ textAlign: 'center' }}>
              Add a title and some details to publish.
            </Text>
          ) : null}
        </ScrollView>
      </Sheet>
    </ModulePage>
  );
}

/** An action under a post: an icon and a count in a soft pill. Ink when it is on. */
function Pill({ label, text, icon, onPress, active }: { label: string; text: string; icon: (color: string) => React.ReactNode; onPress: () => void; active?: boolean }) {
  const fg = active ? colors.inverseForeground : colors.foreground;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active }} onPress={onPress} hitSlop={{ top: 4, bottom: 4 }} style={({ pressed }) => [styles.pill, active && styles.pillOn, pressed && { opacity: 0.7 }]}>
      {icon(fg)}
      <Text variant="label" style={{ color: fg }}>
        {text}
      </Text>
    </Pressable>
  );
}

/** The comments on a post: the post in brief, the replies with their authors, and a composer that stays at the bottom. */
function Comments({ post, maxHeight }: { post: Post; maxHeight: number }) {
  const [text, setText] = useState('');
  const send = (value = text) => {
    if (!value.trim()) return;
    forumStore.addComment(post.id, 'You', value);
    setText('');
  };
  const Art = moduleArt.forum;
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.sheetHead}>
        <Text variant="subheading" accessibilityRole="header">
          Comments
        </Text>
        <Text variant="label" color="mutedForeground">
          {post.comments.length}
        </Text>
      </View>

      <View style={styles.summary}>
        <Avatar initials={initialsOf(post.authorName)} tone={toneFor(post.authorName)} size={32} />
        <View style={{ flex: 1 }}>
          <Text variant="label" numberOfLines={1}>
            {post.authorName}
          </Text>
          <Text variant="rowDetail" color="mutedForeground" numberOfLines={1}>
            {post.title}
          </Text>
        </View>
      </View>

      <ScrollView style={{ maxHeight, minHeight: 160 }} contentContainerStyle={{ gap: 18, paddingVertical: 4 }} showsVerticalScrollIndicator={false}>
        {post.comments.length === 0 ? (
          <View style={styles.noReplies}>
            <Art size={72} />
            <Text variant="subheading" accessibilityRole="header">
              No replies yet
            </Text>
            <Text variant="rowDetail" color="mutedForeground" style={{ textAlign: 'center' }}>
              Be the first to answer {post.authorName.split(' ')[0]}.
            </Text>
            <View style={styles.suggestions}>
              {QUICK_REPLIES.map((q) => (
                <Chip key={q} label={q} onPress={() => setText(q)} />
              ))}
            </View>
          </View>
        ) : (
          post.comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Avatar initials={initialsOf(c.authorName)} tone={toneFor(c.authorName)} size={32} />
              <View style={{ flex: 1 }}>
                <View style={styles.byline}>
                  <Text variant="label">{c.authorName}</Text>
                  <Text variant="rowDetail" color="mutedForeground">
                    {c.createdAt}
                  </Text>
                </View>
                <Text variant="body" style={{ marginTop: 2 }}>
                  {c.content}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.composer}>
        <Avatar initials="YO" tone="ink" size={32} />
        <TextInput value={text} onChangeText={setText} placeholder="Write a reply" placeholderTextColor={colors.mutedForeground} accessibilityLabel="Reply" returnKeyType="send" onSubmitEditing={() => send()} style={styles.input} />
        <IconButton label="Send reply" tone="ink" size={44} onPress={() => send()}>
          <icons.PaperPlaneTilt size={20} weight="fill" color={colors.inverseForeground} />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, paddingHorizontal: 4 },
  chips: { marginTop: 14, marginHorizontal: -16, flexGrow: 0 },
  chipsContent: { gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  note: { marginTop: 12, paddingHorizontal: 4 },
  // a post: the avatar on the left anchors it, the content hangs from it, and the space around it separates it from the next
  post: { flexDirection: 'row', gap: 12, paddingTop: 22, paddingBottom: 22, paddingHorizontal: 2 },
  postMain: { flex: 1, minWidth: 0 },
  byline: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  category: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  photo: { width: '100%', height: 190, borderRadius: radii.group, marginTop: 12, backgroundColor: colors.secondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: radii.full, backgroundColor: colors.secondary },
  pillOn: { backgroundColor: colors.inverse },
  report: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  comment: { flexDirection: 'row', gap: 10 },
  noReplies: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  input: { flex: 1, minHeight: 44, borderRadius: radii.full, paddingHorizontal: 16, fontFamily: fonts.ui500, fontSize: 16, color: colors.foreground, backgroundColor: colors.background, boxShadow: 'inset 0 1px 2px rgba(26,16,51,0.07), 0 0 0 1px rgba(26,16,51,0.08)', outlineStyle: 'none' } as any,
});

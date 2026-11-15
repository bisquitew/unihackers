import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { FlatList, Modal, Platform, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Chip, IconButton, Text, colors, fonts, icons, radii, useKeyboardHeight, tr } from '@hub/ui';
import { initialsOf, toneFor } from '../../core/people';
import { chatStore, formatChatTime, type ChatMessage } from './chatStore';

const QUICK = ['See you at the entrance!', 'Grab a drink before?', 'I have my ticket!'];

/**
 * A full-screen conversation, like any messenger: back arrow and the person on top, messages in the middle, the message
 * box docked at the bottom and lifted by the keyboard. It is its own screen layer, so open it when no other sheet is closing.
 *
 * The list is a virtualised, inverted FlatList (newest at the bottom, no scroll-to-end bookkeeping), so a long conversation
 * stays cheap. The keyboard lift is measured, not assumed: Android may or may not have shrunk the window already, and
 * lifting by the keyboard's height on top of a window that already shrank pushes the whole chat off the screen.
 */
export function ChatRoom({ chatId, onClose }: { chatId: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();
  const [rootHeight, setRootHeight] = useState(0);
  useSyncExternalStore(
    (cb) => chatStore.subscribe(cb),
    () => chatStore.getVersion(),
  );
  const chat = chatId ? chatStore.get(chatId) : undefined;
  const [text, setText] = useState('');
  const openRef = useRef(false);
  openRef.current = !!chatId;

  // reading the chat clears its unread count, including replies that arrive while it is open
  const count = chat?.messages.length ?? 0;
  useEffect(() => {
    if (chatId) chatStore.markRead(chatId);
  }, [chatId, count]);
  useEffect(() => setText(''), [chatId]);

  // newest first, for the inverted list
  const data = useMemo(() => [...(chat?.messages ?? [])].reverse(), [chat?.messages]);

  if (!chatId || !chat) return null;
  const { buddy } = chat;
  const send = (value: string) => {
    if (!value.trim()) return;
    chatStore.send(chat.id, value, () => openRef.current);
    setText('');
  };

  // the container is clearly shorter than the window once the keyboard is up: the system already made room for it
  const alreadyResized = keyboard > 0 && rootHeight > 0 && rootHeight < windowHeight - keyboard * 0.5;
  const lift = keyboard > 0 && !alreadyResized ? keyboard : 0;
  const sentAny = chat.messages.some((m) => m.from === 'me');

  const renderMessage = ({ item: m }: { item: ChatMessage }) => (
    <View style={[styles.bubble, m.from === 'me' ? styles.mine : styles.theirs]}>
      <Text variant="body" color={m.from === 'me' ? 'inverseForeground' : 'foreground'} style={{ fontSize: 15, lineHeight: 21 }}>
        {m.text}
      </Text>
      <Text variant="caption" color={m.from === 'me' ? 'inverseForeground' : 'mutedForeground'} style={{ opacity: 0.7 }}>
        {formatChatTime(m.at)}
      </Text>
    </View>
  );

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root} onLayout={(e) => setRootHeight(e.nativeEvent.layout.height)}>
        <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: lift > 0 ? lift : keyboard > 0 ? 8 : Math.max(insets.bottom, 8) }]}>
          <View style={styles.header}>
            <IconButton label="Back to chats" tone="light" size={44} onPress={onClose}>
              <icons.CaretLeft size={22} weight="bold" color={colors.foreground} />
            </IconButton>
            <Avatar initials={initialsOf(buddy.userName)} tone={toneFor(buddy.id)} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="subheading" numberOfLines={1} accessibilityRole="header">
                {buddy.userName}
              </Text>
              <Text variant="rowDetail" color="mutedForeground" numberOfLines={1}>
                Going to {buddy.eventTitle}
              </Text>
            </View>
          </View>

          <FlatList
            style={styles.list}
            data={data}
            inverted
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            windowSize={9}
          />

          {/* suggested openers, only until you have sent something */}
          {sentAny ? null : (
            <View style={styles.quick}>
              <FlatList
                horizontal
                data={QUICK}
                keyExtractor={(q) => q}
                renderItem={({ item: q }) => <Chip label={q} onPress={() => send(q)} />}
                ItemSeparatorComponent={Gap}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            </View>
          )}
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={tr('Write a message')}
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel="Message"
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => send(text)}
              style={styles.input}
            />
            <IconButton label="Send message" tone="ink" size={44} onPress={() => send(text)}>
              <icons.PaperPlaneTilt size={20} weight="fill" color={colors.inverseForeground} />
            </IconButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const Separator = () => <View style={{ height: 8 }} />;
const Gap = () => <View style={{ width: 8 }} />;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  list: { flex: 1 },
  messages: { paddingHorizontal: 16, paddingVertical: 14 },
  bubble: { maxWidth: '82%', paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.input, gap: 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.inverse },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.secondary },
  quick: { flexGrow: 0, paddingVertical: 8 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 4, paddingBottom: Platform.OS === 'ios' ? 4 : 8 },
  input: { flex: 1, minHeight: 44, borderRadius: radii.full, paddingHorizontal: 16, fontFamily: fonts.ui500, fontSize: 16, color: colors.foreground, backgroundColor: colors.secondary, outlineStyle: 'none' } as any,
});

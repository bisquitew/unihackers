import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackLink, Chip, IconButton, Row, RowGroup, Text, TextButton, colors, fonts, icons, moduleArt, radii, useKeyboardHeight } from '@hub/ui';
import { registeredModuleManifests } from '../index';
import { sendChat, type ChatTurn, type ToolUse } from './api';
import { ListenButton } from './voice/ListenButton';
import { guessLang, speak, startRecording, stopSpeaking, transcribe, voiceAvailable, webVoiceSupported, type Recording } from './voice/voiceClient';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  toolsUsed?: ToolUse[];
}

const MAX_HISTORY = 20;
const MAX_MESSAGE = 2000;

// Sample questions in both languages on purpose: the assistant answers in the language you ask in.
const SUGGESTIONS = [
  'Am apă caldă în Complexul Studențesc?',
  'S-a pierdut vreun animal în Fabric?',
  'What events are on tonight?',
  'Is tram 5 running or detoured?',
];

const moduleTitle = (id: string) => registeredModuleManifests.find((m) => m.id === id)?.title ?? id;
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * The city assistant, laid out like the other chats in the app: back link and title on top, the conversation in the
 * middle, the message box docked at the bottom and lifted by the keyboard. Before the first question it shows
 * a few things to try.
 */
export function AssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ text: string; failedMessage: string } | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  // Voice (web only for now): mic -> /stt -> chat, replies -> /tts. Never blocks the text chat.
  const [voiceOn, setVoiceOn] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [mic, setMic] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [voiceError, setVoiceError] = useState('');
  const recording = useRef<Recording | null>(null);
  const autoReadRef = useRef(autoRead);
  autoReadRef.current = autoRead;

  useEffect(() => {
    if (!webVoiceSupported()) return;
    let alive = true;
    voiceAvailable().then((ok) => alive && setVoiceOn(ok));
    return () => {
      alive = false;
      recording.current?.cancel();
      stopSpeaking();
    };
  }, []);

  const ask = async (text: string, previous: Message[]) => {
    const message = text.trim();
    if (!message || loading) return;
    const history: ChatTurn[] = previous.slice(-MAX_HISTORY).map((m) => ({ role: m.role, text: m.text }));
    setMessages([...previous, { id: newId(), role: 'user', text: message }]);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const { reply, toolsUsed } = await sendChat(message, history);
      setMessages((current) => [...current, { id: newId(), role: 'model', text: reply, toolsUsed }]);
      if (autoReadRef.current) {
        speak(reply, guessLang(reply)).catch((e) => setVoiceError(e instanceof Error ? e.message : 'Voice is not available right now.'));
      }
    } catch (e) {
      setError({ text: e instanceof Error ? e.message : 'The assistant is not answering right now.', failedMessage: message });
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = async () => {
    setVoiceError('');
    if (mic === 'recording') {
      const rec = recording.current;
      recording.current = null;
      if (!rec) return;
      setMic('transcribing');
      try {
        const audio = await rec.stop();
        const { text } = await transcribe(audio);
        setMic('idle');
        await ask(text, messagesRef.current);
      } catch (e) {
        setMic('idle');
        setVoiceError(e instanceof Error ? e.message : 'I could not understand the recording.');
      }
      return;
    }
    if (mic !== 'idle' || loading) return;
    stopSpeaking();
    try {
      recording.current = await startRecording(() => void toggleMicRef.current());
      setMic('recording');
    } catch {
      setVoiceError('I cannot use the microphone. Check the browser permission.');
    }
  };
  const toggleMicRef = useRef(toggleMic);
  toggleMicRef.current = toggleMic;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const retry = () => {
    if (!error) return;
    // Drop the failed user bubble and send it again with the same history.
    const previous = messages.slice(0, -1);
    void ask(error.failedMessage, previous);
  };

  const Art = moduleArt.assistant;
  const empty = messages.length === 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: keyboard > 0 ? keyboard : Math.max(insets.bottom, 8) }]}>
      <View style={styles.top}>
        <BackLink label="Back" onPress={() => router.back()} />
        <Text variant="heading" accessibilityRole="header">
          City assistant
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {empty ? (
          <View style={{ gap: 18 }}>
            <View style={styles.intro}>
              <Art size={52} />
              <Text variant="body" color="mutedForeground" style={{ flex: 1 }}>
                Ask about events, outages, trams, lost pets or parking. Ask in Romanian or English.
              </Text>
            </View>
            <View>
              <Text variant="section" accessibilityRole="header" style={{ marginBottom: 4 }}>
                Try asking
              </Text>
              <RowGroup>
                {SUGGESTIONS.map((s) => (
                  <Row key={s} onPress={() => ask(s, messages)} accessibilityLabel={s}>
                    <Row.Body>
                      <Row.Title>{s}</Row.Title>
                    </Row.Body>
                    <Row.Trailing>
                      <icons.CaretRight size={18} color={colors.mutedForeground} />
                    </Row.Trailing>
                  </Row>
                ))}
              </RowGroup>
            </View>
          </View>
        ) : null}

        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.modelBubble]}>
            <Text variant="body" color={m.role === 'user' ? 'inverseForeground' : 'foreground'} style={styles.bubbleText}>
              {m.text}
            </Text>
            {m.role === 'model' && m.toolsUsed && m.toolsUsed.length > 0 ? (
              <Text variant="caption" color="mutedForeground" style={{ marginTop: 6 }}>
                Sources: {[...new Set(m.toolsUsed.map((t) => moduleTitle(t.moduleId)))].join(' · ')}
              </Text>
            ) : null}
            {m.role === 'model' && voiceOn ? <ListenButton text={m.text} /> : null}
          </View>
        ))}

        {loading ? (
          <View style={[styles.bubble, styles.modelBubble, styles.loadingBubble]}>
            <ActivityIndicator color={colors.foreground} size="small" />
            <Text variant="rowDetail" color="mutedForeground">
              Looking it up…
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={{ gap: 2, alignItems: 'flex-start' }}>
            <Text variant="body" color="danger" accessibilityRole="alert">
              {error.text}
            </Text>
            <TextButton label="Try again" size="md" onPress={retry} />
          </View>
        ) : null}
      </ScrollView>

      {voiceOn ? (
        <View style={styles.voiceRow}>
          <Text variant="rowDetail" color="mutedForeground">
            Read answers aloud
          </Text>
          <Switch
            value={autoRead}
            onValueChange={(v) => {
              setAutoRead(v);
              if (!v) stopSpeaking();
            }}
            accessibilityLabel="Read answers aloud"
            trackColor={{ false: colors.secondaryPressed, true: colors.success }}
            thumbColor="#FFFFFF"
          />
        </View>
      ) : null}
      {voiceError ? (
        <Text variant="caption" color="danger" style={styles.note}>
          {voiceError}
        </Text>
      ) : null}
      {mic === 'recording' ? (
        <Text variant="caption" color="danger" style={styles.note}>
          Listening… tap the microphone again when you are done (30 s at most)
        </Text>
      ) : null}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question"
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel="Your question"
          maxLength={MAX_MESSAGE}
          multiline
          onSubmitEditing={() => ask(input, messages)}
          blurOnSubmit
          returnKeyType="send"
        />
        {voiceOn ? (
          <IconButton label={mic === 'recording' ? 'Stop recording and send' : 'Speak to the assistant'} tone={mic === 'recording' ? 'primary' : 'light'} size={44} onPress={toggleMic}>
            {mic === 'transcribing' ? (
              <ActivityIndicator color={colors.foreground} size="small" />
            ) : mic === 'recording' ? (
              <icons.Stop size={20} weight="fill" color={colors.primaryForeground} />
            ) : (
              <icons.Microphone size={20} weight="bold" color={colors.foreground} />
            )}
          </IconButton>
        ) : null}
        <IconButton label="Send" tone="ink" size={44} onPress={() => ask(input, messages)}>
          <icons.PaperPlaneTilt size={20} weight="fill" color={colors.inverseForeground} />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: 16, paddingBottom: 4 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bubble: { maxWidth: '86%', borderRadius: radii.input, paddingVertical: 10, paddingHorizontal: 14 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.inverse },
  modelBubble: { alignSelf: 'flex-start', backgroundColor: colors.secondary },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 },
  note: { paddingHorizontal: 16, paddingTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontFamily: fonts.ui500, fontSize: 16, color: colors.foreground, backgroundColor: colors.secondary, outlineStyle: 'none' } as any,
});

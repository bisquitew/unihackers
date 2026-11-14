import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ScrollViewInstance,
} from 'react-native';
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

const SUGGESTIONS = [
  'Am apă caldă în Complexul Studențesc?',
  'S-a pierdut vreun animal în Fabric?',
  'What events are on tonight?',
  'Is tram 5 running or detoured?',
];

const moduleTitle = (id: string) => registeredModuleManifests.find((m) => m.id === id)?.title ?? id;
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function AssistantScreen() {
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
        speak(reply, guessLang(reply)).catch((e) => setVoiceError(e instanceof Error ? e.message : 'Vocea nu este disponibilă acum.'));
      }
    } catch (e) {
      setError({ text: e instanceof Error ? e.message : 'Asistentul nu răspunde acum.', failedMessage: message });
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
        setVoiceError(e instanceof Error ? e.message : 'Nu am înțeles înregistrarea.');
      }
      return;
    }
    if (mic !== 'idle' || loading) return;
    stopSpeaking();
    try {
      recording.current = await startRecording(() => void toggleMicRef.current());
      setMic('recording');
    } catch {
      setVoiceError('Nu pot folosi microfonul. Verifică permisiunea browserului.');
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.intro}>
            <Text style={styles.title}>Asistentul Orașului</Text>
            <Text style={styles.subtitle}>
              Întreabă despre evenimente, întreruperi, tramvaie, animale pierdute sau parcare. Ask in English too.
            </Text>
          </View>
        ) : null}

        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.modelBubble]}>
            <Text style={m.role === 'user' ? styles.userText : styles.modelText}>{m.text}</Text>
            {m.role === 'model' && m.toolsUsed && m.toolsUsed.length > 0 ? (
              <Text style={styles.sources}>
                Surse: {[...new Set(m.toolsUsed.map((t) => moduleTitle(t.moduleId)))].join(' · ')}
              </Text>
            ) : null}
            {m.role === 'model' && voiceOn ? <ListenButton text={m.text} /> : null}
          </View>
        ))}

        {loading ? (
          <View style={[styles.bubble, styles.modelBubble, styles.loadingBubble]}>
            <ActivityIndicator color="#c084fc" size="small" />
            <Text style={styles.loadingText}>Caut informații…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error.text}</Text>
            <TouchableOpacity onPress={retry} accessibilityRole="button">
              <Text style={styles.retryText}>Încearcă din nou</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <ScrollView horizontal style={styles.chipsRow} contentContainerStyle={styles.chips} showsHorizontalScrollIndicator={false}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity key={s} style={styles.chip} onPress={() => ask(s, messages)} disabled={loading}>
            <Text style={styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {voiceOn ? (
        <View style={styles.voiceRow}>
          <Text style={styles.voiceLabel}>🔊 Citește răspunsurile cu voce</Text>
          <Switch
            value={autoRead}
            onValueChange={(v) => {
              setAutoRead(v);
              if (!v) stopSpeaking();
            }}
            accessibilityLabel="Citește răspunsurile cu voce"
            trackColor={{ true: '#8d23be', false: '#3f3f46' }}
            thumbColor="#ffffff"
          />
        </View>
      ) : null}
      {voiceError ? <Text style={styles.voiceError}>{voiceError}</Text> : null}
      {mic === 'recording' ? <Text style={styles.recordingText}>● Te ascult… apasă din nou pe microfon când ai terminat (max. 30 s)</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Scrie o întrebare…"
          placeholderTextColor="#71717a"
          maxLength={MAX_MESSAGE}
          multiline
          onSubmitEditing={() => ask(input, messages)}
          blurOnSubmit
          returnKeyType="send"
        />
        {voiceOn ? (
          <TouchableOpacity
            style={[styles.micButton, mic === 'recording' && styles.micRecording, (loading || mic === 'transcribing') && styles.disabled]}
            onPress={toggleMic}
            disabled={loading || mic === 'transcribing'}
            accessibilityRole="button"
            accessibilityLabel={mic === 'recording' ? 'Oprește înregistrarea și trimite' : 'Vorbește cu asistentul'}
          >
            {mic === 'transcribing' ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.sendText}>{mic === 'recording' ? '⏹' : '🎤'}</Text>}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.disabled]}
          onPress={() => ask(input, messages)}
          disabled={!input.trim() || loading}
          accessibilityLabel="Trimite"
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8 },
  intro: { marginBottom: 12 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#a1a1aa', fontSize: 14, lineHeight: 20 },
  bubble: { maxWidth: '85%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#8d23be', borderBottomRightRadius: 4 },
  modelBubble: { alignSelf: 'flex-start', backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderBottomLeftRadius: 4 },
  userText: { color: '#ffffff', fontSize: 15, lineHeight: 21 },
  modelText: { color: '#e4e4e7', fontSize: 15, lineHeight: 21 },
  sources: { color: '#71717a', fontSize: 12, marginTop: 6 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#a1a1aa', fontSize: 14 },
  errorBox: { borderColor: '#7f1d1d', borderWidth: 1, backgroundColor: '#1c1917', borderRadius: 12, padding: 12, marginBottom: 10 },
  errorText: { color: '#f87171', fontSize: 14, marginBottom: 6 },
  retryText: { color: '#c084fc', fontWeight: '600' },
  chipsRow: { flexGrow: 0 },
  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: { borderColor: '#27272a', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#18181b' },
  chipText: { color: '#d4d4d8', fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopColor: '#27272a', borderTopWidth: 1 },
  input: { flex: 1, maxHeight: 120, backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 15 },
  sendButton: { backgroundColor: '#8d23be', borderRadius: 12, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#ffffff', fontSize: 18 },
  disabled: { opacity: 0.5 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 },
  voiceLabel: { color: '#d4d4d8', fontSize: 13 },
  voiceError: { color: '#f87171', fontSize: 13, paddingHorizontal: 16, paddingTop: 4 },
  recordingText: { color: '#f87171', fontSize: 13, paddingHorizontal: 16, paddingTop: 4 },
  micButton: { backgroundColor: '#27272a', borderColor: '#3f3f46', borderWidth: 1, borderRadius: 12, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  micRecording: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
});

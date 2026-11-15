// Voice for the assistant (ElevenLabs through our API; the key stays on the server).
// In a browser, recording uses MediaRecorder and playback an HTML audio element. On the phone it uses expo-audio:
// the spoken answer is saved to a cache file and played from there, and the microphone is recorded to a file that is
// sent to /stt. Both paths have the same functions, so the screens do not care which one runs.
import { Platform } from 'react-native';
import { AudioModule, RecordingPresets, createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { API_URL } from '../config';

const BASE = `${API_URL}/v1/m/assistant`;

export type VoiceLang = 'ro' | 'en';

const isNative = Platform.OS !== 'web';

/** True where the assistant can play audio and record the microphone: a phone, or a browser that allows it. */
export function webVoiceSupported(): boolean {
  if (isNative) return true;
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.Audio === 'function' &&
    typeof (window as unknown as { MediaRecorder?: unknown }).MediaRecorder === 'function' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/** Playback only needs an audio element (no microphone). */
export function webPlaybackSupported(): boolean {
  if (isNative) return true;
  return Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.Audio === 'function';
}

let statusPromise: Promise<boolean> | null = null;

/** Whether the server has voice configured (asked once per app session). */
export function voiceAvailable(): Promise<boolean> {
  statusPromise ??= fetch(`${BASE}/voice`)
    .then((r) => (r.ok ? r.json() : { configured: false }))
    .then((s: { configured?: boolean }) => Boolean(s.configured))
    .catch(() => false);
  return statusPromise;
}

/** Same idea as the server's speakable(): drop markdown symbols so they are not read aloud. */
export function stripMarkdown(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(\S(?:.*?\S)?)\1/g, '$2')
    .replace(/[*_~#|]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** Romanian if it has Romanian letters or common Romanian words, otherwise English. */
export function guessLang(text: string): VoiceLang {
  if (/[ăâîșşțţ]/i.test(text)) return 'ro';
  return /\b(este|sunt|și|pentru|în|nu|care|poți|acum|astăzi)\b/i.test(text) ? 'ro' : 'en';
}

async function errorMessage(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error || `Request failed (${res.status})`;
}

// --- Playback ---

const audioUrls = new Map<string, string>();
let current: HTMLAudioElement | null = null;
let nativePlayer: AudioPlayer | null = null;
let onStop: (() => void) | null = null;

export function stopSpeaking() {
  if (current) {
    current.pause();
    current = null;
  }
  if (nativePlayer) {
    try {
      nativePlayer.pause();
      nativePlayer.remove();
    } catch {
      /* already gone */
    }
    nativePlayer = null;
  }
  const done = onStop;
  onStop = null;
  done?.();
}

/**
 * Fetches (or reuses) the spoken version of `text` and plays it. Resolves when playback ends or is stopped.
 * `onStarted` fires once audio is ready, so buttons can switch from "loading" to "playing".
 */
export async function speak(text: string, lang: VoiceLang = guessLang(text), onStarted?: () => void): Promise<void> {
  const clean = stripMarkdown(text);
  if (!clean) return;
  stopSpeaking();
  if (isNative) return speakNative(clean, lang, onStarted);
  const key = `${lang}|${clean}`;
  let url = audioUrls.get(key);
  if (!url) {
    const res = await fetch(`${BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, lang }),
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    url = URL.createObjectURL(await res.blob());
    audioUrls.set(key, url);
  }
  const audio = new window.Audio(url);
  current = audio;
  return new Promise<void>((resolve, reject) => {
    onStop = resolve;
    audio.onended = () => {
      if (current === audio) current = null;
      onStop = null;
      resolve();
    };
    audio.onerror = () => {
      if (current === audio) current = null;
      onStop = null;
      reject(new Error('Could not play the audio.'));
    };
    audio
      .play()
      .then(() => onStarted?.())
      .catch((e: unknown) => {
        if (current === audio) current = null;
        onStop = null;
        // Browsers block autoplay until the user has interacted with the page.
        reject(new Error(e instanceof Error && e.name === 'NotAllowedError' ? 'Apasă pe 🔊 ca să asculți (browserul a blocat redarea automată).' : 'Could not play the audio.'));
      });
  });
}

/** Phone: fetch the speech, save it to a cache file, play it, and resolve when it ends or is stopped. */
async function speakNative(clean: string, lang: VoiceLang, onStarted?: () => void): Promise<void> {
  const key = `${lang}|${clean}`;
  let uri = audioUrls.get(key);
  if (!uri) {
    const res = await fetch(`${BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, lang }),
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    const bytes = new Uint8Array(await res.arrayBuffer());
    const file = new File(Paths.cache, `hop-voice-${Date.now().toString(36)}-${audioUrls.size}.mp3`);
    file.create({ overwrite: true });
    file.write(bytes);
    uri = file.uri;
    audioUrls.set(key, uri);
  }
  // play through the speaker even when the phone's silent switch is on (it is an answer the person asked for)
  await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  const player = createAudioPlayer({ uri });
  nativePlayer = player;
  return new Promise<void>((resolve, reject) => {
    onStop = resolve;
    const finish = () => {
      sub.remove();
      if (nativePlayer === player) {
        nativePlayer = null;
        try {
          player.remove();
        } catch {
          /* already gone */
        }
      }
      onStop = null;
    };
    let started = false;
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.playing && !started) {
        started = true;
        onStarted?.();
      }
      if (status.didJustFinish) {
        finish();
        resolve();
      }
    });
    try {
      player.play();
    } catch {
      finish();
      reject(new Error('Could not play the audio.'));
    }
  });
}

// --- Recording ---

export const MAX_RECORDING_MS = 30_000;

/** What a recording gives back: a Blob in a browser, a file on the phone. `transcribe` takes either. */
export type AudioClip = Blob | { uri: string; type: string };

export interface Recording {
  /** Stops and returns the audio. */
  stop: () => Promise<AudioClip>;
  /** Stops and throws the audio away. */
  cancel: () => void;
}

/** Phone: record the microphone to a file (m4a). Asks for permission the first time. */
async function startRecordingNative(onAutoStop?: () => void): Promise<Recording> {
  const permission = await AudioModule.requestRecordingPermissionsAsync();
  if (!permission.granted) throw new Error('The microphone is off for hop. Turn it on in your phone settings to speak.');
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await recorder.prepareToRecordAsync();
  recorder.record();
  const timer = setTimeout(() => {
    if (recorder.isRecording) onAutoStop?.();
  }, MAX_RECORDING_MS);
  const finish = async () => {
    clearTimeout(timer);
    try {
      if (recorder.isRecording) await recorder.stop();
    } finally {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    }
  };
  return {
    stop: async () => {
      await finish();
      if (!recorder.uri) throw new Error('Nothing was recorded.');
      return { uri: recorder.uri, type: 'audio/mp4' };
    },
    cancel: () => {
      void finish();
    },
  };
}

export async function startRecording(onAutoStop?: () => void): Promise<Recording> {
  if (isNative) return startRecordingNative(onAutoStop);
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const MR = (window as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder;
  const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MR.isTypeSupported?.(t));
  const recorder = new MR(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' }));
    };
  });
  recorder.start();
  const timer = setTimeout(() => {
    if (recorder.state === 'recording') onAutoStop?.();
  }, MAX_RECORDING_MS);
  return {
    stop: () => {
      clearTimeout(timer);
      if (recorder.state !== 'inactive') recorder.stop();
      return stopped;
    },
    cancel: () => {
      clearTimeout(timer);
      chunks.length = 0;
      if (recorder.state !== 'inactive') recorder.stop();
    },
  };
}

/** Sends a recording to /stt and returns the recognised text and language. */
export async function transcribe(audio: AudioClip): Promise<{ text: string; lang: string }> {
  if ('uri' in audio) {
    // phone: React Native uploads a file by its address
    const form = new FormData();
    form.append('file', { uri: audio.uri, name: 'speech.m4a', type: audio.type } as unknown as Blob);
    const res = await fetch(`${BASE}/stt`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(await errorMessage(res));
    return (await res.json()) as { text: string; lang: string };
  }
  const ext = audio.type.includes('ogg') ? 'ogg' : audio.type.includes('mp4') ? 'm4a' : audio.type.includes('mpeg') ? 'mp3' : 'webm';
  const form = new FormData();
  form.append('file', audio, `speech.${ext}`);
  const res = await fetch(`${BASE}/stt`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await errorMessage(res));
  return (await res.json()) as { text: string; lang: string };
}

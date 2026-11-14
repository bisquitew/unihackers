// Light / dark theme. The choice is saved on the device and read once, synchronously, at start so the very first frame
// is already in the right theme. Changing it later is live: the colour tokens are updated in place (tokens.ts) and the
// app tree is re-created (RootLayout subscribes with useThemeVersion). A babel plugin (apps/app/babel-plugin-live-theme.js)
// makes StyleSheet styles read the tokens each time they are used, so nothing keeps a stale colour.
//   web:    localStorage, and a page reload on change (react-native-web bakes styles into CSS at creation)
//   native: a tiny file in the app's document folder (expo-file-system reads it synchronously)
import { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

const KEY = 'hop_theme_v1';
const FILE = 'hop-theme.txt';
const RETURN_KEY = 'hop_return_v1';
const RETURN_FILE = 'hop-return.txt';

function readSaved(): ThemeMode {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { File, Paths } = require('expo-file-system');
      const file = new File(Paths.document, FILE);
      raw = file.exists ? file.textSync() : null;
    }
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'light';
  } catch {
    return 'light';
  }
}

/** The screen to come back to after a page reload (web only; read and cleared once, at start). */
export const returnTo: string | null = (() => {
  try {
    if (Platform.OS === 'web') {
      const v = typeof localStorage !== 'undefined' ? localStorage.getItem(RETURN_KEY) : null;
      if (v) localStorage.removeItem(RETURN_KEY);
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
})();

const resolve = (mode: ThemeMode) => mode === 'dark' || (mode === 'system' && Appearance.getColorScheme() === 'dark');

/** What the person chose. */
export let themeMode: ThemeMode = readSaved();

/** Whether the app is drawn dark right now. Live: other modules read it through the import binding. */
export let isDark: boolean = resolve(themeMode);

// tokens.ts registers here so the colour objects are updated before any screen re-renders
const appliers = new Set<() => void>();
export function registerThemeApplier(fn: () => void) {
  appliers.add(fn);
}

let version = 0;
let pendingReturn: string | null = null;
const listeners = new Set<() => void>();

/** Changes every time the theme changes. Subscribe with useSyncExternalStore (see useThemeVersion). */
export const themeStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getVersion: () => version,
  /** A screen to open again after the app tree is re-created (read once). */
  takeReturn(): string | null {
    const v = pendingReturn;
    pendingReturn = null;
    return v;
  },
};

function applyNow(comeBackTo: string | null) {
  isDark = resolve(themeMode);
  appliers.forEach((fn) => fn());
  pendingReturn = comeBackTo;
  version += 1;
  listeners.forEach((fn) => fn());
}

// "System" follows the phone: when its light/dark setting changes (by hand, or on its own schedule at sunset) the app follows at once
Appearance.addChangeListener(() => {
  if (themeMode !== 'system' || resolve('system') === isDark) return;
  if (Platform.OS === 'web') {
    try {
      location.reload();
    } catch {
      /* ignore */
    }
    return;
  }
  applyNow(null);
});

function persist(mode: ThemeMode) {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(KEY, mode);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { File, Paths } = require('expo-file-system');
    const file = new File(Paths.document, FILE);
    if (!file.exists) file.create();
    file.write(mode);
  } catch {
    /* the choice just will not survive a restart */
  }
}

/** Saves the choice and switches the whole app to it at once. `comeBackTo` is the screen to reopen afterwards. */
export function setThemeMode(mode: ThemeMode, comeBackTo?: string): void {
  themeMode = mode;
  persist(mode);
  if (Platform.OS === 'web') {
    // react-native-web turns styles into CSS when they are created, so on web the page is reloaded instead
    try {
      if (comeBackTo) localStorage.setItem(RETURN_KEY, comeBackTo);
      location.reload();
    } catch {
      /* ignore */
    }
    return;
  }
  applyNow(comeBackTo ?? null);
}

/** Re-renders the caller whenever the theme changes. Use it once, high in the tree, as a `key` so the tree is re-created. */
export function useThemeVersion(): number {
  return useSyncExternalStore(themeStore.subscribe, themeStore.getVersion, themeStore.getVersion);
}

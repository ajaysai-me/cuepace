import { useSyncExternalStore } from 'react';
import Storage from 'expo-sqlite/kv-store';
import type { NoteColor } from './theme';

/**
 * Everything lives on the device (SQLite key-value store). No server, no account.
 */

export type Script = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  /** Card background, Keep-style. */
  color?: NoteColor;
  /** Pinned scripts sit at the top of the grid. */
  pinned?: boolean;
};

/** A take recorded on the camera screen. The video file lives in the app's documents folder. */
export type Recording = {
  id: string;
  scriptId: string;
  /** Script title when it was recorded, so the take still has a name if the script is deleted. */
  scriptTitle: string;
  /** File name inside the recordings folder (not a full path, which can change between app updates). */
  file: string;
  /** Seconds. */
  duration: number;
  createdAt: number;
  savedToPhotos: boolean;
  /** Shown in the Liked tab. */
  liked?: boolean;
};

export type Profile = {
  name: string;
  /** Also save a copy of each new recording to the phone's photo library. */
  saveToPhotos: boolean;
  /** Finished (or skipped) the first-launch onboarding. */
  onboarded?: boolean;
};

export type PrompterTheme = 'dark' | 'light' | 'contrast';

export type Settings = {
  /** 1–30. Converted to pixels/second relative to font size. */
  speed: number;
  fontSize: number;
  /** Horizontal padding as a percentage of screen width (0–30). */
  margin: number;
  mirrorH: boolean;
  mirrorV: boolean;
  /** Seconds of 3-2-1 before scrolling starts. 0 disables it. */
  countdown: number;
  /** Show the eye-line marker the reader keeps the current line on. */
  cueLine: boolean;
  /** Where the eye line sits in the camera's script panel, as % from the top (10–70). */
  cuePosition: number;
  /** How dark the script panel over the camera is, in % (0 = clear, 90 = nearly solid). */
  overlayOpacity: number;
  align: 'left' | 'center';
  theme: PrompterTheme;
};

export const DEFAULT_SETTINGS: Settings = {
  speed: 6,
  fontSize: 40,
  margin: 6,
  mirrorH: false,
  mirrorV: false,
  countdown: 3,
  cueLine: true,
  cuePosition: 25,
  overlayOpacity: 55,
  align: 'left',
  theme: 'dark',
};

export const LIMITS = {
  speed: { min: 1, max: 30, step: 1 },
  fontSize: { min: 18, max: 96, step: 4 },
  margin: { min: 0, max: 30, step: 2 },
  cuePosition: { min: 10, max: 70, step: 5 },
  overlayOpacity: { min: 0, max: 90, step: 10 },
};

const DEFAULT_PROFILE: Profile = { name: '', saveToPhotos: true };

type State = { scripts: Script[]; settings: Settings; recordings: Recording[]; profile: Profile };

// Storage keys keep the old "cueline" prefix so scripts saved before the rename still load.
const SCRIPTS_KEY = 'cueline.scripts.v1';
const SETTINGS_KEY = 'cueline.settings.v1';
const RECORDINGS_KEY = 'cuepace.recordings.v1';
const PROFILE_KEY = 'cuepace.profile.v1';

const WELCOME: Script = {
  id: 'welcome',
  title: 'Welcome to CuePace',
  body:
    'Welcome to CuePace.\n\n' +
    'Tap the record button and your script starts scrolling at the top of the screen, right under the front camera, ' +
    'so you can read it while looking into the lens.\n\n' +
    'Keep your eyes on the marker line: it shows the line you should be reading right now.\n\n' +
    'Drag the handle under the script to make the text area bigger or smaller. ' +
    'Open settings to change the scroll speed, text size and countdown.\n\n' +
    'When you stop recording, your video is saved straight to your photo library.\n\n' +
    'Replace this text with your own script, and break a leg.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function readJSON<T>(key: string): T | null {
  try {
    const raw = Storage.getItemSync(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function load(): State {
  const scripts = readJSON<Script[]>(SCRIPTS_KEY) ?? [WELCOME];
  const settings = { ...DEFAULT_SETTINGS, ...(readJSON<Partial<Settings>>(SETTINGS_KEY) ?? {}) };
  const recordings = readJSON<Recording[]>(RECORDINGS_KEY) ?? [];
  const profile = { ...DEFAULT_PROFILE, ...(readJSON<Partial<Profile>>(PROFILE_KEY) ?? {}) };
  return { scripts, settings, recordings, profile };
}

let state: State = load();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  // Debounced so typing in the editor doesn't write on every keystroke.
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    Storage.setItemSync(SCRIPTS_KEY, JSON.stringify(state.scripts));
    Storage.setItemSync(SETTINGS_KEY, JSON.stringify(state.settings));
    Storage.setItemSync(RECORDINGS_KEY, JSON.stringify(state.recordings));
    Storage.setItemSync(PROFILE_KEY, JSON.stringify(state.profile));
  }, 300);
}

function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
  persist();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Selectors must return values already in state (not new objects), or React will re-render forever. */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export function getSettings() {
  return state.settings;
}

export function getState() {
  return state;
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const actions = {
  createScript(): string {
    const now = Date.now();
    const script: Script = { id: newId(), title: '', body: '', createdAt: now, updatedAt: now };
    setState({ ...state, scripts: [script, ...state.scripts] });
    return script.id;
  },
  updateScript(id: string, patch: Partial<Pick<Script, 'title' | 'body'>>) {
    setState({
      ...state,
      scripts: state.scripts.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s)),
    });
  },
  /** Colour or pin several scripts at once. Doesn't count as an edit. */
  updateScripts(ids: string[], patch: Partial<Pick<Script, 'color' | 'pinned'>>) {
    const set = new Set(ids);
    setState({ ...state, scripts: state.scripts.map((s) => (set.has(s.id) ? { ...s, ...patch } : s)) });
  },
  deleteScripts(ids: string[]) {
    const set = new Set(ids);
    setState({ ...state, scripts: state.scripts.filter((s) => !set.has(s.id)) });
  },
  deleteScript(id: string) {
    setState({ ...state, scripts: state.scripts.filter((s) => s.id !== id) });
  },
  duplicateScript(id: string): string | null {
    const src = state.scripts.find((s) => s.id === id);
    if (!src) return null;
    const now = Date.now();
    const copy: Script = {
      ...src,
      id: newId(),
      title: `${src.title || 'Untitled'} copy`,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    setState({ ...state, scripts: [copy, ...state.scripts] });
    return copy.id;
  },
  updateSettings(patch: Partial<Settings>) {
    setState({ ...state, settings: { ...state.settings, ...patch } });
  },
  addRecording(rec: Omit<Recording, 'id' | 'createdAt'> & { id?: string }): string {
    const recording: Recording = { ...rec, id: rec.id ?? newId(), createdAt: Date.now() };
    setState({ ...state, recordings: [recording, ...state.recordings] });
    return recording.id;
  },
  updateRecording(id: string, patch: Partial<Pick<Recording, 'savedToPhotos'>>) {
    setState({ ...state, recordings: state.recordings.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  },
  toggleRecordingLike(id: string) {
    setState({ ...state, recordings: state.recordings.map((r) => (r.id === id ? { ...r, liked: !r.liked } : r)) });
  },
  /** Removes the entry only; delete the file with deleteRecordingFile() from lib/recordings. */
  removeRecording(id: string) {
    setState({ ...state, recordings: state.recordings.filter((r) => r.id !== id) });
  },
  updateProfile(patch: Partial<Profile>) {
    setState({ ...state, profile: { ...state.profile, ...patch } });
  },
};

export function wordCount(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Spoken-word estimate at ~140 words per minute. */
export function readingTime(text: string) {
  const secs = Math.round((wordCount(text) / 140) * 60);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

/** 75 -> "1:15" */
export function formatDuration(totalSecs: number) {
  const t = Math.max(0, Math.round(totalSecs));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Take numbers per script, oldest take = 1. */
export function takeNumbers(recordings: Recording[]) {
  const byScript = new Map<string, Recording[]>();
  for (const r of recordings) byScript.set(r.scriptId, [...(byScript.get(r.scriptId) ?? []), r]);
  const numbers = new Map<string, number>();
  for (const list of byScript.values()) {
    list.sort((a, b) => a.createdAt - b.createdAt).forEach((r, i) => numbers.set(r.id, i + 1));
  }
  return numbers;
}

/** "Ada Lovelace" -> "AL" */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

/** "Today", "Yesterday" or "Nov 18". */
export function dayLabel(ts: number) {
  const d = new Date(ts);
  if (d.toDateString() === new Date().toDateString()) return 'Today';
  if (d.toDateString() === new Date(Date.now() - 86_400_000).toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

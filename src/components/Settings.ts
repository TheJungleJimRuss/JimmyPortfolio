/**
 * Settings model: the visitor's Screensaver, Phosphor color and CRT filter choices. Pure; storage is injected.
 * One versioned localStorage key. The inline head script in dev.html reads SETTINGS_KEY directly to set
 * `data-phosphor` before first paint: keep its key name and JSON shape (`{ v, settings: { phosphor, crt } }`) in sync.
 */

export type ScreensaverKind = 'letterDrift' | 'lineTrace' | 'bouncingName' | 'dronePatrol' | 'none';
export type IdleWait = 30 | 60 | 300; // seconds
export type PhosphorColor = 'green' | 'amber' | 'white' | 'blue';
/** The CRT filter is on or off; it has one look (the former High step). */
export type CrtFilter = 'on' | 'off';

export interface Settings {
  screensaver: ScreensaverKind;
  wait: IdleWait;
  phosphor: PhosphorColor;
  crt: CrtFilter;
}

export interface SettingsStorage {
  read(): string | null;
  write(value: string): void;
}

/** Keep in sync with the inline head script in dev.html. */
export const SETTINGS_KEY = 'portfolio.dev.settings';
const VERSION = 1;

export const SCREENSAVERS: readonly ScreensaverKind[] = ['letterDrift', 'lineTrace', 'bouncingName', 'dronePatrol', 'none'];
export const IDLE_WAITS: readonly IdleWait[] = [30, 60, 300];
export const PHOSPHORS: readonly PhosphorColor[] = ['green', 'amber', 'white', 'blue'];
export const CRT_FILTERS: readonly CrtFilter[] = ['on', 'off'];
/** Strengths stored before the CRT filter became an on/off toggle. */
const LEGACY_CRT_ON = ['low', 'med', 'high'];

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  screensaver: 'letterDrift',
  wait: 60,
  phosphor: 'green',
  crt: 'on',
});

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseSettings(raw: string | null): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  if (typeof data !== 'object' || data === null || (data as { v?: unknown }).v !== VERSION) {
    return { ...DEFAULT_SETTINGS };
  }
  const s = (data as { settings?: unknown }).settings;
  const f = (typeof s === 'object' && s !== null ? s : {}) as Record<string, unknown>;
  return {
    screensaver: pick(SCREENSAVERS, f.screensaver, DEFAULT_SETTINGS.screensaver),
    wait: pick(IDLE_WAITS, f.wait, DEFAULT_SETTINGS.wait),
    phosphor: pick(PHOSPHORS, f.phosphor, DEFAULT_SETTINGS.phosphor),
    crt: LEGACY_CRT_ON.includes(f.crt as string) ? 'on' : pick(CRT_FILTERS, f.crt, DEFAULT_SETTINGS.crt),
  };
}

export function serializeSettings(s: Settings): string {
  return JSON.stringify({ v: VERSION, settings: s });
}

export function loadSettings(storage: SettingsStorage): Settings {
  try {
    return parseSettings(storage.read());
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage: SettingsStorage, s: Settings): void {
  try {
    storage.write(serializeSettings(s));
  } catch {
    /* storage blocked or full: the choice still applies for this visit */
  }
}

/** localStorage-backed storage; each call may throw, which load/save swallow. */
export const localSettingsStorage: SettingsStorage = {
  read: () => localStorage.getItem(SETTINGS_KEY),
  write: (value) => localStorage.setItem(SETTINGS_KEY, value),
};

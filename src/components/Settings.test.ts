import { describe, it, expect } from 'vitest';
import {
  SCREENSAVERS,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  parseSettings,
  serializeSettings,
  loadSettings,
  saveSettings,
  type Settings,
  type SettingsStorage,
} from './Settings';

function memoryStorage(initial: string | null = null): SettingsStorage & { value: string | null } {
  const s = {
    value: initial,
    read: () => s.value,
    write: (v: string) => {
      s.value = v;
    },
  };
  return s;
}

const throwing: SettingsStorage = {
  read() {
    throw new Error('blocked');
  },
  write() {
    throw new Error('blocked');
  },
};

describe('DEFAULT_SETTINGS', () => {
  it('is lineTrace / 60 / green / CRT on', () => {
    expect(DEFAULT_SETTINGS).toEqual({ screensaver: 'lineTrace', wait: 60, phosphor: 'green', crt: 'on' });
  });
});

describe('parseSettings', () => {
  it('returns defaults for null, empty, corrupt or non-object input', () => {
    for (const raw of [null, '', '{nope', 'null', '42', '"x"', '[]']) {
      expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('returns defaults for an unknown version', () => {
    const raw = JSON.stringify({ v: 99, settings: { ...DEFAULT_SETTINGS, phosphor: 'amber' } });
    expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back field by field and keeps valid ones', () => {
    const raw = JSON.stringify({
      v: 1,
      settings: { screensaver: 'bogus', wait: 300, phosphor: 'amber', crt: 7 },
    });
    expect(parseSettings(raw)).toEqual({ ...DEFAULT_SETTINGS, wait: 300, phosphor: 'amber' });
  });

  it('round-trips every Screensaver value, including the new savers and random', () => {
    for (const kind of SCREENSAVERS) {
      const s: Settings = { ...DEFAULT_SETTINGS, screensaver: kind };
      expect(parseSettings(serializeSettings(s)).screensaver).toBe(kind);
    }
    for (const k of ['pathfinder', 'life', 'circuit', 'contours', 'terrain', 'random']) {
      expect(SCREENSAVERS).toContain(k);
    }
    for (const gone of ['letterDrift', 'oscilloscope', 'harmonograph', 'radar']) {
      expect(SCREENSAVERS).not.toContain(gone);
      const raw = JSON.stringify({ v: 1, settings: { ...DEFAULT_SETTINGS, screensaver: gone } });
      expect(parseSettings(raw).screensaver).toBe(DEFAULT_SETTINGS.screensaver);
    }
  });

  it('rejects a wait that is not 30, 60 or 300', () => {
    const raw = JSON.stringify({ v: 1, settings: { wait: 45 } });
    expect(parseSettings(raw).wait).toBe(60);
  });

  it('fills missing fields with defaults', () => {
    const raw = JSON.stringify({ v: 1, settings: { phosphor: 'blue' } });
    expect(parseSettings(raw)).toEqual({ ...DEFAULT_SETTINGS, phosphor: 'blue' });
  });
});

describe('serializeSettings', () => {
  it('round-trips every value', () => {
    const s: Settings = { screensaver: 'lineTrace', wait: 30, phosphor: 'white', crt: 'off' };
    expect(parseSettings(serializeSettings(s))).toEqual(s);
  });

  it('writes versioned JSON', () => {
    expect(JSON.parse(serializeSettings(DEFAULT_SETTINGS)).v).toBe(1);
  });
});

describe('loadSettings / saveSettings', () => {
  it('loads defaults from empty storage', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('saves then loads', () => {
    const storage = memoryStorage();
    const s: Settings = { ...DEFAULT_SETTINGS, phosphor: 'amber' };
    saveSettings(storage, s);
    expect(loadSettings(storage)).toEqual(s);
  });

  it('never throws when storage throws', () => {
    expect(loadSettings(throwing)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(throwing, DEFAULT_SETTINGS)).not.toThrow();
  });

  it('Reset: saving the defaults restores them', () => {
    const storage = memoryStorage();
    saveSettings(storage, { screensaver: 'none', wait: 300, phosphor: 'blue', crt: 'off' });
    saveSettings(storage, DEFAULT_SETTINGS);
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('SETTINGS_KEY', () => {
  it('is a non-empty string', () => {
    expect(SETTINGS_KEY).toMatch(/\S/);
  });
});

describe('CRT filter migration', () => {
  it('reads the old Low/Med/High strengths as on and Off as off', () => {
    const crtOf = (crt: string) => parseSettings(JSON.stringify({ v: 1, settings: { crt } })).crt;
    expect(['low', 'med', 'high'].map(crtOf)).toEqual(['on', 'on', 'on']);
    expect(crtOf('off')).toBe('off');
  });
  it('keeps on and off as stored', () => {
    for (const crt of ['on', 'off'] as const) {
      expect(parseSettings(serializeSettings({ ...DEFAULT_SETTINGS, crt })).crt).toBe(crt);
    }
  });
});

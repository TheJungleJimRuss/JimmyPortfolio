import { describe, it, expect } from 'vitest';
import { screensaverShouldShow, resolveSaverKind, type IdleInputs, type PlayableSaver } from './Screensaver';

const base: IdleInputs = {
  now: 0,
  lastInputAt: 0,
  wait: 60,
  kind: 'lineTrace',
  stagePlaying: false,
  hidden: false,
  previewing: false,
};
const at = (ms: number, over: Partial<IdleInputs> = {}): boolean => screensaverShouldShow({ ...base, now: ms, ...over });

describe('screensaverShouldShow', () => {
  it('shows exactly at the wait boundary and not before', () => {
    expect(at(59_999)).toBe(false);
    expect(at(60_000)).toBe(true);
    expect(at(120_000)).toBe(true);
  });
  it('measures from the last input', () => {
    expect(at(100_000, { lastInputAt: 50_000 })).toBe(false);
    expect(at(110_000, { lastInputAt: 50_000 })).toBe(true);
  });
  it('honours each wait', () => {
    expect(at(30_000, { wait: 30 })).toBe(true);
    expect(at(299_999, { wait: 300 })).toBe(false);
    expect(at(300_000, { wait: 300 })).toBe(true);
  });
  it('none keeps it off, even when previewing', () => {
    expect(at(1e9, { kind: 'none' })).toBe(false);
    expect(at(0, { kind: 'none', previewing: true })).toBe(false);
  });
  it('a playing stage keeps the idle saver off', () => {
    expect(at(1e9, { stagePlaying: true })).toBe(false);
  });
  it('a hidden tab keeps it off, even when previewing', () => {
    expect(at(1e9, { hidden: true })).toBe(false);
    expect(at(0, { hidden: true, previewing: true })).toBe(false);
  });
  it('preview shows at once for any kind but none (a playing stage still holds it off)', () => {
    expect(at(0, { previewing: true })).toBe(true);
    expect(at(0, { previewing: true, kind: 'lineTrace' })).toBe(true);
    expect(at(0, { previewing: true, stagePlaying: true })).toBe(false);
  });
});

describe('resolveSaverKind', () => {
  const pool: PlayableSaver[] = ['life', 'lineTrace', 'bouncingName'];

  it('passes concrete kinds through and maps none to null', () => {
    expect(resolveSaverKind('lineTrace', null, () => 0, pool)).toBe('lineTrace');
    expect(resolveSaverKind('terrain', 'terrain', () => 0, pool)).toBe('terrain');
    expect(resolveSaverKind('none', null, () => 0, pool)).toBeNull();
  });

  it('random never returns last when the pool has 2 or more', () => {
    for (const last of pool) {
      for (let r = 0; r < 1; r += 0.05) expect(resolveSaverKind('random', last, () => r, pool)).not.toBe(last);
    }
  });

  it('random can reach every other kind and never returns random or none', () => {
    const seen = new Set<string | null>();
    for (let r = 0; r < 1; r += 0.05) seen.add(resolveSaverKind('random', 'lineTrace', () => r, pool));
    expect([...seen].sort()).toEqual(['bouncingName', 'life']);
    expect(resolveSaverKind('random', null, () => 0.999, pool)).toBe('bouncingName');
  });

  it('random with a one-kind pool returns it even if it was last; empty pool gives null', () => {
    expect(resolveSaverKind('random', 'lineTrace', () => 0.5, ['lineTrace'])).toBe('lineTrace');
    expect(resolveSaverKind('random', null, () => 0.5, [])).toBeNull();
  });
});

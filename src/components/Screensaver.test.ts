import { describe, it, expect } from 'vitest';
import { screensaverShouldShow, type IdleInputs } from './Screensaver';

const base: IdleInputs = {
  now: 0,
  lastInputAt: 0,
  wait: 60,
  kind: 'letterDrift',
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

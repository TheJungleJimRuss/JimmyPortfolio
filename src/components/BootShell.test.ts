import { describe, it, expect } from 'vitest';
import {
  BOOT_MAX,
  DEFAULT_BOOT_LINES,
  OUTPUT_LINE_COUNT,
  buildBootSchedule,
  completeFrame,
  nextPhase,
  totalRows,
  validateBootLines,
  type BootLines,
} from './BootShell';

const lines: BootLines = { ...DEFAULT_BOOT_LINES, command: 'abc', output: ['1', '2', '3', '4'], final: 'f' };

describe('validateBootLines', () => {
  it('accepts the placeholder copy', () => {
    expect(validateBootLines(DEFAULT_BOOT_LINES)).toEqual([]);
  });

  it('rejects a wrong output line count', () => {
    expect(validateBootLines({ ...lines, output: ['1', '2'] })[0]).toContain(`exactly ${OUTPUT_LINE_COUNT}`);
  });

  it('rejects lines over their max length, empty lines and line breaks', () => {
    expect(validateBootLines({ ...lines, hint: 'x'.repeat(BOOT_MAX.hint + 1) })).toHaveLength(1);
    expect(validateBootLines({ ...lines, final: '' })).toHaveLength(1);
    expect(validateBootLines({ ...lines, command: 'a\nb' })).toHaveLength(1);
    expect(validateBootLines({ ...lines, output: ['1', '2', '3', 'x'.repeat(BOOT_MAX.outputLine + 1)] })).toHaveLength(1);
  });
});

describe('buildBootSchedule', () => {
  it('types the command one character at a time, then prints each row', () => {
    const frames = buildBootSchedule(lines, false);
    expect(frames.slice(0, 3).map((f) => f.commandChars)).toEqual([1, 2, 3]);
    expect(frames.slice(0, 3).every((f) => f.rows === 0)).toBe(true);
    expect(frames.slice(3).map((f) => f.rows)).toEqual([1, 2, 3, 4, 5]);
    expect(frames.slice(3).every((f) => f.commandChars === 3)).toBe(true);
  });

  it('has strictly increasing times, output faster than typing, ending on the complete frame', () => {
    const frames = buildBootSchedule(lines, false);
    for (let i = 1; i < frames.length; i++) expect(frames[i].atMs).toBeGreaterThan(frames[i - 1].atMs);
    const charGap = frames[1].atMs - frames[0].atMs;
    const rowGap = frames[frames.length - 1].atMs - frames[frames.length - 2].atMs;
    expect(rowGap).toBeLessThan(charGap);
    const last = frames[frames.length - 1];
    expect({ c: last.commandChars, r: last.rows }).toEqual({ c: 3, r: totalRows(lines) });
  });

  it('shows everything in one frame under reduced motion', () => {
    const frames = buildBootSchedule(lines, true);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toEqual(completeFrame(lines));
  });
});

describe('nextPhase', () => {
  it('waits until an input arrives, then prints', () => {
    expect(nextPhase('waiting', 'printDone', false)).toBe('waiting');
    expect(nextPhase('waiting', 'input', false)).toBe('printing');
  });

  it('a second input during printing hands over', () => {
    expect(nextPhase('printing', 'input', false)).toBe('handover');
  });

  it('hands over by itself after the hold when motion is allowed', () => {
    const p = nextPhase('printing', 'printDone', false);
    expect(p).toBe('printed');
    expect(nextPhase(p, 'holdDone', false)).toBe('handover');
    expect(nextPhase(p, 'input', false)).toBe('handover');
  });

  it('reduced motion: first input shows all at once, only a second input hands over', () => {
    const p = nextPhase('waiting', 'input', true);
    expect(p).toBe('printed');
    expect(nextPhase(p, 'holdDone', true)).toBe('printed');
    expect(nextPhase(p, 'input', true)).toBe('handover');
  });

  it('ignores everything once handed over', () => {
    for (const e of ['input', 'printDone', 'holdDone'] as const) expect(nextPhase('handover', e, false)).toBe('handover');
  });
});

import { describe, it, expect } from 'vitest';
import {
  NAME_TRACE_MS,
  OS_TRACE_MS,
  buildOsTrace,
  closedParts,
  osTraceEndMs,
  shouldTrace,
} from './DesktopTrace';

describe('Desktop outline trace schedule', () => {
  it('draws the desktop outside in: Taskbar and icons, File Explorer, Hero window frame', () => {
    const steps = buildOsTrace('desktop');
    expect(steps.map((s) => s.part)).toEqual(['taskbar', 'icons', 'explorer', 'hero']);
    const starts = steps.map((s) => s.startMs);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('takes about 1.2s for the OS parts and about 3s with the 1.8s name trace', () => {
    for (const layout of ['desktop', 'phone'] as const) {
      expect(osTraceEndMs(buildOsTrace(layout))).toBe(OS_TRACE_MS);
    }
    expect(OS_TRACE_MS + NAME_TRACE_MS).toBe(3000);
  });

  it('phones trace the Taskbar and the full-screen Hero window only', () => {
    expect(buildOsTrace('phone').map((s) => s.part)).toEqual(['taskbar', 'hero']);
  });

  it('is identical for every arrival (same steps each call, no shared mutation)', () => {
    const first = buildOsTrace('desktop');
    first[0].durationMs = 1;
    expect(buildOsTrace('desktop')[0].durationMs).not.toBe(1);
  });

  it('reports a part as closed once its stroke has finished', () => {
    const steps = buildOsTrace('desktop');
    expect(closedParts(steps, 0)).toEqual([]);
    expect(closedParts(steps, 400)).toEqual(['taskbar']);
    expect(closedParts(steps, 850)).toEqual(['taskbar', 'icons', 'explorer']);
    expect(closedParts(steps, OS_TRACE_MS)).toEqual(['taskbar', 'icons', 'explorer', 'hero']);
  });

  it('skips the trace only for reduced motion', () => {
    expect(shouldTrace(true)).toBe(false);
    expect(shouldTrace(false)).toBe(true);
  });
});

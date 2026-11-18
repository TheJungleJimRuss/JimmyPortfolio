import { describe, it, expect } from 'vitest';
import { lineTrace, LINE_CALM_INTERVAL_MS, LINE_MAX, LINE_MIN, LINE_TRAIL, type LineTraceState } from './LineTrace';

const view = { width: 400, height: 300 };
const run = (steps: number, dt = 16, seed = 7, v = view, calm = false): LineTraceState => {
  let s = lineTrace.init(seed, v, calm);
  for (let i = 0; i < steps; i++) s = lineTrace.step(s, dt, v);
  return s;
};
const inView = (s: LineTraceState, v: { width: number; height: number }): boolean =>
  s.segments.every((g) => [g.x1, g.x2].every((x) => x >= -1e-6 && x <= v.width + 1e-6) && [g.y1, g.y2].every((y) => y >= -1e-6 && y <= v.height + 1e-6));

describe('lineTrace', () => {
  it('runs many lines, more on bigger screens', () => {
    for (let seed = 1; seed < 30; seed++) {
      const n = lineTrace.init(seed, view, false).heads.length;
      expect(n).toBeGreaterThanOrEqual(LINE_MIN);
      expect(n).toBeLessThanOrEqual(LINE_MAX);
    }
    const big = lineTrace.init(1, { width: 1600, height: 900 }, false).heads.length;
    expect(big).toBeGreaterThan(lineTrace.init(1, { width: 300, height: 300 }, false).heads.length);
  });
  it('keeps every line at a fixed length forever', () => {
    let s = lineTrace.init(9, view, false);
    for (let i = 0; i < 3000; i++) {
      s = lineTrace.step(s, 50, view);
      expect(s.segments.length).toBeLessThanOrEqual(s.heads.length * LINE_TRAIL);
    }
    expect(s.segments.length).toBe(s.heads.length * LINE_TRAIL);
  });
  it('wraps around the edges instead of bouncing or clumping', () => {
    let s = lineTrace.init(5, view, false);
    const hit = { left: false, right: false, top: false, bottom: false };
    for (let i = 0; i < 3000; i++) {
      s = lineTrace.step(s, 50, view);
      for (const g of s.segments) {
        if (g.x2 === view.width && g.x2 > g.x1) hit.right = true;
        if (g.x1 === view.width && g.x2 < g.x1) hit.left = true;
        if (g.y2 === view.height && g.y2 > g.y1) hit.bottom = true;
        if (g.y1 === view.height && g.y2 < g.y1) hit.top = true;
      }
    }
    expect(hit).toEqual({ left: true, right: true, top: true, bottom: true });
    // Heads end up spread across the whole screen, not pinned to its edges.
    const xs = s.heads.map((h) => h.gx);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(s.cols / 3);
  });
  it('is deterministic per seed', () => {
    expect(run(300, 16, 7)).toEqual(run(300, 16, 7));
    expect(run(300, 16, 7)).not.toEqual(run(300, 16, 8));
  });
  it('draws only axis-aligned segments that are perpendicular or collinear to the previous one of the same line', () => {
    let s = lineTrace.init(3, view, false);
    const lastByLine = new Map<number, { dx: number; dy: number }>();
    let seen = 0;
    const done = new Set<string>();
    for (let i = 0; i < 1500; i++) {
      s = lineTrace.step(s, 16, view);
      for (const g of [...s.segments].sort((a, b) => a.t - b.t)) {
        const key = `${g.line}:${g.t}`;
        if (done.has(key)) continue;
        done.add(key);
        const dx = g.x2 - g.x1;
        const dy = g.y2 - g.y1;
        expect(dx === 0 || dy === 0).toBe(true);
        expect(dx !== 0 || dy !== 0).toBe(true);
        const prev = lastByLine.get(g.line);
        if (prev) {
          const dot = prev.dx * dx + prev.dy * dy;
          const cross = prev.dx * dy - prev.dy * dx;
          // perpendicular (dot 0) or collinear forward (cross 0, dot>0)
          expect(dot === 0 || (cross === 0 && dot > 0)).toBe(true);
        }
        lastByLine.set(g.line, { dx, dy });
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(100);
  });
  it('turns at some point', () => {
    const s = run(600);
    const horiz = s.segments.some((g) => g.y1 === g.y2);
    const vert = s.segments.some((g) => g.x1 === g.x2);
    expect(horiz && vert).toBe(true);
  });
  it('stays in bounds over many steps', () => {
    let s = lineTrace.init(5, view, false);
    for (let i = 0; i < 5000; i++) {
      s = lineTrace.step(s, 50, view);
      if (!inView(s, view)) throw new Error(`out of bounds at ${i}`);
    }
  });
  it('stays in bounds after a resize, bigger or smaller', () => {
    let s = run(400);
    const small = { width: 180, height: 240 };
    for (let i = 0; i < 1000; i++) s = lineTrace.step(s, 33, small);
    expect(inView(s, small)).toBe(true);
    const big = { width: 900, height: 500 };
    for (let i = 0; i < 1000; i++) s = lineTrace.step(s, 33, big);
    expect(inView(s, big)).toBe(true);
  });
  it('survives a tiny viewport', () => {
    const tiny = { width: 10, height: 8 };
    let s = lineTrace.init(2, tiny, false);
    for (let i = 0; i < 200; i++) s = lineTrace.step(s, 40, tiny);
    expect(s.segments.every((g) => [g.x1, g.y1, g.x2, g.y2].every(Number.isFinite))).toBe(true);
  });
  it('calm mode starts with a pattern and changes no more often than its interval', () => {
    expect(LINE_CALM_INTERVAL_MS).toBeGreaterThanOrEqual(3000);
    let s = lineTrace.init(5, view, true);
    expect(s.segments.length).toBeGreaterThan(0);
    let changes = 0;
    const dt = 100;
    const total = 20_000;
    for (let t = 0; t < total; t += dt) {
      const next = lineTrace.step(s, dt, view);
      if (next.segments !== s.segments) changes++;
      s = next;
    }
    expect(changes).toBeLessThanOrEqual(Math.floor(total / LINE_CALM_INTERVAL_MS));
    expect(changes).toBeGreaterThan(0);
    expect(inView(s, view)).toBe(true);
  });
});

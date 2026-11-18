import { describe, it, expect } from 'vitest';
import { letterDrift, CALM_INTERVAL_MS, LETTERS, type LetterDriftState } from './LetterDrift';
import { mulberry32 } from './Prng';

const view = { width: 1024, height: 700 };
const run = (calm: boolean, steps: number, dt = 16, seed = 7): LetterDriftState => {
  let s = letterDrift.init(seed, view, calm);
  for (let i = 0; i < steps; i++) s = letterDrift.step(s, dt, view);
  return s;
};
const inBounds = (s: LetterDriftState, v: { width: number; height: number }): boolean =>
  s.letters.every(
    (l) => l.x >= s.halfW - 1e-6 && l.x <= v.width - s.halfW + 1e-6 && l.y >= s.halfH - 1e-6 && l.y <= v.height - s.halfH + 1e-6,
  );

describe('mulberry32', () => {
  it('is deterministic per seed and in [0, 1)', () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    for (let i = 0; i < 50; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('letterDrift', () => {
  it('starts as JIMMY over RUSS, centered', () => {
    const s = letterDrift.init(1, view, false);
    expect(s.letters.map((l) => l.ch).join('')).toBe(LETTERS.join(''));
    const top = s.letters.slice(0, 5);
    const bottom = s.letters.slice(5);
    expect(new Set(top.map((l) => l.y)).size).toBe(1);
    expect(new Set(bottom.map((l) => l.y)).size).toBe(1);
    expect(top[0].y).toBeLessThan(bottom[0].y);
    const mean = (ls: typeof top) => ls.reduce((a, l) => a + l.x, 0) / ls.length;
    expect(mean(top)).toBeCloseTo(view.width / 2, 5);
    expect(mean(bottom)).toBeCloseTo(view.width / 2, 5);
    for (let i = 1; i < 5; i++) expect(top[i].x).toBeGreaterThan(top[i - 1].x);
    for (const l of s.letters) {
      expect(l.x).toBe(l.hx);
      expect(l.y).toBe(l.hy);
    }
  });
  it('gives the same frames for the same seed, different for another', () => {
    expect(run(false, 300, 16, 7)).toEqual(run(false, 300, 16, 7));
    expect(run(false, 300, 16, 7)).not.toEqual(run(false, 300, 16, 8));
  });
  it('drifts the letters apart from their home spots, slowly', () => {
    const s = run(false, 600); // ~9.6 s
    const moved = s.letters.map((l) => Math.hypot(l.x - l.hx, l.y - l.hy));
    expect(Math.max(...moved)).toBeGreaterThan(5);
    expect(Math.max(...moved)).toBeLessThan(400);
  });
  it('stays inside the viewport over many steps', () => {
    let s = letterDrift.init(3, view, false);
    for (let i = 0; i < 20_000; i++) {
      s = letterDrift.step(s, 50, view);
      if (!inBounds(s, view)) throw new Error(`out of bounds at step ${i}`);
    }
    expect(inBounds(s, view)).toBe(true);
  });
  it('stays inside after a resize, larger or smaller', () => {
    let s = run(false, 500);
    const small = { width: 375, height: 640 };
    s = letterDrift.step(s, 16, small);
    expect(inBounds(s, small)).toBe(true);
    for (let i = 0; i < 2000; i++) s = letterDrift.step(s, 33, small);
    expect(inBounds(s, small)).toBe(true);
    const big = { width: 1600, height: 900 };
    for (let i = 0; i < 500; i++) s = letterDrift.step(s, 33, big);
    expect(inBounds(s, big)).toBe(true);
  });
  it('survives a tiny viewport', () => {
    const tiny = { width: 40, height: 30 };
    let s = letterDrift.init(2, tiny, false);
    for (let i = 0; i < 200; i++) s = letterDrift.step(s, 40, tiny);
    for (const l of s.letters) {
      expect(Number.isFinite(l.x)).toBe(true);
      expect(Number.isFinite(l.y)).toBe(true);
    }
  });
  it('calm mode changes state no more often than its slow interval', () => {
    expect(CALM_INTERVAL_MS).toBeGreaterThanOrEqual(3000);
    let s = letterDrift.init(5, view, true);
    const first = s;
    let changes = 0;
    const dt = 100;
    const total = 20_000;
    for (let t = 0; t < total; t += dt) {
      const next = letterDrift.step(s, dt, view);
      if (next.letters !== s.letters) changes++;
      s = next;
    }
    expect(changes).toBeLessThanOrEqual(Math.floor(total / CALM_INTERVAL_MS));
    expect(changes).toBeGreaterThan(0);
    expect(s.letters).not.toBe(first.letters);
    expect(inBounds(s, view)).toBe(true);
  });
  it('calm mode stays near still', () => {
    const s = run(true, 150, 100); // 15 s
    const moved = s.letters.map((l) => Math.hypot(l.x - l.hx, l.y - l.hy));
    expect(Math.max(...moved)).toBeLessThan(120);
  });
});

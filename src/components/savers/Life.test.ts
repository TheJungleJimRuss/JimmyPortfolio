import { describe, it, expect } from 'vitest';
import {
  life,
  nextGeneration,
  namePattern,
  NAME_LINES,
  NAME_W,
  NAME_H,
  LIFE_PIX,
  LIFE_TICK_MS,
  LIFE_MAX_MS,
  LIFE_HIST,
  type LifeState,
} from './Life';

const view = { width: 400, height: 300 };
const portrait = { width: 375, height: 812 };
const land = { width: 1440, height: 900 };
const cellsOf = (cols: number, rows: number, live: Array<[number, number]>): Uint8Array => {
  const a = new Uint8Array(cols * rows);
  for (const [x, y] of live) a[y * cols + x] = 1;
  return a;
};
const run = (steps: number, dt = 16, seed = 7, v = view, calm = false): LifeState => {
  let s = life.init(seed, v, calm);
  for (let i = 0; i < steps; i++) s = life.step(s, dt, v);
  return s;
};

describe('name pattern', () => {
  it('is two lines of 5x7 letters with consistent widths', () => {
    expect(NAME_LINES.length).toBe(2);
    for (const line of NAME_LINES) {
      expect(line.length).toBe(7);
      expect(new Set(line.map((r) => r.length)).size).toBe(1);
    }
    expect(NAME_LINES[0][0].length).toBe(NAME_W);
    expect(NAME_H).toBe(16);
  });
  it('generation 0 equals the name pattern exactly, centered', () => {
    for (const v of [view, portrait, land]) {
      const s = life.init(1, v, false);
      expect(s.gen).toBe(0);
      expect(Array.from(s.cells)).toEqual(Array.from(namePattern(s.cols, s.rows)));
      const art = NAME_LINES.flat().join('').split('#').length - 1;
      expect(s.cells.reduce((a, b) => a + b, 0)).toBe(art * LIFE_PIX * LIFE_PIX);
    }
  });
  it('spans most of the width on landscape and portrait', () => {
    for (const v of [view, portrait, land]) {
      const s = life.init(1, v, false);
      // Most of the width, with open space around the name for the run to spread into.
      expect((NAME_W * LIFE_PIX * s.cell) / v.width).toBeGreaterThan(0.5);
      expect(s.cols).toBeGreaterThan(NAME_W * LIFE_PIX);
      expect(s.rows).toBeGreaterThan(NAME_H * LIFE_PIX);
    }
  });
});

describe('nextGeneration', () => {
  it('oscillates a blinker', () => {
    const a = cellsOf(8, 8, [[3, 4], [4, 4], [5, 4]]);
    const b = nextGeneration(a, 8, 8);
    expect(Array.from(b)).toEqual(Array.from(cellsOf(8, 8, [[4, 3], [4, 4], [4, 5]])));
    expect(Array.from(nextGeneration(b, 8, 8))).toEqual(Array.from(a));
  });
  it('keeps a block still', () => {
    const a = cellsOf(8, 8, [[3, 3], [4, 3], [3, 4], [4, 4]]);
    expect(Array.from(nextGeneration(a, 8, 8))).toEqual(Array.from(a));
  });
  it('wraps: a glider returns to its start after 4*size generations', () => {
    const a = cellsOf(8, 8, [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]);
    let g = a;
    for (let i = 0; i < 32; i++) g = nextGeneration(g, 8, 8);
    expect(Array.from(g)).toEqual(Array.from(a));
  });
  it('does not mutate its input', () => {
    const a = cellsOf(8, 8, [[3, 4], [4, 4], [5, 4]]);
    const copy = a.slice();
    nextGeneration(a, 8, 8);
    expect(a).toEqual(copy);
  });
});

describe('life motion', () => {
  it('is deterministic per seed', () => {
    expect(run(400, 16, 7)).toEqual(run(400, 16, 7));
  });
  it('steps about 8-10 generations per second', () => {
    let s = life.init(1, view, false);
    let t = 0;
    while (s.total < 1 && t < 20000) { s = life.step(s, 16, view); t += 16; }
    const start = t;
    const g0 = s.total;
    for (let i = 0; i < 300; i++) s = life.step(s, 16, view); // 4.8 s
    const rate = (s.total - g0) / (4800 / 1000);
    expect(start).toBeGreaterThan(0);
    expect(rate).toBeGreaterThan(8);
    expect(rate).toBeLessThan(10.5);
    expect(LIFE_TICK_MS).toBeGreaterThan(95);
  });
  it('keeps the grid inside the viewport and state bounded, also after a resize', () => {
    let s = life.init(3, view, false);
    const size0 = s.cells.length;
    for (let i = 0; i < 4000; i++) {
      s = life.step(s, 50, view);
      expect(s.cols * s.cell).toBeLessThanOrEqual(view.width + 1e-6);
      expect(s.rows * s.cell).toBeLessThanOrEqual(view.height + 1e-6);
      expect(s.cells.length).toBe(size0);
      expect(s.hist.length).toBeLessThanOrEqual(LIFE_HIST);
      expect(s.alpha).toBeGreaterThanOrEqual(0);
      expect(s.alpha).toBeLessThanOrEqual(1);
    }
    s = life.step(s, 16, portrait);
    expect(s.cols * s.cell).toBeLessThanOrEqual(portrait.width + 1e-6);
    expect(s.rows * s.cell).toBeLessThanOrEqual(portrait.height + 1e-6);
    expect(s.cells.length).toBe(s.cols * s.rows);
    expect(s.gen).toBe(0);
    for (const v of [{ width: 3840, height: 2160 }, { width: 200, height: 4000 }, { width: 3000, height: 300 }]) {
      expect(life.init(1, v, false).cells.length).toBeLessThan(25000);
    }
  });
  it('runs about a tenth of the pace when calm, one generation at most every few seconds', () => {
    const count = (calm: boolean): number => {
      let s = life.init(1, view, calm);
      for (let i = 0; i < 20000 / 16; i++) s = life.step(s, 16, view);
      return s.total;
    };
    const live = count(false);
    const calm = count(true);
    expect(calm).toBeLessThan(live * 0.1);
    expect(calm).toBeGreaterThan(0);
    let s = life.init(1, view, true);
    let last = 0;
    let lastT = -1;
    let t = 0;
    for (let i = 0; i < 20000 / 16; i++) {
      s = life.step(s, 16, view);
      t += 16;
      if (s.total !== last) {
        if (lastT >= 0) expect(t - lastT).toBeGreaterThanOrEqual(2500);
        last = s.total;
        lastT = t;
      }
    }
  });
  it('re-seeds to the name after a stall, fading out and in rather than cutting', () => {
    const base = life.init(1, view, false);
    const still = cellsOf(base.cols, base.rows, [[3, 3], [4, 3], [3, 4], [4, 4]]);
    let s: LifeState = { ...base, cells: still, prev: still, phase: 'live', t: 0, alpha: 1, hist: [] };
    const alphas: number[] = [];
    let reseeded = false;
    for (let i = 0; i < 1000 && !reseeded; i++) {
      s = life.step(s, 16, view);
      alphas.push(s.alpha);
      reseeded = s.gen === 0 && s.phase === 'in';
    }
    expect(reseeded).toBe(true);
    expect(Array.from(s.cells)).toEqual(Array.from(namePattern(s.cols, s.rows)));
    expect(alphas.some((a) => a > 0.05 && a < 0.95)).toBe(true);
    for (let i = 1; i < alphas.length; i++) expect(Math.abs(alphas[i] - alphas[i - 1])).toBeLessThan(0.3);
  });
  it('re-seeds after about 60 seconds even if the board keeps changing', () => {
    const base = life.init(1, view, false);
    const glider = cellsOf(base.cols, base.rows, [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]);
    let s: LifeState = { ...base, cells: glider, prev: glider, phase: 'live', t: 0, age: 0, alpha: 1, hist: [] };
    let t = 0;
    let at = -1;
    while (t < 80000 && at < 0) {
      s = life.step(s, 16, view);
      t += 16;
      if (s.phase === 'out') at = t;
    }
    expect(at).toBeGreaterThan(LIFE_MAX_MS - 1000);
    expect(at).toBeLessThan(LIFE_MAX_MS + 1000);
  });
  it('fades the name in at the start', () => {
    const s0 = life.init(1, view, false);
    expect(s0.alpha).toBeLessThan(0.5);
    expect(run(200).alpha).toBe(1);
  });
});

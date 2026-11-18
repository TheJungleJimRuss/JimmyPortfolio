import { describe, it, expect } from 'vitest';
import { contours, marchingSquares, noise3, sampleField, CONTOUR_LEVELS, contourLevel, isIndexLevel, type ContoursState } from './Contours';

const view = { width: 400, height: 300 };
const run = (steps: number, dt = 16, seed = 7, v = view, calm = false): ContoursState => {
  let s = contours.init(seed, v, calm);
  for (let i = 0; i < steps; i++) s = contours.step(s, dt, v);
  return s;
};

describe('noise3', () => {
  it('is deterministic per seed and stays in 0..1', () => {
    expect(noise3(1, 0.3, 0.7, 2.1)).toBe(noise3(1, 0.3, 0.7, 2.1));
    expect(noise3(1, 0.3, 0.7, 2.1)).not.toBe(noise3(2, 0.3, 0.7, 2.1));
    for (let i = 0; i < 500; i++) {
      const v = noise3(3, i * 0.37, i * 0.11, i * 0.05);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
  it('is continuous', () => {
    for (let i = 0; i < 200; i++) {
      const a = noise3(5, i * 0.13, 1.7, 0.4);
      const b = noise3(5, i * 0.13 + 0.001, 1.7, 0.4);
      expect(Math.abs(a - b)).toBeLessThan(0.02);
    }
  });
});

describe('marchingSquares', () => {
  it('puts segments of a linear ramp on the iso-level', () => {
    const cols = 10, rows = 6;
    const values = new Float32Array((cols + 1) * (rows + 1));
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) values[j * (cols + 1) + i] = i / cols;
    const segs = marchingSquares(values, cols, rows, 0.35, 20, 20);
    expect(segs.length).toBe(rows);
    for (const g of segs) {
      expect(g.x1).toBeCloseTo(0.35 * cols * 20, 3);
      expect(g.x2).toBeCloseTo(0.35 * cols * 20, 3);
    }
  });
  it('traces a circle within tolerance', () => {
    const cols = 40, rows = 40, cell = 10;
    const values = new Float32Array((cols + 1) * (rows + 1));
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) values[j * (cols + 1) + i] = Math.hypot(i * cell - 200, j * cell - 200);
    const segs = marchingSquares(values, cols, rows, 100, cell, cell);
    expect(segs.length).toBeGreaterThan(40);
    for (const g of segs) {
      expect(Math.abs(Math.hypot(g.x1 - 200, g.y1 - 200) - 100)).toBeLessThan(1);
      expect(Math.abs(Math.hypot(g.x2 - 200, g.y2 - 200) - 100)).toBeLessThan(1);
    }
  });
  it('returns nothing for a flat field and handles saddles', () => {
    const flat = new Float32Array(9).fill(0.5);
    expect(marchingSquares(flat, 2, 2, 0.7, 10, 10)).toEqual([]);
    const saddle = new Float32Array([1, 0, 0, 1]);
    expect(marchingSquares(saddle, 1, 1, 0.5, 10, 10).length).toBe(2);
  });
});

describe('levels', () => {
  it('has 6 to 10 evenly spaced levels with some index levels', () => {
    expect(CONTOUR_LEVELS).toBeGreaterThanOrEqual(6);
    expect(CONTOUR_LEVELS).toBeLessThanOrEqual(10);
    const step = contourLevel(1) - contourLevel(0);
    for (let i = 1; i < CONTOUR_LEVELS; i++) expect(contourLevel(i) - contourLevel(i - 1)).toBeCloseTo(step, 9);
    const idx = Array.from({ length: CONTOUR_LEVELS }, (_, i) => isIndexLevel(i)).filter(Boolean).length;
    expect(idx).toBeGreaterThanOrEqual(1);
    expect(idx).toBeLessThan(CONTOUR_LEVELS / 2);
  });
});

describe('contours motion', () => {
  it('is deterministic per seed', () => {
    expect(run(200, 16, 7)).toEqual(run(200, 16, 7));
    expect(run(200, 16, 7)).not.toEqual(run(200, 16, 8));
  });
  it('keeps a bounded, plain state and a grid that covers the viewport exactly', () => {
    const a = JSON.stringify(run(10));
    const b = JSON.stringify(run(5000, 50));
    expect(Math.abs(b.length - a.length)).toBeLessThan(40);
    const s = run(3000, 50);
    expect(s.cols * s.cellX).toBeCloseTo(view.width, 6);
    expect(s.rows * s.cellY).toBeCloseTo(view.height, 6);
    expect(s.cellX).toBeGreaterThanOrEqual(14);
    expect(s.cellX).toBeLessThanOrEqual(26);
  });
  it('keeps every segment inside the viewport over time and after a resize', () => {
    let s = contours.init(4, view, false);
    const small = { width: 123, height: 457 };
    for (let i = 0; i < 400; i++) {
      s = contours.step(s, 50, i < 200 ? view : small);
      const v = i < 200 ? view : small;
      if (i % 50 === 0 || i === 201) {
        for (let k = 0; k < CONTOUR_LEVELS; k++) {
          for (const g of marchingSquares(sampleField(s), s.cols, s.rows, contourLevel(k), s.cellX, s.cellY)) {
            for (const x of [g.x1, g.x2]) expect(x).toBeGreaterThanOrEqual(-1e-6), expect(x).toBeLessThanOrEqual(v.width + 1e-6);
            for (const y of [g.y1, g.y2]) expect(y).toBeGreaterThanOrEqual(-1e-6), expect(y).toBeLessThanOrEqual(v.height + 1e-6);
          }
        }
      }
    }
    expect(s.width).toBe(small.width);
    expect(s.cols * s.cellX).toBeCloseTo(small.width, 6);
  });
  it('evolves smoothly step to step but visibly over a minute', () => {
    const a = contours.init(2, view, false);
    const b = contours.step(a, 16, view);
    const fa = sampleField(a), fb = sampleField(b);
    let maxStep = 0;
    for (let i = 0; i < fa.length; i++) maxStep = Math.max(maxStep, Math.abs(fa[i] - fb[i]));
    expect(maxStep).toBeLessThan(0.01);
    expect(maxStep).toBeGreaterThanOrEqual(0);
    let s = a;
    for (let i = 0; i < 60 * 60; i++) s = contours.step(s, 1000 / 60, view);
    const fc = sampleField(s);
    let total = 0;
    for (let i = 0; i < fa.length; i++) total += Math.abs(fa[i] - fc[i]);
    expect(total / fa.length).toBeGreaterThan(0.08);
  });
  it('runs calm at roughly a tenth of the pace', () => {
    const live = run(600, 16, 3, view, false);
    const calm = run(600, 16, 3, view, true);
    const ratio = calm.t / live.t;
    expect(ratio).toBeGreaterThan(0.07);
    expect(ratio).toBeLessThan(0.14);
    expect(calm.calm).toBe(true);
  });
  it('ignores huge frame gaps', () => {
    const s = contours.step(contours.init(1, view, false), 60000, view);
    expect(s.t).toBeLessThan(0.1);
  });
});

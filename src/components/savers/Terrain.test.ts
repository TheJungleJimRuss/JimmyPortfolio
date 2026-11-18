import { describe, it, expect } from 'vitest';
import {
  terrain,
  project,
  projectRow,
  rowHeights,
  TERRAIN_COLS,
  TERRAIN_ROWS,
  TERRAIN_SPEED,
  CALM_FACTOR,
  CULL_DEPTH,
  type TerrainState,
} from './Terrain';

const view = { width: 400, height: 300 };
const dist = (s: TerrainState): number => s.first + s.off;
const run = (steps: number, dt = 16, seed = 7, v = view, calm = false): TerrainState => {
  let s = terrain.init(seed, v, calm);
  for (let i = 0; i < steps; i++) s = terrain.step(s, dt, v);
  return s;
};

describe('terrain', () => {
  it('is deterministic per seed', () => {
    expect(run(400, 16, 7)).toEqual(run(400, 16, 7));
    expect(run(400, 16, 7)).not.toEqual(run(400, 16, 8));
  });
  it('keeps a fixed-size grid forever', () => {
    let s = terrain.init(3, view, false);
    for (let i = 0; i < 4000; i++) {
      s = terrain.step(s, 50, view);
      expect(s.rows.length).toBe(TERRAIN_ROWS);
      expect(s.off).toBeGreaterThanOrEqual(0);
      expect(s.off).toBeLessThan(1);
    }
    expect(s.rows.every((r) => r.length === TERRAIN_COLS)).toBe(true);
    expect(s.first).toBeGreaterThan(100);
  });
  it('scrolls continuously and generates new rows seamlessly', () => {
    let s = terrain.init(11, view, false);
    let prev = dist(s);
    for (let i = 0; i < 2000; i++) {
      s = terrain.step(s, 16, view);
      expect(dist(s)).toBeGreaterThan(prev);
      expect(dist(s) - prev).toBeLessThan(0.2);
      prev = dist(s);
      // Every row is the deterministic height of its world row index, so recycling never shows a seam.
      if (i % 97 === 0) s.rows.forEach((r, k) => expect(r).toEqual(rowHeights(11, s.first + k)));
    }
  });
  it('takes the same path whatever the frame size', () => {
    const a = run(600, 16, 5);
    const b = run(300, 32, 5);
    expect(dist(a)).toBeCloseTo(dist(b), 6);
    expect(a.rows).toEqual(b.rows);
  });
  it('varies smoothly from row to row, with higher ridges toward the sides', () => {
    let side = 0;
    let mid = 0;
    for (let w = 0; w < 200; w++) {
      const a = rowHeights(4, w);
      const b = rowHeights(4, w + 1);
      a.forEach((h, c) => expect(Math.abs(h - b[c])).toBeLessThan(1.5));
      side += a[1] + a[TERRAIN_COLS - 2];
      mid += a[TERRAIN_COLS / 2 - 1] + a[TERRAIN_COLS / 2];
    }
    expect(side).toBeGreaterThan(mid * 2);
  });
  it('projects every visible row to finite points inside the viewport', () => {
    // Collect failures and assert once: per-point expects made this test slow enough to time out under load.
    const bad: string[] = [];
    for (const v of [view, { width: 375, height: 700 }, { width: 1440, height: 800 }]) {
      let s = terrain.init(2, v, false);
      for (let i = 0; i < 300; i++) {
        s = terrain.step(s, 16, v);
        for (let r = 0; r < s.rows.length; r++) {
          const pts = projectRow(s, r, v);
          if (!pts) {
            bad.push(`${v.width}x${v.height} step ${i} row ${r}: null`);
            continue;
          }
          for (const p of pts) {
            if (!(Number.isFinite(p.x) && Number.isFinite(p.y) && p.y >= -v.height && p.y <= 2 * v.height)) {
              bad.push(`${v.width}x${v.height} step ${i} row ${r}: (${p.x}, ${p.y})`);
            }
          }
          // The valley down the middle stays inside the frame.
          for (const c of [TERRAIN_COLS / 2 - 1, TERRAIN_COLS / 2]) {
            if (!(pts[c].x >= 0 && pts[c].x <= v.width)) bad.push(`${v.width}x${v.height} step ${i} row ${r} col ${c}: x ${pts[c].x}`);
          }
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  it('converges toward the horizon with distance and refuses points behind the near plane', () => {
    const near = project(0, 0, 2, view)!;
    const far = project(0, 0, 30, view)!;
    expect(far.y).toBeLessThan(near.y);
    expect(project(0, 0, 0, view)).toBeNull();
    expect(project(0, 0, -3, view)).toBeNull();
    expect(CULL_DEPTH).toBeGreaterThan(0);
  });
  it('survives a resize without changing the world', () => {
    const small = { width: 200, height: 150 };
    const s = run(100, 16, 6);
    const t = terrain.step(s, 16, small);
    expect(t.rows.length).toBe(TERRAIN_ROWS);
    expect(projectRow(t, 5, small)!.every((p) => Number.isFinite(p.x + p.y))).toBe(true);
  });
  it('clamps huge frame gaps in live mode', () => {
    const s = terrain.init(1, view, false);
    expect(dist(terrain.step(s, 60000, view)) - dist(s)).toBeLessThanOrEqual((TERRAIN_SPEED * 100) / 1000 + 1e-9);
  });
  it('calm runs at about a tenth of the pace', () => {
    const live = terrain.init(9, view, false);
    const calm = terrain.init(9, view, true);
    expect(calm.calm).toBe(true);
    let l = live;
    let c = calm;
    for (let i = 0; i < 1000; i++) {
      l = terrain.step(l, 16, view);
      c = terrain.step(c, 16, view);
    }
    const ratio = (dist(c) - dist(calm)) / (dist(l) - dist(live));
    expect(ratio).toBeCloseTo(CALM_FACTOR, 2);
  });
});

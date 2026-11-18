import { describe, it, expect } from 'vitest';
import {
  pathfinder,
  generateMaze,
  astar,
  PATHFINDER_PHASES,
  PATHFINDER_MAX_CELLS,
  type PathfinderState,
} from './Pathfinder';
import { mulberry32 } from './Prng';

const view = { width: 480, height: 320 };
const run = (steps: number, dt = 16, seed = 7, v = view, calm = false): PathfinderState => {
  let s = pathfinder.init(seed, v, calm);
  for (let i = 0; i < steps; i++) s = pathfinder.step(s, dt, v);
  return s;
};
const N = 1, E = 2, S = 4, W = 8;
const DX: Record<number, number> = { [N]: 0, [E]: 1, [S]: 0, [W]: -1 };
const DY: Record<number, number> = { [N]: -1, [E]: 0, [S]: 1, [W]: 0 };
const neighbors = (p: number[], cols: number, i: number): number[] =>
  [N, E, S, W].filter((d) => p[i] & d).map((d) => i + DX[d] + DY[d] * cols);
const bfsReach = (p: number[], cols: number, start: number): Set<number> => {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) for (const n of neighbors(p, cols, q.shift()!)) if (!seen.has(n)) (seen.add(n), q.push(n));
  return seen;
};
const inView = (s: PathfinderState, v: { width: number; height: number }): boolean =>
  s.ox >= 0 && s.oy >= 0 && s.ox + s.cols * s.cell <= v.width + 1e-6 && s.oy + s.rows * s.cell <= v.height + 1e-6;

describe('generateMaze', () => {
  it('makes a perfect maze: symmetric, fully connected, cells-1 passages', () => {
    for (let seed = 1; seed < 15; seed++) {
      const cols = 3 + (seed % 9), rows = 2 + (seed % 7);
      const { passages, carve } = generateMaze(mulberry32(seed), cols, rows);
      expect(passages.length).toBe(cols * rows);
      for (let i = 0; i < passages.length; i++)
        for (const n of neighbors(passages, cols, i)) expect(neighbors(passages, cols, n)).toContain(i);
      expect(bfsReach(passages, cols, 0).size).toBe(cols * rows);
      expect(carve.length).toBe((cols * rows - 1) * 2);
      const edges = passages.reduce((a, p) => a + [N, E, S, W].filter((d) => p & d).length, 0) / 2;
      expect(edges).toBe(cols * rows - 1);
    }
  });
  it('never opens a passage out of the grid', () => {
    const { passages } = generateMaze(mulberry32(3), 6, 5);
    for (let i = 0; i < 30; i++) {
      const x = i % 6, y = Math.floor(i / 6);
      if (x === 0) expect(passages[i] & W).toBe(0);
      if (x === 5) expect(passages[i] & E).toBe(0);
      if (y === 0) expect(passages[i] & N).toBe(0);
      if (y === 4) expect(passages[i] & S).toBe(0);
    }
  });
  it('lists carve steps as adjacent from/to pairs that reach every cell once', () => {
    const { carve } = generateMaze(mulberry32(4), 7, 6);
    const reached = new Set([0]);
    for (let k = 0; k < carve.length; k += 2) {
      const a = carve[k], b = carve[k + 1];
      expect(reached.has(a)).toBe(true);
      expect(reached.has(b)).toBe(false);
      expect(Math.abs((a % 7) - (b % 7)) + Math.abs(Math.floor(a / 7) - Math.floor(b / 7))).toBe(1);
      reached.add(b);
    }
    expect(reached.size).toBe(42);
  });
  it('is deterministic per seed', () => {
    expect(generateMaze(mulberry32(5), 8, 8)).toEqual(generateMaze(mulberry32(5), 8, 8));
    expect(generateMaze(mulberry32(5), 8, 8)).not.toEqual(generateMaze(mulberry32(6), 8, 8));
  });
});

describe('astar', () => {
  it('finds a shortest path in an open grid (with loops)', () => {
    const cols = 6, rows = 5;
    const open = Array.from({ length: cols * rows }, (_, i) => {
      const x = i % cols, y = Math.floor(i / cols);
      return (y > 0 ? N : 0) | (x < cols - 1 ? E : 0) | (y < rows - 1 ? S : 0) | (x > 0 ? W : 0);
    });
    const { path, visited } = astar(open, cols, rows, 0, cols * rows - 1);
    expect(path.length).toBe(cols - 1 + rows - 1 + 1);
    expect(visited.length).toBeLessThanOrEqual(cols * rows);
  });
  it('on mazes: starts at start, ends at goal, steps only through open adjacent cells, and is shortest', () => {
    for (let seed = 1; seed < 10; seed++) {
      const cols = 12, rows = 8;
      const { passages } = generateMaze(mulberry32(seed), cols, rows);
      const goal = cols * rows - 1;
      const { path, visited } = astar(passages, cols, rows, 0, goal);
      expect(path[0]).toBe(0);
      expect(path[path.length - 1]).toBe(goal);
      for (let k = 1; k < path.length; k++) expect(neighbors(passages, cols, path[k - 1])).toContain(path[k]);
      // BFS distance
      const dist = new Map([[0, 0]]);
      const q = [0];
      while (q.length) {
        const c = q.shift()!;
        for (const n of neighbors(passages, cols, c)) if (!dist.has(n)) (dist.set(n, dist.get(c)! + 1), q.push(n));
      }
      expect(path.length - 1).toBe(dist.get(goal));
      expect(new Set(visited).size).toBe(visited.length);
      expect(visited).toContain(goal);
    }
  });
});

describe('pathfinder motion', () => {
  it('is deterministic per seed', () => {
    expect(run(300, 16, 7)).toEqual(run(300, 16, 7));
    expect(run(300, 16, 7)).not.toEqual(run(300, 16, 8));
  });
  it('scales the grid to the viewport and stays inside it', () => {
    const big = pathfinder.init(1, { width: 1600, height: 900 }, false);
    const small = pathfinder.init(1, { width: 300, height: 300 }, false);
    expect(big.cols * big.rows).toBeGreaterThan(small.cols * small.rows);
    expect(big.cols * big.rows).toBeLessThanOrEqual(PATHFINDER_MAX_CELLS);
    for (const v of [view, { width: 1600, height: 900 }, { width: 375, height: 667 }, { width: 40, height: 40 }]) {
      expect(inView(pathfinder.init(2, v, false), v)).toBe(true);
    }
    const huge = pathfinder.init(1, { width: 8000, height: 6000 }, false);
    expect(huge.cols * huge.rows).toBeLessThanOrEqual(PATHFINDER_MAX_CELLS);
  });
  it('stays in bounds and bounded in size over thousands of steps', () => {
    let s = pathfinder.init(9, view, false);
    const size0 = s.cols * s.rows;
    for (let i = 0; i < 4000; i++) {
      s = pathfinder.step(s, 50, view);
      expect(s.nCarve).toBeLessThanOrEqual(s.carve.length / 2);
      expect(s.nSearch).toBeLessThanOrEqual(s.visited.length);
      expect(s.nPath).toBeLessThanOrEqual(s.path.length);
      expect(s.alpha).toBeGreaterThanOrEqual(0);
      expect(s.alpha).toBeLessThanOrEqual(1);
      expect(s.passages.length).toBe(size0);
    }
    expect(inView(s, view)).toBe(true);
  });
  it('restarts on a resize, on the new grid', () => {
    const v2 = { width: 900, height: 500 };
    let s = run(200);
    s = pathfinder.step(s, 16, v2);
    expect(s.width).toBe(900);
    expect(inView(s, v2)).toBe(true);
    expect(s.phase).toBe('carve');
    for (let i = 0; i < 2000; i++) s = pathfinder.step(s, 50, v2);
    expect(inView(s, v2)).toBe(true);
  });
  it('runs carve, search, path, hold, fade, then a new maze', () => {
    let s = pathfinder.init(11, view, false);
    const first = s.passages;
    const seen: string[] = [s.phase];
    for (let i = 0; i < 400; i++) {
      s = pathfinder.step(s, 100, view);
      if (seen[seen.length - 1] !== s.phase) seen.push(s.phase);
      if (seen.length > PATHFINDER_PHASES.length) break;
    }
    expect(seen.slice(0, 6)).toEqual(['carve', 'search', 'path', 'hold', 'fade', 'carve']);
    expect(s.passages).not.toBe(first);
    expect(s.passages).not.toEqual(first);
    expect(s.nCarve).toBeLessThan(s.carve.length / 2);
  });
  it('reveals everything by the hold, and the path last at full state', () => {
    let s = pathfinder.init(12, view, false);
    while (s.phase !== 'hold') s = pathfinder.step(s, 100, view);
    expect(s.nCarve).toBe(s.carve.length / 2);
    expect(s.nSearch).toBe(s.visited.length);
    expect(s.nPath).toBe(s.path.length);
    expect(s.alpha).toBe(1);
  });
  it('fades out (not cuts) during the fade phase', () => {
    let s = pathfinder.init(13, view, false);
    while (s.phase !== 'fade') s = pathfinder.step(s, 100, view);
    const a0 = s.alpha;
    s = pathfinder.step(s, 100, view);
    expect(s.phase === 'fade' ? s.alpha : 0).toBeLessThan(a0 + 1e-9);
    expect(s.alpha).toBeLessThan(1);
  });
  it('calm runs at about a tenth of the pace', () => {
    const big = { width: 1600, height: 900 };
    const live = run(100, 16, 3, big, false);
    const calm = run(100, 16, 3, big, true);
    expect(calm.calm).toBe(true);
    const ratio = calm.nCarve / live.nCarve;
    expect(ratio).toBeGreaterThan(0.06);
    expect(ratio).toBeLessThan(0.14);
  });
  it('calm fades in instead of cutting in', () => {
    const s0 = pathfinder.init(3, view, true);
    expect(s0.alpha).toBe(0);
    expect(run(400, 16, 3, view, true).alpha).toBeGreaterThan(0);
  });
});

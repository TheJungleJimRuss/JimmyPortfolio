/** Pathfinder: a maze is carved on a grid, A* spreads its search dimly, the found path lights up, then it fades and a new maze begins. */
import { mulberry32 } from './Prng';
import type { SaverMotion, SaverViewport } from './SaverMotion';

export const PATHFINDER_CELL = 24; // target grid cell, px
export const PATHFINDER_MAX_CELLS = 3000; // bounds state size on huge screens
export const PATHFINDER_PHASES = ['carve', 'search', 'path', 'hold', 'fade'] as const;
export type PathfinderPhase = (typeof PATHFINDER_PHASES)[number];
/** Live phase lengths in ms; calm stretches them by running the clock at CALM_SCALE. */
export const PATHFINDER_DURATIONS: Record<PathfinderPhase, number> = { carve: 4500, search: 4500, path: 1800, hold: 2500, fade: 1500 };
export const PATHFINDER_FADE_IN_MS = 1200; // calm only: a new maze fades in
export const PATHFINDER_CALM_SCALE = 0.1;
const MAX_DT_MS = 100;

/** Passage bits per cell. */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;
const DIRS = [
  { bit: N, opp: S, dx: 0, dy: -1 },
  { bit: E, opp: W, dx: 1, dy: 0 },
  { bit: S, opp: N, dx: 0, dy: 1 },
  { bit: W, opp: E, dx: -1, dy: 0 },
] as const;

export interface PathfinderState {
  cols: number;
  rows: number;
  cell: number; // square cell side; cols * cell <= width, rows * cell <= height
  ox: number; // grid origin, centred in the viewport
  oy: number;
  width: number;
  height: number;
  calm: boolean;
  passages: number[]; // per cell, bitmask of open sides; a new array per maze
  carve: number[]; // flat [from, to, ...]: the order passages open in
  visited: number[]; // cells in the order A* expanded them
  path: number[]; // start..goal
  start: number;
  goal: number;
  phase: PathfinderPhase;
  t: number; // sim ms into the phase
  nCarve: number; // revealed carve steps / expanded cells / path cells
  nSearch: number;
  nPath: number;
  alpha: number; // 0..1 whole-drawing opacity; only fades move it
  rs: number; // PRNG state for the next maze, so step stays pure
}

/** Recursive-backtracker perfect maze from cell 0; `carve` records each passage as it opens. */
export function generateMaze(rng: () => number, cols: number, rows: number): { passages: number[]; carve: number[] } {
  const passages = new Array<number>(cols * rows).fill(0);
  const seen = new Array<boolean>(cols * rows).fill(false);
  const carve: number[] = [];
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const c = stack[stack.length - 1];
    const x = c % cols;
    const y = (c - x) / cols;
    const open = DIRS.filter((d) => {
      const nx = x + d.dx;
      const ny = y + d.dy;
      return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny * cols + nx];
    });
    if (!open.length) {
      stack.pop();
      continue;
    }
    const d = open[Math.floor(rng() * open.length)];
    const n = c + d.dx + d.dy * cols;
    passages[c] |= d.bit;
    passages[n] |= d.opp;
    seen[n] = true;
    carve.push(c, n);
    stack.push(n);
  }
  return { passages, carve };
}

/** A* with a Manhattan heuristic over open passages. `visited` is the expansion order; `path` runs start..goal (empty if unreachable). */
export function astar(passages: number[], cols: number, rows: number, start: number, goal: number): { visited: number[]; path: number[] } {
  const total = cols * rows;
  const gx = goal % cols;
  const gy = Math.floor(goal / cols);
  const h = (i: number): number => Math.abs((i % cols) - gx) + Math.abs(Math.floor(i / cols) - gy);
  const g = new Array<number>(total).fill(Infinity);
  const from = new Array<number>(total).fill(-1);
  const closed = new Array<boolean>(total).fill(false);
  const visited: number[] = [];
  // Binary min-heap on [f, h, order, cell]; the order tie-break keeps it deterministic.
  const heap: number[][] = [];
  const less = (a: number[], b: number[]): boolean => (a[0] - b[0] || a[1] - b[1] || a[2] - b[2]) < 0;
  const push = (e: number[]): void => {
    heap.push(e);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!less(heap[i], heap[p])) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      i = p;
    }
  };
  const pop = (): number[] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && less(heap[l], heap[m])) m = l;
        if (r < heap.length && less(heap[r], heap[m])) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  };
  let order = 0;
  g[start] = 0;
  push([h(start), h(start), order++, start]);
  while (heap.length) {
    const c = pop()[3];
    if (closed[c]) continue;
    closed[c] = true;
    visited.push(c);
    if (c === goal) {
      const path = [c];
      for (let p = from[c]; p !== -1; p = from[p]) path.push(p);
      return { visited, path: path.reverse() };
    }
    for (const d of DIRS) {
      if (!(passages[c] & d.bit)) continue;
      const n = c + d.dx + d.dy * cols;
      if (closed[n] || g[c] + 1 >= g[n]) continue;
      g[n] = g[c] + 1;
      from[n] = c;
      push([g[n] + h(n), h(n), order++, n]);
    }
  }
  return { visited, path: [] };
}

function grid(view: SaverViewport) {
  const area = Math.max(1, view.width * view.height);
  const target = Math.max(PATHFINDER_CELL, Math.sqrt(area / PATHFINDER_MAX_CELLS));
  const cols = Math.max(2, Math.floor(view.width / target));
  const rows = Math.max(2, Math.floor(view.height / target));
  const cell = Math.max(1, Math.min(view.width / cols, view.height / rows));
  return { cols, rows, cell, ox: (view.width - cols * cell) / 2, oy: (view.height - rows * cell) / 2 };
}

const nextSeed = (rng: () => number): number => Math.floor(rng() * 4294967296) >>> 0;

function counts(phase: PathfinderPhase, t: number, carve: number, visited: number, path: number) {
  const f = Math.min(1, t / PATHFINDER_DURATIONS[phase]);
  const part = (n: number): number => Math.min(n, Math.floor(f * n));
  switch (phase) {
    case 'carve':
      return { nCarve: part(carve), nSearch: 0, nPath: 0 };
    case 'search':
      return { nCarve: carve, nSearch: part(visited), nPath: 0 };
    case 'path':
      return { nCarve: carve, nSearch: visited, nPath: part(path) };
    default:
      return { nCarve: carve, nSearch: visited, nPath: path };
  }
}

function alphaOf(phase: PathfinderPhase, t: number, calm: boolean): number {
  if (phase === 'fade') return Math.max(0, 1 - t / PATHFINDER_DURATIONS.fade);
  if (phase === 'carve' && calm) return Math.min(1, t / PATHFINDER_FADE_IN_MS);
  return 1;
}

function build(seed: number, view: SaverViewport, calm: boolean): PathfinderState {
  const rng = mulberry32(seed);
  const g = grid(view);
  const { passages, carve } = generateMaze(rng, g.cols, g.rows);
  const goal = g.cols * g.rows - 1;
  const { visited, path } = astar(passages, g.cols, g.rows, 0, goal);
  return {
    ...g,
    width: view.width,
    height: view.height,
    calm,
    passages,
    carve,
    visited,
    path,
    start: 0,
    goal,
    phase: 'carve',
    t: 0,
    nCarve: 0,
    nSearch: 0,
    nPath: 0,
    alpha: alphaOf('carve', 0, calm),
    rs: nextSeed(rng),
  };
}

export const pathfinder: SaverMotion<PathfinderState> = {
  init: (seed, view, calm) => build(seed, view, calm),
  step(state, dtMs, view) {
    if (view.width !== state.width || view.height !== state.height) {
      // A resize restarts on the new grid; this keeps everything in bounds.
      return build(state.rs, view, state.calm);
    }
    let phase = state.phase;
    let t = state.t + Math.min(dtMs, MAX_DT_MS) * (state.calm ? PATHFINDER_CALM_SCALE : 1);
    while (t >= PATHFINDER_DURATIONS[phase]) {
      t -= PATHFINDER_DURATIONS[phase];
      const next = PATHFINDER_PHASES[PATHFINDER_PHASES.indexOf(phase) + 1];
      if (!next) return build(state.rs, view, state.calm);
      phase = next;
    }
    return {
      ...state,
      phase,
      t,
      ...counts(phase, t, state.carve.length / 2, state.visited.length, state.path.length),
      alpha: alphaOf(phase, t, state.calm),
    };
  },
};

/** Line trace: phosphor lines advance on a wrapping grid, turning only at right angles. Each keeps a fixed-length tail, so the screen never fills. */
import { mulberry32 } from './Prng';
import type { SaverMotion, SaverViewport } from './SaverMotion';

export const LINE_CELL = 20; // target grid cell, px
export const LINE_TICK_MS = 70; // live: every line advances one cell per tick
export const LINE_TRAIL = 36; // cells of tail each line keeps; older cells vanish
export const LINE_MIN = 8;
export const LINE_MAX = 24;
const LINES_PER_CELLS = 60; // one line per this many grid cells, clamped to MIN..MAX
/** Calm (reduced motion): state changes only this often, by a big step. */
export const LINE_CALM_INTERVAL_MS = 4000;
const CALM_CELLS = 10;
const CALM_START_CELLS = 24;
const MAX_DT_MS = 100;
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

export interface LineSegment {
  line: number;
  t: number; // the line's step number when this segment was drawn
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineHead {
  gx: number;
  gy: number;
  dir: number; // index into DIRS
  run: number; // cells left before the next planned turn
  n: number; // steps taken so far
}

export interface LineTraceState {
  segments: LineSegment[]; // only the live tails; a new array whenever it changes
  heads: LineHead[];
  cols: number; // grid points are 0..cols-1 by 0..rows-1, wrapping at the edges
  rows: number;
  cellX: number; // cols * cellX === width, so every coordinate stays in 0..width
  cellY: number;
  width: number;
  height: number;
  calm: boolean;
  rs: number; // PRNG state, so step stays pure
  acc: number; // ms since the last tick (calm: since the last big step)
}

function grid(view: SaverViewport) {
  const cols = Math.max(1, Math.round(view.width / LINE_CELL));
  const rows = Math.max(1, Math.round(view.height / LINE_CELL));
  return { cols, rows, cellX: view.width / cols, cellY: view.height / rows };
}

const nextSeed = (rng: () => number): number => Math.floor(rng() * 4294967296) >>> 0;
const runLength = (rng: () => number): number => 3 + Math.floor(rng() * 10);
const wrap = (v: number, n: number): number => ((v % n) + n) % n;

function freshLines(rng: () => number, cols: number, rows: number): LineHead[] {
  const n = Math.min(LINE_MAX, Math.max(LINE_MIN, Math.round((cols * rows) / LINES_PER_CELLS)));
  const heads: LineHead[] = [];
  for (let i = 0; i < n; i++) {
    heads.push({ gx: Math.floor(rng() * cols), gy: Math.floor(rng() * rows), dir: Math.floor(rng() * 4), run: runLength(rng), n: 0 });
  }
  return heads;
}

function advance(state: LineTraceState, heads: LineHead[], segments: LineSegment[], rng: () => number): LineHead[] {
  return heads.map((h, line) => {
    let dir = h.dir;
    let run = h.run;
    if (run <= 0) {
      dir = rng() < 0.5 ? (dir + 1) % 4 : (dir + 3) % 4;
      run = runLength(rng);
    }
    const [dx, dy] = DIRS[dir];
    // Leaving through the left/top edge re-enters from the right/bottom one: start from that far edge.
    const x1 = (h.gx === 0 && dx < 0 ? state.cols : h.gx) * state.cellX;
    const y1 = (h.gy === 0 && dy < 0 ? state.rows : h.gy) * state.cellY;
    segments.push({ line, t: h.n, x1, y1, x2: x1 + dx * state.cellX, y2: y1 + dy * state.cellY });
    return { gx: wrap(h.gx + dx, state.cols), gy: wrap(h.gy + dy, state.rows), dir, run: run - 1, n: h.n + 1 };
  });
}

function build(seed: number, view: SaverViewport, calm: boolean): LineTraceState {
  const rng = mulberry32(seed);
  const g = grid(view);
  const state: LineTraceState = {
    segments: [],
    heads: freshLines(rng, g.cols, g.rows),
    ...g,
    width: view.width,
    height: view.height,
    calm,
    rs: 0,
    acc: 0,
  };
  return tick(state, calm ? CALM_START_CELLS : 0, 0, nextSeed(rng));
}

function tick(state: LineTraceState, cells: number, acc: number, seed: number): LineTraceState {
  const rng = mulberry32(seed);
  let heads = state.heads;
  const segments = state.segments.slice();
  for (let i = 0; i < cells; i++) heads = advance(state, heads, segments, rng);
  const live = segments.filter((g) => g.t > heads[g.line].n - 1 - LINE_TRAIL);
  return { ...state, heads, segments: live, rs: nextSeed(rng), acc };
}

export const lineTrace: SaverMotion<LineTraceState> = {
  init: (seed, view, calm) => build(seed, view, calm),
  step(state, dtMs, view) {
    if (view.width !== state.width || view.height !== state.height) {
      // A resize restarts the trace on the new grid; this keeps every point in bounds.
      return build(state.rs, view, state.calm);
    }
    if (state.calm) {
      const acc = state.acc + dtMs;
      if (acc < LINE_CALM_INTERVAL_MS) return state.acc === acc ? state : { ...state, acc };
      return tick(state, CALM_CELLS, acc % LINE_CALM_INTERVAL_MS, state.rs);
    }
    const acc = state.acc + Math.min(dtMs, MAX_DT_MS);
    const cells = Math.floor(acc / LINE_TICK_MS);
    if (cells === 0) return { ...state, acc };
    return tick(state, cells, acc - cells * LINE_TICK_MS, state.rs);
  },
};

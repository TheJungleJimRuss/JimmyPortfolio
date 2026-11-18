/** Circuit: traces route across a board like a PCB, in straight runs with 45 degree bends, never touching. Pads cap each trace; vias dot the bends. When the board is done it holds, fades and restarts. */
import { mulberry32 } from './Prng';
import type { SaverMotion, SaverViewport } from './SaverMotion';

export const CIRCUIT_CELL = 14; // target grid cell, px
export const CIRCUIT_TICK_MS = 60; // live: every active trace advances one cell per tick
export const CIRCUIT_CALM_TICK_MS = 600; // calm (reduced motion): one tenth of the pace
export const CIRCUIT_HOLD_MS = 2500;
export const CIRCUIT_FADE_IN_MS = 700;
export const CIRCUIT_FADE_OUT_MS = 1400;
const CALM_START_TICKS = 12;
const MAX_DT_MS = 100;
const MAX_TICKS_PER_STEP = 20;
const SPAWN_TRIES = 3;
const SPAWN_FAILS = 40; // consecutive failed spawns with nothing growing means the board is done
const VIA_CHANCE = 0.12; // per bend
const CELLS_PER_ACTIVE = 300;
const CELLS_PER_TRACE = 25;

// Eight directions, clockwise from east. A turn is +1 or -1 (mod 8): 45 degrees.
const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];

export interface CircuitTrace {
  cells: number[]; // grid cell indexes (gy * cols + gx), in routing order; first is the start pad, last the end pad once done
  dir: number; // index into DX/DY
  run: number; // cells left before the next planned bend
  left: number; // cell budget left before the trace ends
  active: boolean;
}

export interface CircuitState {
  traces: CircuitTrace[];
  vias: number[]; // cell indexes of via dots (always on a traced cell)
  occ: Uint8Array; // 1 where a trace sits
  cols: number;
  rows: number;
  cellX: number; // cols * cellX === width, so every coordinate stays in 0..width
  cellY: number;
  width: number;
  height: number;
  calm: boolean;
  phase: 'grow' | 'hold' | 'out';
  alpha: number; // 0..1 overall brightness; ramps instead of cutting
  t: number; // ms in the current phase
  fails: number;
  rs: number; // PRNG state, so step stays pure
  acc: number; // ms since the last tick
}

const nextSeed = (rng: () => number): number => Math.floor(rng() * 4294967296) >>> 0;
const runLength = (rng: () => number): number => 2 + Math.floor(rng() * 6);
const budget = (rng: () => number): number => 18 + Math.floor(rng() * 40);
const mod8 = (n: number): number => (n + 8) % 8;

function grid(view: SaverViewport) {
  const cols = Math.max(3, Math.round(view.width / CIRCUIT_CELL));
  const rows = Math.max(3, Math.round(view.height / CIRCUIT_CELL));
  return { cols, rows, cellX: view.width / cols, cellY: view.height / rows };
}

const activeTarget = (cols: number, rows: number): number => Math.min(10, Math.max(3, Math.round((cols * rows) / CELLS_PER_ACTIVE)));
const maxTraces = (cols: number, rows: number): number => Math.min(160, Math.max(8, Math.round((cols * rows) / CELLS_PER_TRACE)));

/** A cell is usable when it is on the board, free, and nothing but the head touches it. */
function open(occ: Uint8Array, cols: number, rows: number, x: number, y: number, head: number): boolean {
  if (x < 0 || y < 0 || x >= cols || y >= rows || occ[y * cols + x]) return false;
  for (let k = 0; k < 8; k++) {
    const nx = x + DX[k];
    const ny = y + DY[k];
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
    const i = ny * cols + nx;
    if (i !== head && occ[i]) return false;
  }
  return true;
}

function build(seed: number, view: SaverViewport, calm: boolean): CircuitState {
  const rng = mulberry32(seed);
  const g = grid(view);
  let state: CircuitState = {
    traces: [],
    vias: [],
    occ: new Uint8Array(g.cols * g.rows),
    ...g,
    width: view.width,
    height: view.height,
    calm,
    phase: 'grow',
    alpha: 0,
    t: 0,
    fails: 0,
    rs: nextSeed(rng),
    acc: 0,
  };
  state = tick(state, calm ? CALM_START_TICKS : 1);
  return state;
}

/** Advances `ticks` routing ticks on private copies; the input state is never touched. */
function tick(state: CircuitState, ticks: number): CircuitState {
  const rng = mulberry32(state.rs);
  const { cols, rows } = state;
  const occ = state.occ.slice();
  const traces = state.traces.slice();
  const vias = state.vias.slice();
  const target = activeTarget(cols, rows);
  const cap = maxTraces(cols, rows);
  let fails = state.fails;
  let done = false;

  for (let n = 0; n < ticks && !done; n++) {
    let active = 0;
    for (let i = 0; i < traces.length; i++) {
      if (!traces[i].active) continue;
      const t = (traces[i] = { ...traces[i], cells: traces[i].cells.slice() });
      const head = t.cells[t.cells.length - 1];
      const hx = head % cols;
      const hy = Math.floor(head / cols);
      const turns = rng() < 0.5 ? [1, -1] : [-1, 1];
      const order = t.run > 0 ? [0, ...turns] : [...turns, 0];
      let moved = false;
      for (const o of order) {
        const d = mod8(t.dir + o);
        const nx = hx + DX[d];
        const ny = hy + DY[d];
        if (!open(occ, cols, rows, nx, ny, head)) continue;
        const idx = ny * cols + nx;
        occ[idx] = 1;
        t.cells.push(idx);
        if (o !== 0) {
          if (rng() < VIA_CHANCE) vias.push(head);
          t.run = runLength(rng);
        } else if (t.run <= 0) {
          t.run = runLength(rng);
        }
        t.dir = d;
        t.run -= 1;
        t.left -= 1;
        moved = true;
        break;
      }
      if (!moved || t.left <= 0) t.active = false;
      else active += 1;
    }

    for (let tries = 0; tries < SPAWN_TRIES && active < target && traces.length < cap; tries++) {
      const gx = Math.floor(rng() * cols);
      const gy = Math.floor(rng() * rows);
      const dir = Math.floor(rng() * 8);
      const idx = gy * cols + gx;
      if (open(occ, cols, rows, gx, gy, -1) && open(occ, cols, rows, gx + DX[dir], gy + DY[dir], idx)) {
        occ[idx] = 1;
        traces.push({ cells: [idx], dir, run: runLength(rng), left: budget(rng), active: true });
        active += 1;
        fails = 0;
      } else {
        fails += 1;
      }
    }
    if (active === 0 && (traces.length >= cap || fails >= SPAWN_FAILS)) done = true;
  }

  const next = { ...state, traces, vias, occ, fails, rs: nextSeed(rng) };
  return done ? { ...next, phase: 'hold', t: 0 } : next;
}

export const circuit: SaverMotion<CircuitState> = {
  init: (seed, view, calm) => build(seed, view, calm),
  step(state, dtMs, view) {
    if (view.width !== state.width || view.height !== state.height) {
      // A resize restarts the board on the new grid, fading in; the old bitmap is cleared by the renderer.
      return build(state.rs, view, state.calm);
    }
    const dt = Math.min(dtMs, 1000);
    if (state.phase === 'out') {
      const alpha = state.alpha - dt / CIRCUIT_FADE_OUT_MS;
      if (alpha > 0) return { ...state, alpha, t: state.t + dt };
      return build(state.rs, view, state.calm);
    }
    const alpha = Math.min(1, state.alpha + dt / CIRCUIT_FADE_IN_MS);
    if (state.phase === 'hold') {
      const t = state.t + dt;
      return t >= CIRCUIT_HOLD_MS ? { ...state, alpha, phase: 'out', t: 0 } : { ...state, alpha, t };
    }
    const tickMs = state.calm ? CIRCUIT_CALM_TICK_MS : CIRCUIT_TICK_MS;
    const acc = state.acc + (state.calm ? dtMs : Math.min(dtMs, MAX_DT_MS));
    const ticks = Math.min(MAX_TICKS_PER_STEP, Math.floor(acc / tickMs));
    if (ticks === 0) return { ...state, alpha, acc, t: state.t + dt };
    const grown = tick(state, ticks);
    return { ...grown, alpha, acc: acc - Math.floor(acc / tickMs) * tickMs, t: state.t + dt };
  },
};

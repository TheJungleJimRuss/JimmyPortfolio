/** Terrain: a vector-display wireframe flyover. A seeded height grid scrolls toward the camera; passed rows are recycled at the far end. */
import { mulberry32 } from './Prng';
import type { SaverMotion, SaverViewport } from './SaverMotion';

export const TERRAIN_COLS = 40;
export const TERRAIN_ROWS = 30;
export const TERRAIN_SPEED = 4; // live: grid rows flown per second
export const CALM_FACTOR = 0.1; // calm (reduced motion): about a tenth of the pace
export const CELL_X = 0.9; // world units between columns (rows are 1 apart)
export const CAM_HEIGHT = 1.6;
export const ROW_NEAR = 2.2; // depth of the nearest row when off = 0
export const CULL_DEPTH = 1.2; // nothing nearer than this is projected; the nearest row is always farther
export const FAR_DEPTH = ROW_NEAR + TERRAIN_ROWS - 1;
const FOCAL = 0.8; // focal length, in viewport heights
const HORIZON = 0.38; // horizon height, as a fraction of the viewport
const LATTICE = 3; // noise lattice spacing, in columns and in rows
const MAX_DT_MS = 100;

export interface TerrainState {
  seed: number;
  rows: number[][]; // rows[0] is the nearest; each row is TERRAIN_COLS heights. Rows are never mutated.
  first: number; // world row index of rows[0]
  off: number; // 0..1: how far the camera has moved past rows[0]
  calm: boolean;
}

export interface Pt {
  x: number;
  y: number;
}

/** Lattice value in 0..1, a pure function of (seed, i, j). */
function lattice(seed: number, i: number, j: number): number {
  return mulberry32((seed ^ Math.imul(i, 374761393) ^ Math.imul(j, 668265263)) >>> 0)();
}
const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Heights for one world row: smooth value noise, scaled low in the middle (a valley) and high at the sides (ridges). */
export function rowHeights(seed: number, worldRow: number): number[] {
  const rj = Math.floor(worldRow / LATTICE);
  const tr = smooth((worldRow - rj * LATTICE) / LATTICE);
  const out: number[] = [];
  const half = (TERRAIN_COLS - 1) / 2;
  const cache = new Map<number, number>();
  const at = (ci: number): number => {
    let v = cache.get(ci);
    if (v === undefined) {
      v = lattice(seed, ci, rj) * (1 - tr) + lattice(seed, ci, rj + 1) * tr;
      cache.set(ci, v);
    }
    return v;
  };
  for (let c = 0; c < TERRAIN_COLS; c++) {
    const ci = Math.floor(c / LATTICE);
    const tc = smooth((c - ci * LATTICE) / LATTICE);
    const n = at(ci) * (1 - tc) + at(ci + 1) * tc;
    const u = Math.abs(c - half) / half;
    out.push(n * (0.2 + 2.4 * Math.pow(u, 1.6)));
  }
  return out;
}

/** Perspective projection of a world point (x sideways, y up, depth ahead of the camera); null at or behind the near plane. */
export function project(x: number, y: number, depth: number, view: SaverViewport): Pt | null {
  if (!(depth >= CULL_DEPTH * 0.5)) return null;
  const f = FOCAL * Math.min(view.height, view.width);
  return { x: view.width / 2 + (x / depth) * f, y: view.height * HORIZON + ((CAM_HEIGHT - y) / depth) * f };
}

export const rowDepth = (state: TerrainState, r: number): number => ROW_NEAR + r - state.off;

/** Screen points for row r of the state, or null when it is too near to draw. */
export function projectRow(state: TerrainState, r: number, view: SaverViewport): Pt[] | null {
  const d = rowDepth(state, r);
  if (d < CULL_DEPTH) return null;
  const heights = state.rows[r];
  const half = (TERRAIN_COLS - 1) / 2;
  const pts: Pt[] = [];
  for (let c = 0; c < TERRAIN_COLS; c++) {
    const p = project((c - half) * CELL_X, heights[c], d, view);
    if (!p) return null;
    pts.push(p);
  }
  return pts;
}

function fresh(seed: number, first: number): number[][] {
  const rows: number[][] = [];
  for (let k = 0; k < TERRAIN_ROWS; k++) rows.push(rowHeights(seed, first + k));
  return rows;
}

export const terrain: SaverMotion<TerrainState> = {
  init: (seed, _view, calm) => ({ seed: seed >>> 0, rows: fresh(seed >>> 0, 0), first: 0, off: 0, calm }),
  step(state, dtMs, _view) {
    const dt = state.calm ? dtMs : Math.min(dtMs, MAX_DT_MS);
    const travelled = state.off + (dt / 1000) * TERRAIN_SPEED * (state.calm ? CALM_FACTOR : 1);
    const n = Math.floor(travelled);
    if (n === 0) return { ...state, off: travelled };
    const first = state.first + n;
    const rows: number[][] = [];
    for (let k = 0; k < TERRAIN_ROWS; k++) rows.push(k + n < TERRAIN_ROWS ? state.rows[k + n] : rowHeights(state.seed, first + k));
    return { ...state, rows, first, off: travelled - n };
  },
};

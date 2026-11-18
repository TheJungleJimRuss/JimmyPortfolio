/** Contours: topographic lines (marching squares) over a slowly evolving seeded height field. State is just time + seed + grid size. */
import type { SaverMotion, SaverViewport } from './SaverMotion';

export const CONTOUR_CELL = 20; // target sample cell, CSS px
export const CONTOUR_LEVELS = 8;
export const CONTOUR_INDEX_EVERY = 4; // levels 0, 4 are index contours
const LEVEL_LO = 0.22;
const LEVEL_STEP = 0.08;
export const CONTOUR_FEATURE_PX = 260; // one noise lattice unit in space
/** Live pace: noise time units per second (one lattice unit in time = ~12s, so the map reshapes over about a minute). */
export const CONTOUR_RATE = 1 / 12;
export const CONTOUR_CALM_FACTOR = 0.1;
const MAX_DT_MS = 100;

export interface ContoursState {
  seed: number;
  t: number; // noise time coordinate
  width: number;
  height: number;
  cols: number; // sample points are 0..cols by 0..rows; cols * cellX === width
  rows: number;
  cellX: number;
  cellY: number;
  calm: boolean;
}

export interface ContourSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const contourLevel = (i: number): number => LEVEL_LO + i * LEVEL_STEP;
export const isIndexLevel = (i: number): boolean => i % CONTOUR_INDEX_EVERY === 0;

// --- seeded 3D value noise ---

function hash(seed: number, x: number, y: number, z: number): number {
  let h = (seed ^ Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x9e3779b1)) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function value3(seed: number, x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  const c = (dx: number, dy: number, dz: number) => hash(seed, xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

/** Two octaves of smooth value noise, in 0..1. Continuous in x, y and z. */
export function noise3(seed: number, x: number, y: number, z: number): number {
  return (value3(seed, x, y, z) * 2 + value3(seed + 101, x * 2.1 + 7.3, y * 2.1 + 3.1, z * 1.6 + 5.9)) / 3;
}

/** Height field on the sample grid, row-major, (cols+1) * (rows+1) values. */
export function sampleField(s: ContoursState): Float32Array {
  const out = new Float32Array((s.cols + 1) * (s.rows + 1));
  const seed = s.seed >>> 0;
  let k = 0;
  for (let j = 0; j <= s.rows; j++) {
    for (let i = 0; i <= s.cols; i++) out[k++] = noise3(seed, (i * s.cellX) / CONTOUR_FEATURE_PX, (j * s.cellY) / CONTOUR_FEATURE_PX, s.t);
  }
  return out;
}

/** Line segments where a (cols+1) x (rows+1) scalar grid crosses `level`. Endpoints lie on cell edges, linearly interpolated. */
export function marchingSquares(values: ArrayLike<number>, cols: number, rows: number, level: number, cellX: number, cellY: number): ContourSegment[] {
  const out: ContourSegment[] = [];
  const stride = cols + 1;
  const at = (i: number, j: number): number => values[j * stride + i];
  const frac = (a: number, b: number): number => (a === b ? 0.5 : (level - a) / (b - a));
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tl = at(i, j), tr = at(i + 1, j), br = at(i + 1, j + 1), bl = at(i, j + 1);
      const code = (tl >= level ? 8 : 0) | (tr >= level ? 4 : 0) | (br >= level ? 2 : 0) | (bl >= level ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const x0 = i * cellX, y0 = j * cellY;
      const top = { x: x0 + frac(tl, tr) * cellX, y: y0 };
      const right = { x: x0 + cellX, y: y0 + frac(tr, br) * cellY };
      const bottom = { x: x0 + frac(bl, br) * cellX, y: y0 + cellY };
      const left = { x: x0, y: y0 + frac(tl, bl) * cellY };
      const seg = (a: { x: number; y: number }, b: { x: number; y: number }) => out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      switch (code) {
        case 1: case 14: seg(left, bottom); break;
        case 2: case 13: seg(bottom, right); break;
        case 3: case 12: seg(left, right); break;
        case 4: case 11: seg(top, right); break;
        case 6: case 9: seg(top, bottom); break;
        case 7: case 8: seg(left, top); break;
        case 5: case 10: {
          const high = (tl + tr + br + bl) / 4 >= level;
          // Corners tl+br (10) or tr+bl (5) are high; the centre decides whether they join.
          const joined = code === 10 ? high : !high;
          if (joined) { seg(left, top); seg(bottom, right); } else { seg(left, bottom); seg(top, right); }
          break;
        }
      }
    }
  }
  return out;
}

function dims(view: SaverViewport) {
  const cols = Math.max(1, Math.round(view.width / CONTOUR_CELL));
  const rows = Math.max(1, Math.round(view.height / CONTOUR_CELL));
  return { width: view.width, height: view.height, cols, rows, cellX: view.width / cols, cellY: view.height / rows };
}

export const contours: SaverMotion<ContoursState> = {
  init: (seed, view, calm) => ({ seed: seed >>> 0, t: 0, calm, ...dims(view) }),
  step(state, dtMs, view) {
    const base = view.width !== state.width || view.height !== state.height ? { ...state, ...dims(view) } : state;
    const dt = Math.min(Math.max(dtMs, 0), MAX_DT_MS) / 1000;
    return { ...base, t: base.t + dt * CONTOUR_RATE * (base.calm ? CONTOUR_CALM_FACTOR : 1) };
  },
};

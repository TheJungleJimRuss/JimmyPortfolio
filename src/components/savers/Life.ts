/** Life: the Hero name, from a small hand-authored bitmap, runs under Conway's rules on a wrapping grid. A stalled board or ~60s fades out and re-seeds from the name. */
import type { SaverMotion, SaverViewport } from './SaverMotion';

/** The letters J I M M Y / R U S S as 5x7 cells ('#' = live), two lines so the name fills a landscape and a portrait screen. */
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  J: ['...##', '...##', '...##', '...##', '##.##', '##.##', '.###.'],
  I: ['#####', '.###.', '.###.', '.###.', '.###.', '.###.', '#####'],
  M: ['##.##', '#####', '#####', '##.##', '##.##', '##.##', '##.##'],
  Y: ['##.##', '##.##', '.###.', '.###.', '..#..', '..#..', '..#..'],
  R: ['####.', '##.##', '##.##', '####.', '###..', '##.##', '##.##'],
  U: ['##.##', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.'],
  S: ['.####', '##...', '##...', '.###.', '...##', '...##', '####.'],
};
const GLYPH_W = 5;
const GLYPH_H = 7;
const LETTER_GAP = 1;
const LINE_GAP = 2;
const WORDS = ['JIMMY', 'RUSS'] as const;

/** Each line as 7 rows of '#'/'.', letters joined with a one-cell gap. */
export const NAME_LINES: readonly (readonly string[])[] = WORDS.map((w) =>
  Array.from({ length: GLYPH_H }, (_, r) => [...w].map((ch) => GLYPHS[ch][r]).join('.'.repeat(LETTER_GAP))),
);
export const NAME_W = GLYPH_W * 5 + LETTER_GAP * 4; // widest line, JIMMY
export const NAME_H = GLYPH_H * 2 + LINE_GAP;

export const LIFE_TICK_MS = 110; // ~9 generations per second
/** Calm (reduced motion): at most one generation this often (about a tenth of the pace or slower). */
export const LIFE_CALM_INTERVAL_MS = 3000;
export const LIFE_MAX_MS = 60000; // live cap before re-seeding
export const LIFE_CALM_MAX_MS = 180000;
export const LIFE_FADE_MS = 900;
export const LIFE_CALM_FADE_MS = 2400;
export const LIFE_HOLD_MS = 1500; // the name stays readable this long before generation 1
export const LIFE_CALM_HOLD_MS = 4000;
export const LIFE_CALM_BLEND_MS = 900; // calm: each generation cross-fades in over this long
export const LIFE_HIST = 16; // recent generation hashes kept for repeat detection
const NAME_SPAN = 0.72; // the name spans this fraction of the width (or the height limit, if smaller)
/** Each glyph pixel is LIFE_PIX x LIFE_PIX cells: finer cells and open space around the name give the run room to evolve. */
export const LIFE_PIX = 2;
export const LIFE_MAX_CELLS = 24000;
const MAX_DT_MS = 100;

export type LifePhase = 'in' | 'live' | 'out';

export interface LifeState {
  cells: Uint8Array; // cols * rows, 1 = alive
  prev: Uint8Array; // the generation before, for the calm cross-fade
  cols: number;
  rows: number;
  cell: number; // px per cell; the grid is cols*cell by rows*cell, centered by the renderer
  width: number;
  height: number;
  calm: boolean;
  phase: LifePhase;
  t: number; // ms in the current phase
  alpha: number; // overall opacity 0..1
  acc: number; // ms since the last generation
  age: number; // ms since the last seeding
  gen: number; // generations since the last seeding
  total: number; // generations overall
  hist: number[]; // hashes of the last LIFE_HIST generations
}

function gridFor(view: SaverViewport) {
  const w = NAME_W * LIFE_PIX;
  const h = NAME_H * LIFE_PIX;
  // Floor the cell size so extreme viewports stay under LIFE_MAX_CELLS (a few ms per generation at most).
  const minCell = Math.sqrt((view.width * view.height) / LIFE_MAX_CELLS);
  const cell = Math.max(1, minCell, Math.min((view.width * NAME_SPAN) / w, (view.height * 0.7) / h));
  const cols = Math.max(w, Math.floor(view.width / cell));
  const rows = Math.max(h, Math.min(Math.floor(view.height / cell), Math.floor(LIFE_MAX_CELLS / cols)));
  return { cell, cols, rows };
}

/** The name pattern centered on a cols x rows grid. */
export function namePattern(cols: number, rows: number): Uint8Array {
  const out = new Uint8Array(cols * rows);
  const k = LIFE_PIX;
  const top = Math.floor((rows - NAME_H * k) / 2);
  NAME_LINES.forEach((line, li) => {
    const y0 = top + li * (GLYPH_H + LINE_GAP) * k;
    const x0 = Math.floor((cols - line[0].length * k) / 2);
    line.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== '#') continue;
        for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) out[(y0 + r * k + dy) * cols + x0 + c * k + dx] = 1;
      }
    });
  });
  return out;
}

/** One Conway generation on a wrapping grid. Returns a new array. */
export function nextGeneration(cells: Uint8Array, cols: number, rows: number): Uint8Array {
  const out = new Uint8Array(cells.length);
  for (let y = 0; y < rows; y++) {
    const up = ((y + rows - 1) % rows) * cols;
    const mid = y * cols;
    const dn = ((y + 1) % rows) * cols;
    for (let x = 0; x < cols; x++) {
      const l = (x + cols - 1) % cols;
      const r = (x + 1) % cols;
      const n = cells[up + l] + cells[up + x] + cells[up + r] + cells[mid + l] + cells[mid + r] + cells[dn + l] + cells[dn + x] + cells[dn + r];
      out[mid + x] = n === 3 || (n === 2 && cells[mid + x] === 1) ? 1 : 0;
    }
  }
  return out;
}

function hashCells(cells: Uint8Array): number {
  let h = 2166136261;
  for (let i = 0; i < cells.length; i++) h = Math.imul(h ^ cells[i], 16777619);
  return h >>> 0;
}

function seeded(base: Pick<LifeState, 'cols' | 'rows' | 'cell' | 'width' | 'height' | 'calm' | 'total'>): LifeState {
  const cells = namePattern(base.cols, base.rows);
  return { ...base, cells, prev: cells, phase: 'in', t: 0, alpha: 0, acc: 0, age: 0, gen: 0, hist: [hashCells(cells)] };
}

function build(view: SaverViewport, calm: boolean): LifeState {
  return seeded({ ...gridFor(view), width: view.width, height: view.height, calm, total: 0 });
}

const fadeMs = (calm: boolean): number => (calm ? LIFE_CALM_FADE_MS : LIFE_FADE_MS);

function advance(s: LifeState, dt: number): LifeState {
  const fade = fadeMs(s.calm);
  const t = s.t + dt;
  if (s.phase === 'in') {
    const alpha = Math.min(1, t / fade);
    if (t >= fade + (s.calm ? LIFE_CALM_HOLD_MS : LIFE_HOLD_MS)) return { ...s, phase: 'live', t: 0, alpha: 1, acc: 0 };
    return { ...s, t, alpha };
  }
  if (s.phase === 'out') {
    if (t >= fade) return seeded(s); // the board is invisible now: re-seed from the name
    return { ...s, t, alpha: 1 - t / fade };
  }
  const age = s.age + dt;
  const interval = s.calm ? LIFE_CALM_INTERVAL_MS : LIFE_TICK_MS;
  let acc = s.acc + dt;
  if (acc < interval) return { ...s, t, age, acc };
  // Calm takes at most one generation per step; live may catch up a few.
  let n = s.calm ? 1 : Math.floor(acc / interval);
  acc = s.calm ? 0 : acc - n * interval;
  let { cells, prev, gen, total } = s;
  let hist = s.hist;
  let stalled = false;
  while (n-- > 0 && !stalled) {
    prev = cells;
    cells = nextGeneration(cells, s.cols, s.rows);
    gen++;
    total++;
    const h = hashCells(cells);
    stalled = hist.includes(h);
    hist = [...hist, h].slice(-LIFE_HIST);
  }
  const done = stalled || age >= (s.calm ? LIFE_CALM_MAX_MS : LIFE_MAX_MS);
  return { ...s, cells, prev, gen, total, hist, acc, age, t: done ? 0 : t, phase: done ? 'out' : 'live' };
}

export const life: SaverMotion<LifeState> = {
  // The name is the whole seed, so the PRNG seed is unused: every run starts the same way.
  init: (_seed, view, calm) => build(view, calm),
  step(state, dtMs, view) {
    if (view.width !== state.width || view.height !== state.height) return build(view, state.calm); // a resize restarts on the new grid
    return advance(state, Math.min(dtMs, MAX_DT_MS));
  },
};

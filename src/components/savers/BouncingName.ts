/**
 * Bouncing name: the Hero name (JIMMY over RUSS) travels diagonally at a constant speed and bounces off the
 * viewport edges. An exact corner hit sets `cornerHit` for that step and bumps `corners`.
 * The box size is derived from the viewport (see `metrics`), so a resize just recomputes it and clamps the name back in.
 */
import { mulberry32 } from './Prng';
import { reflect, type SaverMotion, type SaverViewport } from './SaverMotion';

/** Calm (reduced motion): no movement, a new seeded spot this often. */
export const CALM_INTERVAL_MS = 4000;
/** Both axes reflecting within this many px of each other counts as an exact corner hit. */
export const CORNER_TOLERANCE_PX = 2;
const MAX_DT_MS = 100;
const SPEEDS = [90, 120, 150]; // integer px/s per axis
const BOX_W = 3.5; // box width, in em of the hero font (widest line, JIMMY)
const BOX_H = 1.9; // box height, in em (two stacked lines)

export interface BouncingNameState {
  x: number; // box top-left, px
  y: number;
  vx: number; // px per second
  vy: number;
  w: number; // box size, px
  h: number;
  size: number; // font size, px
  calm: boolean;
  acc: number; // calm: ms since the last jump
  seed: number;
  jumps: number; // calm: how many jumps so far
  corners: number; // exact corner hits so far
  cornerHit: boolean; // true only for the step in which a corner was hit
}

function metrics(view: SaverViewport): { size: number; w: number; h: number } {
  let size = Math.max(16, Math.min(view.width * 0.18, view.height * 0.22));
  size = Math.min(size, (view.width * 0.9) / BOX_W, (view.height * 0.9) / BOX_H);
  return { size, w: size * BOX_W, h: size * BOX_H };
}

function randomSpot(seed: number, w: number, h: number, view: SaverViewport): { x: number; y: number } {
  const rng = mulberry32(seed);
  return { x: Math.round(rng() * Math.max(0, view.width - w)), y: Math.round(rng() * Math.max(0, view.height - h)) };
}

export const bouncingName: SaverMotion<BouncingNameState> = {
  init(seed, view, calm) {
    const rng = mulberry32(seed);
    const { size, w, h } = metrics(view);
    // Integer speeds on a 10px grid keep both axes in step, so corner hits happen now and then.
    const speed = SPEEDS[Math.floor(rng() * SPEEDS.length)];
    const grid = (range: number): number => Math.round((rng() * Math.max(0, range)) / 10) * 10;
    const x = Math.min(grid(view.width - w), Math.max(0, view.width - w));
    const y = Math.min(grid(view.height - h), Math.max(0, view.height - h));
    return {
      x,
      y,
      vx: rng() < 0.5 ? -speed : speed,
      vy: rng() < 0.5 ? -speed : speed,
      w,
      h,
      size,
      calm,
      acc: 0,
      seed,
      jumps: 0,
      corners: 0,
      cornerHit: false,
    };
  },
  step(state, dtMs, view) {
    const { size, w, h } = metrics(view);
    if (state.calm) {
      const acc = state.acc + dtMs;
      const fit = (s: BouncingNameState): BouncingNameState => ({
        ...s,
        x: Math.min(Math.max(0, s.x), Math.max(0, view.width - w)),
        y: Math.min(Math.max(0, s.y), Math.max(0, view.height - h)),
        w,
        h,
        size,
        cornerHit: false,
      });
      if (acc < CALM_INTERVAL_MS) return fit({ ...state, acc });
      const jumps = state.jumps + 1;
      const spot = randomSpot(state.seed + jumps * 7919, w, h, view);
      return fit({ ...state, ...spot, jumps, acc: acc % CALM_INTERVAL_MS });
    }
    const seconds = Math.min(dtMs, MAX_DT_MS) / 1000;
    const rx = reflect(state.x + state.vx * seconds, state.vx, 0, view.width - w);
    const ry = reflect(state.y + state.vy * seconds, state.vy, 0, view.height - h);
    const flipX = rx.v !== state.vx;
    const flipY = ry.v !== state.vy;
    const near = (p: number, range: number): boolean => Math.min(Math.abs(p), Math.abs(range - p)) <= CORNER_TOLERANCE_PX;
    const cornerHit =
      (flipX && (flipY || near(ry.p, view.height - h))) || (flipY && near(rx.p, view.width - w));
    return {
      ...state,
      x: rx.p,
      y: ry.p,
      vx: rx.v,
      vy: ry.v,
      w,
      h,
      size,
      cornerHit,
      corners: state.corners + (cornerHit ? 1 : 0),
    };
  },
};

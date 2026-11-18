/** Drone patrol: a small wireframe quadcopter flies lazy Lissajous-style loops across black (teaser for the Drone side). */
import { mulberry32 } from './Prng';
import type { SaverMotion, SaverViewport } from './SaverMotion';

/** Calm (reduced motion): the drone hovers, then hops to a new seeded spot this often. */
export const DRONE_CALM_INTERVAL_MS = 4000;
/** Heading turns no faster than this (rad/s), so banking stays smooth. */
export const MAX_TURN_RATE = 2.2;
const MAX_DT_MS = 100;
const SPIN_RATE = 16; // rotor blur arcs, rad/s

export interface DronePatrolState {
  x: number; // center, px
  y: number;
  heading: number; // rad, 0 = +x
  bank: number; // -1..1, smoothed turn rate
  spin: number; // rotor blur phase, rad (0 and frozen when calm)
  size: number; // overall span, px
  margin: number; // keep-out from the viewport edge, px
  calm: boolean;
  acc: number; // calm: ms since the last hop
  hops: number; // calm: hop counter, seeds the next spot
  seed: number;
  // Path: x = cx + ax * rangeX * sin(px), y = cy + ay * rangeY * sin(py)
  px: number;
  py: number;
  mod: number; // slow modulation phase (drifts frequencies and amplitudes)
  fx: number; // base angular speeds, rad/s
  fy: number;
  ax: number; // amplitude fractions, 0..1
  ay: number;
  q: number; // modulation offsets
}

function metrics(view: SaverViewport): { size: number; margin: number } {
  const size = Math.max(12, Math.min(view.width, view.height) * 0.08);
  return { size, margin: size / 2 };
}

const clamp = (v: number, lo: number, hi: number): number => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));

function onPath(s: DronePatrolState, view: SaverViewport, margin: number): { x: number; y: number } {
  const rx = Math.max(0, view.width / 2 - margin);
  const ry = Math.max(0, view.height / 2 - margin);
  const ax = s.ax * (0.85 + 0.15 * Math.sin(s.mod * 0.7 + s.q));
  const ay = s.ay * (0.85 + 0.15 * Math.sin(s.mod * 0.5 + s.q * 2));
  return { x: view.width / 2 + ax * rx * Math.sin(s.px), y: view.height / 2 + ay * ry * Math.sin(s.py) };
}

function hopSpot(seed: number, hops: number, view: SaverViewport, margin: number): { x: number; y: number; heading: number } {
  const rng = mulberry32((seed + Math.imul(hops + 1, 7919)) >>> 0);
  const x = margin + rng() * Math.max(0, view.width - 2 * margin);
  const y = margin + rng() * Math.max(0, view.height - 2 * margin);
  return { x, y, heading: (rng() - 0.5) * Math.PI * 0.5 };
}

export const dronePatrol: SaverMotion<DronePatrolState> = {
  init(seed, view, calm) {
    const rng = mulberry32(seed);
    const { size, margin } = metrics(view);
    const base: DronePatrolState = {
      x: 0, y: 0, heading: 0, bank: 0, spin: 0, size, margin, calm, acc: 0, hops: 0, seed,
      px: rng() * Math.PI * 2,
      py: rng() * Math.PI * 2,
      mod: rng() * Math.PI * 2,
      fx: 0.1 + rng() * 0.08,
      fy: 0.13 + rng() * 0.1,
      ax: 0.6 + rng() * 0.35,
      ay: 0.6 + rng() * 0.35,
      q: rng() * Math.PI * 2,
    };
    if (calm) {
      const h = hopSpot(seed, 0, view, margin);
      return { ...base, x: h.x, y: h.y, heading: h.heading };
    }
    const p = onPath(base, view, margin);
    const ahead = onPath({ ...base, px: base.px + 0.01 * base.fx, py: base.py + 0.01 * base.fy }, view, margin);
    return { ...base, x: p.x, y: p.y, heading: Math.atan2(ahead.y - p.y, ahead.x - p.x) };
  },
  step(state, dtMs, view) {
    const { size, margin } = metrics(view);
    if (state.calm) {
      const acc = state.acc + dtMs;
      const x = clamp(state.x, margin, view.width - margin);
      const y = clamp(state.y, margin, view.height - margin);
      if (acc < DRONE_CALM_INTERVAL_MS) {
        if (x === state.x && y === state.y && size === state.size) return state.acc === acc ? state : { ...state, acc };
        return { ...state, x, y, size, margin, acc };
      }
      const hops = state.hops + 1;
      const h = hopSpot(state.seed, hops, view, margin);
      return { ...state, x: h.x, y: h.y, heading: h.heading, size, margin, hops, acc: acc % DRONE_CALM_INTERVAL_MS };
    }
    const dt = Math.min(dtMs, MAX_DT_MS) / 1000;
    const mod = state.mod + 0.06 * dt;
    // Frequencies drift slowly around their base values; phases are integrated so the path stays continuous.
    const fx = state.fx * (1 + 0.15 * Math.sin(mod * 1.3 + state.q));
    const fy = state.fy * (1 + 0.15 * Math.sin(mod * 1.7 + state.q * 3));
    const next: DronePatrolState = { ...state, px: state.px + fx * dt, py: state.py + fy * dt, mod, size, margin };
    const p = onPath(next, view, margin);
    const dx = p.x - state.x;
    const dy = p.y - state.y;
    let heading = state.heading;
    let bank = state.bank;
    if (dt > 0 && Math.hypot(dx, dy) > 1e-6) {
      const diff = Math.atan2(Math.sin(Math.atan2(dy, dx) - heading), Math.cos(Math.atan2(dy, dx) - heading));
      const turn = Math.max(-MAX_TURN_RATE * dt, Math.min(MAX_TURN_RATE * dt, diff));
      heading = Math.atan2(Math.sin(heading + turn), Math.cos(heading + turn));
      bank += (clamp(turn / dt / MAX_TURN_RATE, -1, 1) - bank) * Math.min(1, dt * 3);
    }
    return { ...next, x: p.x, y: p.y, heading, bank, spin: (state.spin + SPIN_RATE * dt) % (Math.PI * 2) || 1e-3 };
  },
};

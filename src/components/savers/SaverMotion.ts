/** Pure, seeded, step-based Screensaver motion (prior art: HeroMotion). `calm` is the reduced-motion variant. */
export interface SaverViewport {
  width: number;
  height: number;
}

export interface SaverMotion<S> {
  init(seed: number, view: SaverViewport, calm: boolean): S;
  step(state: S, dtMs: number, view: SaverViewport): S;
}

/** Folds a position back into [lo, hi] like a ball bouncing between walls; returns the new position and velocity. */
export function reflect(p: number, v: number, lo: number, hi: number): { p: number; v: number } {
  const range = hi - lo;
  if (!(range > 0)) return { p: (lo + hi) / 2, v: 0 };
  const k = Math.floor((p - lo) / range);
  const r = (((p - lo) % range) + range) % range;
  const odd = Math.abs(k) % 2 === 1;
  return { p: odd ? hi - r : lo + r, v: odd ? -v : v };
}

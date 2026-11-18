/** Letter drift: the Hero name's letters (JIMMY over RUSS) start in place and slowly drift apart over black. */
import { mulberry32 } from './Prng';
import { reflect, type SaverMotion, type SaverViewport } from './SaverMotion';

export const LETTERS = ['J', 'I', 'M', 'M', 'Y', 'R', 'U', 'S', 'S'] as const;
const LINE_LENGTHS = [5, 4];
/** Calm (reduced motion): state changes only this often, by a small nudge. */
export const CALM_INTERVAL_MS = 4000;
const CALM_NUDGE_S = 0.5;
const ADVANCE = 0.72; // letter advance, in em
const LINE_GAP = 0.95; // line spacing, in em
const HALF_W = 0.36;
const HALF_H = 0.45;
const MAX_DT_MS = 100;

export interface DriftLetter {
  ch: string;
  x: number; // center, px
  y: number;
  vx: number; // px per second
  vy: number;
  hx: number; // Hero-name layout position
  hy: number;
}

export interface LetterDriftState {
  letters: DriftLetter[];
  calm: boolean;
  size: number; // font size, px
  halfW: number;
  halfH: number;
  acc: number; // calm: ms since the last nudge
}

function metrics(view: SaverViewport): { size: number; halfW: number; halfH: number } {
  const size = Math.max(16, Math.min(180, (view.width * 0.9) / (5 * ADVANCE), view.height * 0.3));
  return { size, halfW: size * HALF_W, halfH: size * HALF_H };
}

function homes(view: SaverViewport, size: number): { hx: number; hy: number }[] {
  const out: { hx: number; hy: number }[] = [];
  LINE_LENGTHS.forEach((n, line) => {
    const hy = view.height / 2 + (line - 0.5) * LINE_GAP * size;
    for (let i = 0; i < n; i++) out.push({ hx: view.width / 2 + (i - (n - 1) / 2) * ADVANCE * size, hy });
  });
  return out;
}

function move(l: DriftLetter, seconds: number, view: SaverViewport, halfW: number, halfH: number): DriftLetter {
  const rx = reflect(l.x + l.vx * seconds, l.vx, halfW, view.width - halfW);
  const ry = reflect(l.y + l.vy * seconds, l.vy, halfH, view.height - halfH);
  return { ...l, x: rx.p, y: ry.p, vx: rx.v, vy: ry.v };
}

export const letterDrift: SaverMotion<LetterDriftState> = {
  init(seed, view, calm) {
    const rng = mulberry32(seed);
    const { size, halfW, halfH } = metrics(view);
    const h = homes(view, size);
    const letters = LETTERS.map((ch, i): DriftLetter => {
      const angle = rng() * Math.PI * 2;
      const speed = size * (0.08 + rng() * 0.1);
      return { ch, x: h[i].hx, y: h[i].hy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ...h[i] };
    });
    return { letters, calm, size, halfW, halfH, acc: 0 };
  },
  step(state, dtMs, view) {
    const { size, halfW, halfH } = metrics(view);
    const h = homes(view, size);
    const rehome = (l: DriftLetter, i: number): DriftLetter => ({ ...l, ...h[i] });
    if (state.calm) {
      const acc = state.acc + dtMs;
      if (acc < CALM_INTERVAL_MS) return state.acc === acc ? state : { ...state, acc };
      const letters = state.letters.map((l, i) => move(rehome(l, i), CALM_NUDGE_S, view, halfW, halfH));
      return { ...state, letters, size, halfW, halfH, acc: acc % CALM_INTERVAL_MS };
    }
    const seconds = Math.min(dtMs, MAX_DT_MS) / 1000;
    const letters = state.letters.map((l, i) => move(rehome(l, i), seconds, view, halfW, halfH));
    return { ...state, letters, size, halfW, halfH };
  },
};

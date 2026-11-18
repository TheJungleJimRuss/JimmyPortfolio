/** 2D canvas rendering for Drone patrol: wireframe quadcopter in the Phosphor color, with a short fading trail. */
import { dronePatrol, type DronePatrolState } from './DronePatrol';
import type { SaverRenderer } from './SaverRenderer';
import type { SaverViewport } from './SaverMotion';

interface Ctx {
  canvas: HTMLCanvasElement;
  g: CanvasRenderingContext2D | null;
  color: string;
  w: number;
  h: number;
  dpr: number;
  trail: { x: number; y: number }[];
  dx: number; // displayed position (calm eases toward the state's)
  dy: number;
  last: number;
}

const ctxs = new WeakMap<HTMLElement, Ctx>();
const TRAIL_MAX = 28;
const TRAIL_STEP_PX = 5;

function ensureSize(c: Ctx, view: SaverViewport): void {
  const dpr = window.devicePixelRatio || 1;
  if (c.w === view.width && c.h === view.height && c.dpr === dpr) return;
  c.w = view.width;
  c.h = view.height;
  c.dpr = dpr;
  c.canvas.width = Math.max(1, Math.round(view.width * dpr));
  c.canvas.height = Math.max(1, Math.round(view.height * dpr));
  c.canvas.style.width = `${view.width}px`;
  c.canvas.style.height = `${view.height}px`;
}

function drawDrone(g: CanvasRenderingContext2D, s: DronePatrolState, x: number, y: number, now: number): void {
  const d = s.size * 0.3; // rotor center distance from the middle
  const rr = s.size * 0.17; // rotor radius
  g.save();
  g.translate(x, y);
  g.rotate(s.heading);
  g.scale(1, 1 - 0.14 * Math.abs(s.bank)); // lean into the turn
  g.lineWidth = Math.max(1, s.size * 0.016);
  const k = Math.SQRT1_2;
  const rotors: [number, number][] = [[d * k, d * k], [d * k, -d * k], [-d * k, d * k], [-d * k, -d * k]];
  // X frame
  g.beginPath();
  for (const [rx, ry] of rotors) {
    g.moveTo(-rx, -ry);
    g.lineTo(rx, ry);
  }
  g.stroke();
  // Rotors: thin ring plus two spinning blur arcs
  rotors.forEach(([rx, ry], i) => {
    g.beginPath();
    g.arc(rx, ry, rr, 0, Math.PI * 2);
    g.globalAlpha = 0.45;
    g.stroke();
    g.globalAlpha = 1;
    const a = s.spin * (i % 2 ? -1 : 1);
    g.beginPath();
    g.arc(rx, ry, rr * 0.85, a, a + 1.1);
    g.moveTo(rx + rr * 0.85 * Math.cos(a + Math.PI), ry + rr * 0.85 * Math.sin(a + Math.PI));
    g.arc(rx, ry, rr * 0.85, a + Math.PI, a + Math.PI + 1.1);
    g.stroke();
  });
  // Body and a nose tick
  const b = s.size * 0.07;
  g.strokeRect(-b, -b * 0.8, b * 2, b * 1.6);
  g.beginPath();
  g.moveTo(b, 0);
  g.lineTo(b + s.size * 0.08, 0);
  g.stroke();
  // Blinking nav light at the tail
  if (Math.floor(now / 500) % 2 === 0 || s.calm) {
    g.beginPath();
    g.arc(-b - s.size * 0.03, 0, Math.max(1.2, s.size * 0.022), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

export const dronePatrolView: SaverRenderer<DronePatrolState> = {
  motion: dronePatrol,
  mount(host, state, view) {
    const canvas = document.createElement('canvas');
    canvas.className = 'saver-drone';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;display:block;pointer-events:none';
    host.append(canvas);
    const color = getComputedStyle(document.documentElement).getPropertyValue('--phosphor').trim() || '#00ff41';
    ctxs.set(host, { canvas, g: canvas.getContext('2d'), color, w: 0, h: 0, dpr: 0, trail: [], dx: state.x, dy: state.y, last: performance.now() });
    ensureSize(ctxs.get(host)!, view);
  },
  draw(state, view, host) {
    const c = ctxs.get(host);
    if (!c || !c.g) return;
    const now = performance.now();
    const dt = Math.min(100, now - c.last);
    c.last = now;
    ensureSize(c, view);
    // Calm hops are rare: glide to the new spot instead of teleporting.
    if (state.calm) {
      const k = 1 - Math.exp(-dt / 700);
      c.dx += (state.x - c.dx) * k;
      c.dy += (state.y - c.dy) * k;
    } else {
      c.dx = state.x;
      c.dy = state.y;
      const t = c.trail[c.trail.length - 1];
      if (!t || Math.hypot(t.x - c.dx, t.y - c.dy) >= TRAIL_STEP_PX) {
        c.trail.push({ x: c.dx, y: c.dy });
        if (c.trail.length > TRAIL_MAX) c.trail.shift();
      }
    }
    const g = c.g;
    g.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
    g.clearRect(0, 0, view.width, view.height);
    g.strokeStyle = c.color;
    g.fillStyle = c.color;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const n = c.trail.length;
    for (let i = 1; i < n; i++) {
      g.globalAlpha = (i / n) * 0.35;
      g.beginPath();
      g.moveTo(c.trail[i - 1].x, c.trail[i - 1].y);
      g.lineTo(c.trail[i].x, c.trail[i].y);
      g.stroke();
    }
    g.globalAlpha = 1;
    drawDrone(g, state, c.dx, c.dy, now);
  },
};

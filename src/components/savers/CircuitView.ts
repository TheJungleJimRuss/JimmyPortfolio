/** 2D canvas rendering for Circuit: the board changes by growing and fading, so each changed state is redrawn in full. */
import { circuit, type CircuitState } from './Circuit';
import type { SaverRenderer } from './SaverRenderer';
import type { SaverViewport } from './SaverMotion';

interface Painted {
  canvas: HTMLCanvasElement;
  last: CircuitState | null;
  w: number;
  h: number;
}

const painted = new WeakMap<HTMLElement, Painted>();

function phosphor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--phosphor').trim() || '#00ff41';
}

function size(p: Painted, view: SaverViewport): CanvasRenderingContext2D | null {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  p.canvas.width = Math.max(1, Math.round(view.width * dpr)); // assigning width wipes the bitmap
  p.canvas.height = Math.max(1, Math.round(view.height * dpr));
  const ctx = p.canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  p.w = view.width;
  p.h = view.height;
  p.last = null;
  return ctx;
}

export const circuitView: SaverRenderer<CircuitState> = {
  motion: circuit,
  mount(host, _state, view) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    host.append(canvas);
    const p: Painted = { canvas, last: null, w: 0, h: 0 };
    painted.set(host, p);
    size(p, view);
  },
  draw(state, view, host) {
    const p = painted.get(host);
    if (!p) return;
    let ctx = p.canvas.getContext('2d');
    if (view.width !== p.w || view.height !== p.h) ctx = size(p, view);
    if (!ctx) return;
    if (state === p.last) return;
    p.last = state;
    ctx.clearRect(0, 0, view.width, view.height);
    if (state.alpha <= 0) return;
    const color = phosphor();
    const { cols, cellX, cellY } = state;
    const cx = (i: number): number => ((i % cols) + 0.5) * cellX;
    const cy = (i: number): number => (Math.floor(i / cols) + 0.5) * cellY;
    const r = Math.min(cellX, cellY);
    ctx.globalAlpha = state.alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    for (const t of state.traces) {
      if (t.cells.length < 2) continue;
      ctx.moveTo(cx(t.cells[0]), cy(t.cells[0]));
      for (let i = 1; i < t.cells.length; i++) ctx.lineTo(cx(t.cells[i]), cy(t.cells[i]));
    }
    ctx.stroke();
    // Pads: a ring where a trace starts, a ring with a dot where it ends.
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const t of state.traces) {
      const a = t.cells[0];
      ctx.moveTo(cx(a) + r * 0.4, cy(a));
      ctx.arc(cx(a), cy(a), r * 0.4, 0, Math.PI * 2);
      if (!t.active && t.cells.length > 1) {
        const b = t.cells[t.cells.length - 1];
        ctx.moveTo(cx(b) + r * 0.4, cy(b));
        ctx.arc(cx(b), cy(b), r * 0.4, 0, Math.PI * 2);
      }
    }
    ctx.stroke();
    ctx.beginPath();
    for (const t of state.traces) {
      if (t.active || t.cells.length < 2) continue;
      const b = t.cells[t.cells.length - 1];
      ctx.moveTo(cx(b) + r * 0.16, cy(b));
      ctx.arc(cx(b), cy(b), r * 0.16, 0, Math.PI * 2);
    }
    for (const v of state.vias) {
      ctx.moveTo(cx(v) + r * 0.25, cy(v));
      ctx.arc(cx(v), cy(v), r * 0.25, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  },
};

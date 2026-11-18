/** 2D canvas rendering for Line trace: tails shrink as well as grow, so each changed state is redrawn in full. */
import { lineTrace, type LineTraceState } from './LineTrace';
import type { SaverRenderer } from './SaverRenderer';
import type { SaverViewport } from './SaverMotion';

interface Painted {
  canvas: HTMLCanvasElement;
  last: unknown;
  w: number;
  h: number;
  color: string;
}

const painted = new WeakMap<HTMLElement, Painted>();

function phosphor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--phosphor').trim() || '#00ff41';
}

function size(p: Painted, view: SaverViewport): CanvasRenderingContext2D | null {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  p.canvas.width = Math.max(1, Math.round(view.width * dpr));
  p.canvas.height = Math.max(1, Math.round(view.height * dpr));
  const ctx = p.canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0); // resizing wiped the bitmap
  p.w = view.width;
  p.h = view.height;
  p.last = null;
  return ctx;
}

export const lineTraceView: SaverRenderer<LineTraceState> = {
  motion: lineTrace,
  mount(host, _state, view) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    host.append(canvas);
    const p: Painted = { canvas, last: null, w: 0, h: 0, color: phosphor() };
    painted.set(host, p);
    size(p, view);
  },
  draw(state, view, host) {
    const p = painted.get(host);
    if (!p) return;
    let ctx = p.canvas.getContext('2d');
    if (view.width !== p.w || view.height !== p.h) ctx = size(p, view);
    if (!ctx) return;
    if (state.segments === p.last) return;
    p.last = state.segments;
    ctx.clearRect(0, 0, view.width, view.height);
    p.color = phosphor();
    ctx.strokeStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    for (const g of state.segments) {
      ctx.moveTo(g.x1, g.y1);
      ctx.lineTo(g.x2, g.y2);
    }
    ctx.stroke();
  },
};

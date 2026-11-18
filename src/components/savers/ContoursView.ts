/** 2D canvas rendering for Contours: the field is sampled once per drawn frame (capped near 30fps), then every level is traced and stroked. */
import { contours, contourLevel, isIndexLevel, marchingSquares, sampleField, CONTOUR_LEVELS, type ContoursState } from './Contours';
import type { SaverRenderer } from './SaverRenderer';
import type { SaverViewport } from './SaverMotion';

const MIN_FRAME_MS = 33;

interface Painted {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  at: number; // performance.now() of the last paint
  lastT: number;
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
  p.at = -Infinity;
  p.lastT = NaN;
  return ctx;
}

export const contoursView: SaverRenderer<ContoursState> = {
  motion: contours,
  mount(host, _state, view) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    host.append(canvas);
    const p: Painted = { canvas, w: 0, h: 0, at: -Infinity, lastT: NaN };
    painted.set(host, p);
    size(p, view);
  },
  draw(state, view, host) {
    const p = painted.get(host);
    if (!p) return;
    let ctx = p.canvas.getContext('2d');
    if (view.width !== p.w || view.height !== p.h) ctx = size(p, view);
    if (!ctx) return;
    if (state.t === p.lastT) return;
    const now = performance.now();
    if (now - p.at < MIN_FRAME_MS) return;
    p.at = now;
    p.lastT = state.t;
    ctx.clearRect(0, 0, view.width, view.height);
    const color = phosphor();
    const field = sampleField(state);
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const index of [false, true]) {
      ctx.globalAlpha = index ? 0.95 : 0.45;
      ctx.lineWidth = index ? 1.8 : 1;
      ctx.shadowColor = color;
      ctx.shadowBlur = index ? 5 : 0;
      ctx.beginPath();
      for (let k = 0; k < CONTOUR_LEVELS; k++) {
        if (isIndexLevel(k) !== index) continue;
        for (const g of marchingSquares(field, state.cols, state.rows, contourLevel(k), state.cellX, state.cellY)) {
          ctx.moveTo(g.x1, g.y1);
          ctx.lineTo(g.x2, g.y2);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
};

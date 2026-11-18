/** 2D canvas rendering for Terrain: far to near, each row fills its under-area black so nearer ridges hide what is behind them. */
import { terrain, projectRow, rowDepth, TERRAIN_COLS, TERRAIN_ROWS, CULL_DEPTH, FAR_DEPTH, type TerrainState } from './Terrain';
import type { SaverRenderer } from './SaverRenderer';
import type { SaverViewport } from './SaverMotion';

interface Painted {
  canvas: HTMLCanvasElement;
  last: unknown;
  w: number;
  h: number;
}

const painted = new WeakMap<HTMLElement, Painted>();
const COLUMN_EVERY = 3;

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

export const terrainView: SaverRenderer<TerrainState> = {
  motion: terrain,
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
    ctx.strokeStyle = phosphor();
    ctx.fillStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    const bottom = view.height * 2; // fill well below the frame so nothing shows underneath
    const span = FAR_DEPTH - CULL_DEPTH;
    for (let r = TERRAIN_ROWS - 1; r >= 0; r--) {
      const pts = projectRow(state, r, view);
      if (!pts) continue;
      const alpha = Math.pow(Math.max(0, 1 - (rowDepth(state, r) - CULL_DEPTH) / span), 1.5);
      if (alpha <= 0.01) continue;
      ctx.globalAlpha = alpha;
      if (r < TERRAIN_ROWS - 1) {
        const far = projectRow(state, r + 1, view);
        if (far) {
          ctx.beginPath();
          for (let c = 0; c < TERRAIN_COLS; c += COLUMN_EVERY) {
            ctx.moveTo(pts[c].x, pts[c].y);
            ctx.lineTo(far[c].x, far[c].y);
          }
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let c = 1; c < TERRAIN_COLS; c++) ctx.lineTo(pts[c].x, pts[c].y);
      ctx.lineTo(pts[TERRAIN_COLS - 1].x, bottom);
      ctx.lineTo(pts[0].x, bottom);
      ctx.closePath();
      ctx.globalAlpha = 1;
      ctx.fill(); // hidden-line removal: the nearer ridge hides what is behind it
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let c = 1; c < TERRAIN_COLS; c++) ctx.lineTo(pts[c].x, pts[c].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
};

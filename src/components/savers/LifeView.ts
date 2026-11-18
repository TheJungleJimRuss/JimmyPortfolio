/** 2D canvas rendering for Life: live cells as phosphor squares; in calm mode each generation cross-fades. */
import { life, LIFE_CALM_BLEND_MS, type LifeState } from './Life';
import type { SaverRenderer } from './SaverRenderer';
import type { SaverViewport } from './SaverMotion';

interface Painted {
  canvas: HTMLCanvasElement;
  last: unknown;
  w: number;
  h: number;
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

export const lifeView: SaverRenderer<LifeState> = {
  motion: life,
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
    const color = phosphor();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.min(8, state.cell * 0.4);
    const { cols, rows, cell, cells, prev } = state;
    const ox = (view.width - cols * cell) / 2;
    const oy = (view.height - rows * cell) / 2;
    const gap = Math.max(1, cell * 0.12);
    const blend = state.calm && state.phase === 'live' ? Math.min(1, state.acc / LIFE_CALM_BLEND_MS) : 1;
    // Cells that stay or are born, then (calm only) cells fading out.
    for (let pass = 0; pass < 2; pass++) {
      if (pass === 1 && blend >= 1) break;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const now = cells[i];
          const was = blend >= 1 ? now : prev[i];
          let a = 0;
          if (pass === 0) a = now ? (was ? 1 : blend) : 0;
          else a = was && !now ? 1 - blend : 0;
          if (a <= 0) continue;
          ctx.globalAlpha = a * state.alpha;
          ctx.fillRect(ox + x * cell + gap / 2, oy + y * cell + gap / 2, cell - gap, cell - gap);
        }
      }
    }
    ctx.globalAlpha = 1;
  },
};

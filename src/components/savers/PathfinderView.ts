/** 2D canvas rendering for Pathfinder: layers only ever grow within a maze, so each frame paints just the newly revealed cells; fades are the canvas opacity. */
import { pathfinder, type PathfinderState } from './Pathfinder';
import type { SaverRenderer } from './SaverRenderer';
import type { SaverViewport } from './SaverMotion';

interface Painted {
  canvas: HTMLCanvasElement;
  maze: unknown; // the passages array of the maze on the canvas
  carve: number;
  search: number;
  path: number;
  opacity: number;
  w: number;
  h: number;
  color: string;
}

const painted = new WeakMap<HTMLElement, Painted>();

function phosphor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--phosphor').trim() || '#00ff41';
}

function size(p: Painted, view: SaverViewport): void {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  p.canvas.width = Math.max(1, Math.round(view.width * dpr));
  p.canvas.height = Math.max(1, Math.round(view.height * dpr));
  p.canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0); // resizing wiped the bitmap
  p.w = view.width;
  p.h = view.height;
  p.carve = p.search = p.path = 0; // repaint what is already revealed
  p.color = phosphor();
}

export const pathfinderView: SaverRenderer<PathfinderState> = {
  motion: pathfinder,
  mount(host, _state, view) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    host.append(canvas);
    const p: Painted = { canvas, maze: null, carve: 0, search: 0, path: 0, opacity: -1, w: 0, h: 0, color: '' };
    painted.set(host, p);
    size(p, view);
  },
  draw(state, view, host) {
    const p = painted.get(host);
    if (!p) return;
    const ctx = p.canvas.getContext('2d');
    if (view.width !== p.w || view.height !== p.h) size(p, view);
    if (!ctx) return;
    if (state.passages !== p.maze) {
      // A new maze: wipe the old drawing and pick up the current Phosphor color.
      p.maze = state.passages;
      p.carve = p.search = p.path = 0;
      p.color = phosphor();
      ctx.clearRect(0, 0, view.width, view.height);
    }
    if (state.alpha !== p.opacity) {
      p.opacity = state.alpha;
      p.canvas.style.opacity = String(state.alpha);
    }
    const { cell, cols, ox, oy } = state;
    const w = Math.max(2, Math.round(cell * 0.45)); // corridor width
    const pad = (cell - w) / 2;
    const left = (i: number): number => ox + (i % cols) * cell + pad;
    const top = (i: number): number => oy + Math.floor(i / cols) * cell + pad;
    /** One cell square plus the gap rectangle joining it to `from`, with no overlaps so alpha stays even. */
    const block = (i: number, from: number): void => {
      ctx.fillRect(left(i), top(i), w, w);
      if (from < 0) return;
      const dx = (i % cols) - (from % cols);
      if (dx) ctx.fillRect(Math.min(left(i), left(from)) + w, top(i), cell - w, w);
      else ctx.fillRect(left(i), Math.min(top(i), top(from)) + w, w, cell - w);
    };
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 0;
    if (p.carve === 0 && state.nCarve > 0) {
      ctx.globalAlpha = 0.4;
      ctx.fillRect(left(0), top(0), w, w);
    }
    ctx.globalAlpha = 0.4; // the maze: dim corridors
    for (; p.carve < state.nCarve; p.carve++) block(state.carve[p.carve * 2 + 1], state.carve[p.carve * 2]);
    ctx.globalAlpha = 0.3; // the search frontier: a dim wash over the corridors
    for (; p.search < state.nSearch; p.search++) ctx.fillRect(left(state.visited[p.search]), top(state.visited[p.search]), w, w);
    if (p.path < state.nPath) {
      ctx.globalAlpha = 1; // the found path: full brightness
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      for (; p.path < state.nPath; p.path++) block(state.path[p.path], p.path > 0 ? state.path[p.path - 1] : -1);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  },
};

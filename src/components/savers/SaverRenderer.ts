import type { SaverMotion, SaverViewport } from './SaverMotion';

/** Draws one saver. `host` is the full-screen layer element; the layer runs the rAF loop and calls the pure step. */
export interface SaverRenderer<S> {
  motion: SaverMotion<S>;
  mount(host: HTMLElement, state: S, view: SaverViewport): void;
  draw(state: S, view: SaverViewport, host: HTMLElement): void;
  /** Optional return animation on exit; returns its duration in ms. Without it the layer just fades. */
  exit?(state: S, host: HTMLElement): number;
}

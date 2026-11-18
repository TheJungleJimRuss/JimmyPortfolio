/**
 * Saver layer: the full-viewport element above the Desktop and the CRT overlay, plus the registry of savers.
 * Lazy-loaded (dynamic import) by ScreensaverController, so it stays out of the Desktop's first-load chunk.
 *
 * To add a saver: write a `SaverMotion` (pure) and a `SaverRenderer` in `savers/`, then add one line to RENDERERS.
 */
import '../styles/saver.css';
import type { ScreensaverKind } from './Settings';
import type { PlayableSaver } from './Screensaver';
import type { SaverRenderer } from './savers/SaverRenderer';
import type { SaverViewport } from './savers/SaverMotion';
import { lineTraceView } from './savers/LineTraceView';
import { bouncingNameView } from './savers/BouncingNameView';
import { pathfinderView } from './savers/PathfinderView';
import { lifeView } from './savers/LifeView';
import { circuitView } from './savers/CircuitView';
import { contoursView } from './savers/ContoursView';
import { terrainView } from './savers/TerrainView';

const RENDERERS: Partial<Record<PlayableSaver, SaverRenderer<any>>> = {
  lineTrace: lineTraceView,
  bouncingName: bouncingNameView,
  pathfinder: pathfinderView,
  life: lifeView,
  circuit: circuitView,
  contours: contoursView,
  terrain: terrainView,
};

export interface SaverSession {
  /** Ends the saver. `animate` lets it play its return animation and fade; otherwise it goes at once. */
  stop(animate: boolean): void;
}

export interface SaverOptions {
  /** Reduced motion: the calm, near-still variant. */
  calm: boolean;
  seed?: number;
}

export function hasSaver(kind: ScreensaverKind): boolean {
  return kind in RENDERERS;
}

/** The kinds that can be drawn today: what `random` chooses from. */
export function playableSavers(): PlayableSaver[] {
  return Object.keys(RENDERERS) as PlayableSaver[];
}

/** Starts the saver for `kind`, or returns null when there is none (`none`, or a kind not built yet). */
export function startSaver(kind: PlayableSaver, { calm, seed = (Date.now() & 0xffffff) >>> 0 }: SaverOptions): SaverSession | null {
  const renderer = RENDERERS[kind];
  if (!renderer) return null;

  const host = document.createElement('div');
  host.className = 'saver-layer';
  host.setAttribute('aria-hidden', 'true');
  const viewport = (): SaverViewport => ({ width: window.innerWidth, height: window.innerHeight });

  let view = viewport();
  let state = renderer.motion.init(seed, view, calm);
  renderer.mount(host, state, view);
  renderer.draw(state, view, host);
  document.body.append(host); // focus stays where it was: nothing here is focusable
  requestAnimationFrame(() => host.classList.add('is-on'));

  let last = performance.now();
  let raf = requestAnimationFrame(function frame(now) {
    view = viewport();
    state = renderer.motion.step(state, now - last, view);
    last = now;
    renderer.draw(state, view, host);
    raf = requestAnimationFrame(frame);
  });

  let stopped = false;
  return {
    stop(animate) {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      host.style.pointerEvents = 'none';
      if (!animate || calm) return host.remove();
      const returnMs = renderer.exit?.(state, host) ?? 0;
      window.setTimeout(() => {
        host.classList.remove('is-on'); // fades out via CSS
        window.setTimeout(() => host.remove(), 250);
      }, returnMs);
    },
  };
}

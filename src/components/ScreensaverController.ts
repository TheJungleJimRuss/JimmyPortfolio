/**
 * Screensaver controller (main bundle, kept small). Tracks the last input, ticks cheaply, and when
 * `screensaverShouldShow` says so, lazy-loads the saver layer and starts the chosen saver. Any input ends it,
 * and the press that ends it is swallowed so it never reaches the Desktop underneath.
 */
import { screensaverShouldShow } from './Screensaver';
import type { Settings } from './Settings';
import type { SaverSession } from './SaverLayer';

export interface ScreensaverDeps {
  getSettings(): Settings;
  /** True while a Project stage is playing. */
  isStagePlaying(): boolean;
  /** True once the Boot shell and intro are done and the Desktop has arrived. */
  isReady(): boolean;
  /** Dynamic import of the saver layer; injectable for tests. */
  loadLayer?(): Promise<typeof import('./SaverLayer')>;
  now?(): number;
}

export interface ScreensaverController {
  preview(): void;
  dispose(): void;
}

const TICK_MS = 1000;
/** Input this soon after the saver starts is ignored (the Preview press and its release or jitter). */
const START_GRACE_MS = 600;
const MOVE_THRESHOLD_PX = 4;
/** After a press ends the saver, its release and click are swallowed for this long. */
const SWALLOW_MS = 500;

export function createScreensaverController(deps: ScreensaverDeps): ScreensaverController {
  const now = deps.now ?? (() => performance.now());
  const loadLayer = deps.loadLayer ?? (() => import('./SaverLayer'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let lastInputAt = now();
  let previewing = false;
  let session: SaverSession | null = null;
  let starting = false; // layer import in flight
  let startedAt = 0;
  let swallowUntil = 0;
  let anchor: { x: number; y: number } | null = null; // pointer position when the saver started

  function end(): void {
    previewing = false;
    session?.stop(true);
    session = null;
  }

  async function start(): Promise<void> {
    if (session || starting) return;
    starting = true;
    try {
      const layer = await loadLayer();
      // Input or settings may have changed while the chunk loaded.
      if (!shouldShow()) {
        previewing = false;
        return;
      }
      session = layer.startSaver(deps.getSettings().screensaver, { calm: reduced.matches });
      if (session) {
        startedAt = now();
        anchor = null;
      } else previewing = false;
    } catch {
      previewing = false; // chunk failed to load: stay quiet, the Desktop is unaffected
    } finally {
      starting = false;
    }
  }

  function shouldShow(): boolean {
    const s = deps.getSettings();
    return (
      deps.isReady() &&
      screensaverShouldShow({
        now: now(),
        lastInputAt,
        wait: s.wait,
        kind: s.screensaver,
        stagePlaying: deps.isStagePlaying(),
        hidden: document.hidden,
        previewing,
      })
    );
  }

  function tick(): void {
    if (shouldShow()) void start();
    else if (session) end();
    else if (!starting) previewing = false;
  }

  function onInput(e: Event): void {
    const t = now();
    if (!session) {
      lastInputAt = t;
      return;
    }
    if (t - startedAt < START_GRACE_MS) return;
    if (e.type === 'pointermove') {
      const p = e as PointerEvent;
      anchor ??= { x: p.clientX, y: p.clientY };
      if (Math.hypot(p.clientX - anchor.x, p.clientY - anchor.y) < MOVE_THRESHOLD_PX) return;
    }
    lastInputAt = t;
    if (e.type === 'pointerdown' || e.type === 'touchstart') swallowUntil = t + SWALLOW_MS;
    if (e.type === 'pointerdown' || e.type === 'touchstart' || e.type === 'keydown') {
      e.stopPropagation();
      if (e.type !== 'touchstart') e.preventDefault(); // touchstart is passive: only stop it
    }
    end();
  }

  /** Release, click and compatibility mouse events that follow the press that ended the saver. */
  function swallow(e: Event): void {
    if (now() < swallowUntil) {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
    }
  }

  function onVisibility(): void {
    if (!document.hidden) lastInputAt = now();
    tick();
  }

  const opts = { capture: true, passive: true } as const;
  const activeOpts = { capture: true } as const;
  const passiveEvents = ['pointermove', 'wheel', 'touchstart'] as const;
  const activeEvents = ['pointerdown', 'keydown'] as const; // non-passive: the press that ends the saver is cancelled
  for (const ev of passiveEvents) document.addEventListener(ev, onInput, opts);
  for (const ev of activeEvents) document.addEventListener(ev, onInput, activeOpts);
  const swallowEvents = ['pointerup', 'mousedown', 'mouseup', 'touchend', 'click'] as const;
  for (const ev of swallowEvents) document.addEventListener(ev, swallow, activeOpts);
  document.addEventListener('visibilitychange', onVisibility);
  const timer = window.setInterval(tick, TICK_MS);

  return {
    preview() {
      if (session || starting || deps.getSettings().screensaver === 'none') return;
      previewing = true;
      void start();
    },
    dispose() {
      window.clearInterval(timer);
      for (const ev of passiveEvents) document.removeEventListener(ev, onInput, opts);
      for (const ev of activeEvents) document.removeEventListener(ev, onInput, activeOpts);
      for (const ev of swallowEvents) document.removeEventListener(ev, swallow, activeOpts);
      document.removeEventListener('visibilitychange', onVisibility);
      session?.stop(false);
      session = null;
    },
  };
}

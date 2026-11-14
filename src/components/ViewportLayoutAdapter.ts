import {
  createLayoutLock,
  viewportLayoutPolicy,
  type LayoutDecision,
  type NameLayout,
} from './ViewportLayoutPolicy';

export type LayoutListener = (decision: LayoutDecision) => void;

export interface ViewportLayoutAdapter {
  /** Last published decision (name layout is the effective one, i.e. held while locked). */
  readonly decision: LayoutDecision;
  subscribe(listener: LayoutListener): () => void;
  lock(): void;
  release(): NameLayout;
}

/**
 * Reads viewport facts, runs the pure policy and publishes the result as
 * data-name-layout / data-input-mode / data-motion on the root element.
 */
export function createViewportLayoutAdapter(
  win: Window = window,
  root: HTMLElement = document.documentElement,
): ViewportLayoutAdapter {
  const lock = createLayoutLock();
  const listeners = new Set<LayoutListener>();
  const queries = {
    coarse: win.matchMedia('(pointer: coarse)'),
    hover: win.matchMedia('(hover: hover)'),
    reduced: win.matchMedia('(prefers-reduced-motion: reduce)'),
  };

  const compute = (): LayoutDecision => {
    const raw = viewportLayoutPolicy.decide({
      width: win.innerWidth,
      height: win.innerHeight,
      coarsePointer: queries.coarse.matches,
      canHover: queries.hover.matches,
      reducedMotion: queries.reduced.matches,
    });
    return { ...raw, nameLayout: lock.request(raw.nameLayout) };
  };

  let current = compute();

  const publish = () => {
    root.dataset.nameLayout = current.nameLayout;
    root.dataset.inputMode = current.inputMode;
    root.dataset.motion = current.tiltEnabled ? 'full' : 'reduced';
  };

  const refresh = () => {
    const next = compute();
    const changed =
      next.nameLayout !== current.nameLayout ||
      next.inputMode !== current.inputMode ||
      next.idleDrift !== current.idleDrift ||
      next.tiltEnabled !== current.tiltEnabled;
    current = next;
    publish();
    if (changed) listeners.forEach((l) => l(current));
  };

  win.addEventListener('resize', refresh);
  win.addEventListener('orientationchange', refresh);
  Object.values(queries).forEach((q) => q.addEventListener('change', refresh));
  publish();

  return {
    get decision() {
      return current;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    lock() {
      lock.lock();
    },
    release() {
      const layout = lock.release();
      refresh();
      return layout;
    },
  };
}

export type NameLayout = 'stacked' | 'single-line';
export type InputMode = 'touch' | 'mouse';

export interface ViewportFacts {
  width: number;
  height: number;
  coarsePointer: boolean;
  canHover: boolean;
  reducedMotion: boolean;
}

export interface LayoutDecision {
  nameLayout: NameLayout;
  inputMode: InputMode;
  idleDrift: boolean;
  tiltEnabled: boolean;
}

export interface ViewportLayoutPolicy {
  decide(facts: ViewportFacts): LayoutDecision;
}

export interface LayoutLock {
  lock(): void;
  release(): NameLayout;
  request(layout: NameLayout): NameLayout;
}

/** Viewports narrower than this use the Stacked name even in landscape. */
export const NARROW_VIEWPORT_PX = 600;

export const viewportLayoutPolicy: ViewportLayoutPolicy = {
  decide({ width, height, coarsePointer, canHover, reducedMotion }) {
    const touch = coarsePointer && !canHover;
    return {
      nameLayout: height > width || width < NARROW_VIEWPORT_PX ? 'stacked' : 'single-line',
      inputMode: touch ? 'touch' : 'mouse',
      idleDrift: touch && !reducedMotion,
      tiltEnabled: !reducedMotion,
    };
  },
};

export function createLayoutLock(initial: NameLayout = 'single-line'): LayoutLock {
  let held: NameLayout = initial;
  let latest: NameLayout = initial;
  let locked = false;
  return {
    lock() {
      locked = true;
      held = latest;
    },
    release() {
      locked = false;
      return latest;
    },
    request(layout) {
      latest = layout;
      return locked ? held : layout;
    },
  };
}

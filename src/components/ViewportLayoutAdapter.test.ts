import { describe, it, expect, vi } from 'vitest';
import { createViewportLayoutAdapter } from './ViewportLayoutAdapter';

function setup(opts: { width: number; height: number; coarse?: boolean; hover?: boolean; reduced?: boolean }) {
  const state = { coarse: !!opts.coarse, hover: opts.hover ?? true, reduced: !!opts.reduced };
  const mqListeners: Array<() => void> = [];
  const winListeners: Record<string, Array<() => void>> = {};
  const attrs: Record<string, string> = {};
  const win = {
    innerWidth: opts.width,
    innerHeight: opts.height,
    matchMedia: (q: string) => ({
      get matches() {
        if (q.includes('pointer: coarse')) return state.coarse;
        if (q.includes('hover: hover')) return state.hover;
        if (q.includes('prefers-reduced-motion')) return state.reduced;
        return false;
      },
      addEventListener: (_t: string, l: () => void) => mqListeners.push(l),
      removeEventListener: vi.fn(),
    }),
    addEventListener: (t: string, l: () => void) => (winListeners[t] ??= []).push(l),
    removeEventListener: vi.fn(),
  };
  const root = { dataset: attrs as Record<string, string> };
  return {
    win, root, state, attrs,
    resize(w: number, h: number) { win.innerWidth = w; win.innerHeight = h; winListeners['resize']?.forEach((l) => l()); },
    mediaChange() { mqListeners.forEach((l) => l()); },
  };
}

const make = (s: ReturnType<typeof setup>) =>
  createViewportLayoutAdapter(s.win as unknown as Window, s.root as unknown as HTMLElement);

describe('createViewportLayoutAdapter', () => {
  it('publishes the initial decision on the root element', () => {
    const s = setup({ width: 375, height: 812, coarse: true, hover: false });
    make(s);
    expect(s.attrs.nameLayout).toBe('stacked');
    expect(s.attrs.inputMode).toBe('touch');
    expect(s.attrs.motion).toBe('full');
  });

  it('updates live on resize and notifies subscribers until unsubscribed', () => {
    const s = setup({ width: 375, height: 812 });
    const adapter = make(s);
    const listener = vi.fn();
    const off = adapter.subscribe(listener);
    s.resize(812, 375);
    expect(s.attrs.nameLayout).toBe('single-line');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].nameLayout).toBe('single-line');
    off();
    s.resize(375, 812);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.decision.nameLayout).toBe('stacked');
  });

  it('reacts to reduced-motion preference changes', () => {
    const s = setup({ width: 1440, height: 900 });
    const adapter = make(s);
    s.state.reduced = true;
    s.mediaChange();
    expect(s.attrs.motion).toBe('reduced');
    expect(adapter.decision.tiltEnabled).toBe(false);
  });

  it('holds the name layout while locked and applies the latest on release', () => {
    const s = setup({ width: 375, height: 812 });
    const adapter = make(s);
    adapter.lock();
    s.resize(812, 375);
    expect(s.attrs.nameLayout).toBe('stacked');
    expect(adapter.decision.nameLayout).toBe('stacked');
    expect(adapter.release()).toBe('single-line');
    expect(s.attrs.nameLayout).toBe('single-line');
  });
});

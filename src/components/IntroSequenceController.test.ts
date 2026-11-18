import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntroSequenceController } from './IntroSequenceController';
import { tactileAudio } from './TactileAudio';
import { createViewportLayoutAdapter } from './ViewportLayoutAdapter';

describe('IntroSequenceController', () => {
  let mockOverlay: any;
  let mockHero: any;
  let mockSvg: any;
  let view: { render: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };
  let onFinish: any;
  let reduced: boolean;

  const make = (extra: Record<string, unknown> = {}) =>
    new IntroSequenceController({ view, reducedMotion: () => reduced, ...extra } as any);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(tactileAudio, 'unlock').mockImplementation(() => {});
    vi.spyOn(tactileAudio, 'playTick').mockImplementation(() => {});
    onFinish = vi.fn();
    reduced = false;
    view = { render: vi.fn(), dispose: vi.fn() };

    mockHero = {
      classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn() },
      style: {},
      getBoundingClientRect: vi.fn().mockReturnValue({ top: 100, left: 185, width: 386, height: 227 }),
      parentElement: {
        getBoundingClientRect: vi.fn().mockReturnValue({ top: 0, left: 0, width: 1000, height: 1000 }),
      },
    };
    mockSvg = {
      style: {} as any,
      classList: { add: vi.fn(), remove: vi.fn() },
      querySelectorAll: vi.fn().mockReturnValue([]),
    };
    mockOverlay = {
      style: {} as any,
      classList: { add: vi.fn(), remove: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows only the waiting state and runs nothing until an input arrives', async () => {
    const controller = make();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
    expect(view.render).toHaveBeenCalledTimes(1);
    expect(view.render).toHaveBeenCalledWith(null);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(view.render).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('mounts event listeners for pointerdown', () => {
    const controller = make();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
    expect(mockOverlay.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });

  it('resumes the audio context synchronously inside the overlay pointerdown', () => {
    const controller = make();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
    const handler = mockOverlay.addEventListener.mock.calls.find((c: any[]) => c[0] === 'pointerdown')[1];
    handler({ stopPropagation: vi.fn() });
    expect(tactileAudio.unlock).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('first input types the command, then prints output, then hands over by itself and finishes', async () => {
    const controller = make();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
    controller.input();
    await vi.runAllTimersAsync();

    const frames = view.render.mock.calls.map((c) => c[0]).filter(Boolean);
    expect(frames[0].commandChars).toBe(1);
    expect(Math.max(...frames.map((f: any) => f.rows))).toBe(5);
    expect(mockOverlay.classList.add).toHaveBeenCalledWith('is-fading');
    expect(onFinish).toHaveBeenCalled();
  });

  it('a second input mid-print completes the output and hands over to the trace', async () => {
    const controller = make();
    const startTrace = vi.spyOn(controller['outlineTracer'], 'startTrace').mockResolvedValue(undefined as any);
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
    controller.input();
    await vi.advanceTimersByTimeAsync(100); // mid-typing
    expect(startTrace).not.toHaveBeenCalled();

    controller.input();
    const last = view.render.mock.calls[view.render.mock.calls.length - 1][0];
    expect(last.rows).toBe(5);
    await vi.advanceTimersByTimeAsync(400);
    expect(startTrace).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalled();
  });

  it('ignores input once the trace has begun', async () => {
    const controller = make();
    const startTrace = vi.spyOn(controller['outlineTracer'], 'startTrace').mockImplementation(() => new Promise(() => {}));
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
    controller.input();
    controller.input();
    await vi.advanceTimersByTimeAsync(400);
    controller.input();
    controller.input();
    expect(startTrace).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('ignores key repeats and modifier chords', () => {
    const controller = make();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
    controller['boundKeyHandler']({ repeat: true } as KeyboardEvent);
    controller['boundKeyHandler']({ metaKey: true } as KeyboardEvent);
    expect(controller['phase']).toBe('waiting');
    controller['boundKeyHandler']({} as KeyboardEvent);
    expect(controller['phase']).toBe('printing');
    controller.dispose();
  });

  describe('reduced motion', () => {
    it('waits, then shows all output at once, with no trace', async () => {
      reduced = true;
      const controller = make();
      const startTrace = vi.spyOn(controller['outlineTracer'], 'startTrace');
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      await vi.advanceTimersByTimeAsync(5_000);
      expect(onFinish).not.toHaveBeenCalled();

      controller.input();
      expect(view.render).toHaveBeenCalledTimes(2);
      expect(view.render.mock.calls[1][0]).toMatchObject({ commandChars: 25, rows: 5 });
      await vi.advanceTimersByTimeAsync(5_000);
      expect(onFinish).not.toHaveBeenCalled(); // still showing the output, waiting for a second input

      controller.input();
      await vi.runAllTimersAsync();
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(startTrace).not.toHaveBeenCalled();
    });
  });

  describe('desktop outline trace', () => {
    const makeTrace = (layout: 'desktop' | 'phone' = 'desktop') => ({
      layout: vi.fn(() => layout),
      play: vi.fn((_steps: readonly { part: string }[]) => Promise.resolve()),
      finish: vi.fn(),
    });

    it('draws the Desktop parts first, then the 1.8s name trace, then finishes the trace', async () => {
      const trace = makeTrace();
      const controller = make({ desktopTrace: trace });
      const order: string[] = [];
      trace.play.mockImplementation(() => {
        order.push('desktop');
        return Promise.resolve();
      });
      vi.spyOn(controller['outlineTracer'], 'startTrace').mockImplementation(async (d) => {
        order.push(`name:${d}`);
      });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      controller.input();
      controller.input();
      await vi.runAllTimersAsync();

      expect(order).toEqual(['desktop', 'name:1800']);
      expect(trace.play.mock.calls[0]![0].map((s) => s.part)).toEqual(['taskbar', 'icons', 'explorer', 'hero']);
      expect(trace.finish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('traces the phone parts when the Layout lock holds the phone layout', async () => {
      const trace = makeTrace('phone');
      const controller = make({ desktopTrace: trace });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      controller.input();
      controller.input();
      await vi.runAllTimersAsync();
      expect(trace.play.mock.calls[0]![0].map((s) => s.part)).toEqual(['taskbar', 'hero']);
    });

    it('shows the finished Desktop with no trace for reduced motion', async () => {
      reduced = true;
      const trace = makeTrace();
      const controller = make({ desktopTrace: trace });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      controller.input();
      controller.input();
      await vi.runAllTimersAsync();
      expect(trace.play).not.toHaveBeenCalled();
      expect(trace.finish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('ignores input while the Desktop parts draw', async () => {
      const trace = makeTrace();
      trace.play.mockImplementation(() => new Promise(() => {}));
      const controller = make({ desktopTrace: trace });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      controller.input();
      controller.input();
      await vi.advanceTimersByTimeAsync(400);
      controller.input();
      controller.input();
      expect(trace.play).toHaveBeenCalledTimes(1);
      expect(onFinish).not.toHaveBeenCalled();
    });
  });

  describe('layout lock', () => {
    const makeAdapter = () => ({
      decision: { nameLayout: 'stacked' } as any,
      subscribe: vi.fn(),
      lock: vi.fn(),
      release: vi.fn(() => 'single-line' as const),
    });

    const handOver = (c: IntroSequenceController) => {
      c.input();
      c.input();
    };

    it('does not lock while waiting; locks at the handover and releases once at hero materialization', async () => {
      const adapter = makeAdapter();
      const controller = make({ layoutAdapter: adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      controller.input();
      expect(adapter.lock).not.toHaveBeenCalled();

      controller.input();
      expect(adapter.lock).toHaveBeenCalledTimes(1);
      expect(adapter.release).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();
      expect(adapter.release).toHaveBeenCalledTimes(1);
      expect(adapter.lock.mock.invocationCallOrder[0]).toBeLessThan(adapter.release.mock.invocationCallOrder[0]);
    });

    it('releases when the tracer reports materialization, before the trace promise resolves', async () => {
      const adapter = makeAdapter();
      const controller = make({ layoutAdapter: adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      let releasedAtMaterialize = false;
      vi.spyOn(controller['outlineTracer'], 'startTrace').mockImplementation(async (_d, cb) => {
        expect(adapter.release).not.toHaveBeenCalled();
        cb?.();
        releasedAtMaterialize = adapter.release.mock.calls.length === 1;
      });
      handOver(controller);
      await vi.runAllTimersAsync();
      expect(releasedAtMaterialize).toBe(true);
      expect(adapter.release).toHaveBeenCalledTimes(1);
    });

    it('applies a mid-trace layout change only on release', async () => {
      const s = lockHarness();
      const controller = make({ layoutAdapter: s.adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      handOver(controller);

      s.resize(812, 375); // rotate mid-intro
      expect(s.attrs.nameLayout).toBe('stacked');

      await vi.runAllTimersAsync();
      expect(s.attrs.nameLayout).toBe('single-line');
    });

    it('locks and releases at once when reduced motion hands over to the finished Desktop', async () => {
      reduced = true;
      const adapter = makeAdapter();
      const controller = make({ layoutAdapter: adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      handOver(controller);
      expect(adapter.lock).toHaveBeenCalledTimes(1);
      expect(adapter.release).toHaveBeenCalledTimes(1);
    });

    it('never releases twice when skipped and disposed', () => {
      const adapter = makeAdapter();
      const controller = make({ layoutAdapter: adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      handOver(controller);
      controller.skipToEnd();
      controller.skipToEnd();
      controller.dispose();
      expect(adapter.release).toHaveBeenCalledTimes(1);
    });
  });
});

function lockHarness() {
  const attrs: Record<string, string> = {};
  const winListeners: Record<string, Array<() => void>> = {};
  const win = {
    innerWidth: 375,
    innerHeight: 812,
    matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: (t: string, l: () => void) => (winListeners[t] ??= []).push(l),
    removeEventListener: vi.fn(),
  };
  const adapter = createViewportLayoutAdapter(win as unknown as Window, { dataset: attrs } as unknown as HTMLElement);
  return {
    adapter,
    attrs,
    resize(w: number, h: number) {
      win.innerWidth = w;
      win.innerHeight = h;
      winListeners['resize']?.forEach((l) => l());
    },
  };
}

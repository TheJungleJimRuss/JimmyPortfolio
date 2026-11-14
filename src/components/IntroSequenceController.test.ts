import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntroSequenceController } from './IntroSequenceController';
import { tactileAudio } from './TactileAudio';
import { createViewportLayoutAdapter } from './ViewportLayoutAdapter';

describe('IntroSequenceController', () => {
  let mockOverlay: any;
  let mockPrompt: any;
  let mockLog: any;
  let mockHero: any;
  let mockSvg: any;
  let onFinish: any;

  beforeEach(() => {
    vi.useFakeTimers();
    onFinish = vi.fn();

    mockPrompt = { style: {} as any, classList: { add: vi.fn(), remove: vi.fn() } };
    mockLog = {
      style: {} as any,
      classList: { add: vi.fn(), remove: vi.fn() },
      appendChild: vi.fn(),
    };
    mockHero = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
      },
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
      querySelector: vi.fn((selector: string) => {
        if (selector === '.intro-prompt-wrap') return mockPrompt;
        if (selector === '.intro-terminal-log') return mockLog;
        return null;
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mounts event listeners for click and keydown', () => {
    const controller = new IntroSequenceController();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);

    expect(mockOverlay.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });

  it('resumes the audio context synchronously inside the overlay pointerdown', () => {
    const unlock = vi.spyOn(tactileAudio, 'unlock').mockImplementation(() => {});
    const controller = new IntroSequenceController();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);

    const handler = mockOverlay.addEventListener.mock.calls.find((c: any[]) => c[0] === 'pointerdown')[1];
    handler({ stopPropagation: vi.fn() });

    expect(unlock).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('sets --log-cols to the longest boot line', () => {
    const controller = new IntroSequenceController();
    mockLog.style.setProperty = vi.fn();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
    const max = Math.max(...controller['commandRunner'].getCommandSequence().map((c) => c.text.length));
    expect(mockLog.style.setProperty).toHaveBeenCalledWith('--log-cols', String(max));
  });

  it('runs the sequence and invokes onFinish when complete', async () => {
    const controller = new IntroSequenceController();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);

    const triggerPromise = controller.triggerSequence();
    await vi.runAllTimersAsync();
    await triggerPromise;

    expect(mockLog.classList.add).toHaveBeenCalledWith('is-dissolving');
    expect(mockOverlay.classList.add).toHaveBeenCalledWith('is-fading');
    expect(onFinish).toHaveBeenCalled();
  });

  it('immediately skips to end on skipToEnd()', () => {
    const controller = new IntroSequenceController();
    controller.mount(mockOverlay, onFinish, mockHero, mockSvg);

    controller.skipToEnd();

    expect(mockOverlay.classList.add).toHaveBeenCalledWith('is-fading');
    expect(onFinish).toHaveBeenCalled();
  });

  describe('layout lock', () => {
    const makeAdapter = () => ({
      decision: { nameLayout: 'stacked' } as any,
      subscribe: vi.fn(),
      lock: vi.fn(),
      release: vi.fn(() => 'single-line' as const),
    });

    it('locks at intro start and releases once at hero materialization', async () => {
      const adapter = makeAdapter();
      const controller = new IntroSequenceController({ layoutAdapter: adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      expect(adapter.lock).not.toHaveBeenCalled();

      const run = controller.triggerSequence();
      expect(adapter.lock).toHaveBeenCalledTimes(1);
      expect(adapter.release).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();
      await run;
      expect(adapter.release).toHaveBeenCalledTimes(1);
      expect(adapter.lock.mock.invocationCallOrder[0]).toBeLessThan(adapter.release.mock.invocationCallOrder[0]);
    });

    it('releases when the tracer reports materialization, before the trace promise resolves', async () => {
      const adapter = makeAdapter();
      const controller = new IntroSequenceController({ layoutAdapter: adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      const tracer = controller['outlineTracer'];
      let releasedAtMaterialize = false;
      vi.spyOn(tracer, 'startTrace').mockImplementation(async (_d, cb) => {
        expect(adapter.release).not.toHaveBeenCalled();
        cb?.();
        releasedAtMaterialize = adapter.release.mock.calls.length === 1;
      });
      const run = controller.triggerSequence();
      await vi.runAllTimersAsync();
      await run;
      expect(releasedAtMaterialize).toBe(true);
      expect(adapter.release).toHaveBeenCalledTimes(1);
    });

    it('applies a mid-intro layout change only on release', async () => {
      const s = lockHarness();
      const controller = new IntroSequenceController({ layoutAdapter: s.adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      const run = controller.triggerSequence();

      s.resize(812, 375); // rotate mid-intro
      expect(s.attrs.nameLayout).toBe('stacked');

      await vi.runAllTimersAsync();
      await run;
      expect(s.attrs.nameLayout).toBe('single-line');
    });

    it('releases immediately when reduced motion skips the intro', async () => {
      vi.stubGlobal('window', {
        matchMedia: () => ({ matches: true }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      const adapter = makeAdapter();
      const controller = new IntroSequenceController({ layoutAdapter: adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      await controller.triggerSequence();
      expect(adapter.lock).toHaveBeenCalledTimes(1);
      expect(adapter.release).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });

    it('releases when the intro is skipped mid-run and never releases twice', async () => {
      const adapter = makeAdapter();
      const controller = new IntroSequenceController({ layoutAdapter: adapter });
      controller.mount(mockOverlay, onFinish, mockHero, mockSvg);
      void controller.triggerSequence();
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

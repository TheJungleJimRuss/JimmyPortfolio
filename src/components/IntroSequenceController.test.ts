import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntroSequenceController } from './IntroSequenceController';

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
});

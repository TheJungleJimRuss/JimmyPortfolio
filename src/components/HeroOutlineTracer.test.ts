import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HeroOutlineTracer } from './HeroOutlineTracer';

describe('HeroOutlineTracer', () => {
  let mockHeroElement: any;
  let mockSvg: any;
  let mockPath1: any;
  let mockPath2: any;

  beforeEach(() => {
    vi.useFakeTimers();

    const classSet = new Set<string>();
    mockHeroElement = {
      classList: {
        add: vi.fn((...classes: string[]) => classes.forEach((c) => classSet.add(c))),
        remove: vi.fn((...classes: string[]) => classes.forEach((c) => classSet.delete(c))),
        contains: vi.fn((cls: string) => classSet.has(cls)),
      },
      style: {},
      getBoundingClientRect: vi.fn().mockReturnValue({ top: 100, left: 185, width: 386, height: 227 }),
      parentElement: {
        getBoundingClientRect: vi.fn().mockReturnValue({ top: 0, left: 0, width: 1000, height: 1000 }),
      },
    };

    mockPath1 = {
      style: {} as any,
      getTotalLength: vi.fn().mockReturnValue(400),
    };
    mockPath2 = {
      style: {} as any,
      getTotalLength: vi.fn().mockReturnValue(500),
    };

    const svgClasses = new Set<string>();
    mockSvg = {
      style: {} as any,
      classList: {
        add: vi.fn((...classes: string[]) => classes.forEach((c) => svgClasses.add(c))),
        remove: vi.fn((...classes: string[]) => classes.forEach((c) => svgClasses.delete(c))),
        contains: vi.fn((cls: string) => svgClasses.has(cls)),
      },
      querySelectorAll: vi.fn().mockReturnValue([mockPath1, mockPath2]),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes paths with stroke-dasharray and sets hero to is-pending-intro', () => {
    const tracer = new HeroOutlineTracer();
    mockHeroElement.classList.add('is-materialized');
    tracer.init(mockSvg, mockHeroElement);

    expect(mockHeroElement.classList.contains('is-pending-intro')).toBe(true);
    expect(mockHeroElement.classList.contains('is-materialized')).toBe(false);
    expect(mockPath1.style.strokeDasharray).toBe('420 420');
    expect(mockPath1.style.strokeDashoffset).toBe('420');
  });

  it('falls back to precomputed path length when getTotalLength returns 0', () => {
    mockPath1.getTotalLength.mockReturnValue(0);
    const tracer = new HeroOutlineTracer();
    tracer.init(mockSvg, mockHeroElement);

    // Known length for index 0 is 3007, safe length is Math.ceil(3007 * 1.05) = 3158
    expect(mockPath1.style.strokeDasharray).toBe('3158 3158');
    expect(mockPath1.style.strokeDashoffset).toBe('3158');
  });

  it('draws path contours and transitions hero to is-materialized when complete', async () => {
    const tracer = new HeroOutlineTracer();
    tracer.init(mockSvg, mockHeroElement);

    const tracePromise = tracer.startTrace(1500);
    expect(mockSvg.classList.contains('is-active')).toBe(true);

    await vi.runAllTimersAsync();
    await tracePromise;

    expect(mockPath1.style.strokeDashoffset).toBe('0');
    expect(mockPath2.style.strokeDashoffset).toBe('0');
    expect(mockHeroElement.classList.contains('is-materialized')).toBe(true);
  });

  it('completes immediately and materializes on completeImmediately()', () => {
    const tracer = new HeroOutlineTracer();
    tracer.init(mockSvg, mockHeroElement);
    tracer.completeImmediately();

    expect(mockPath1.style.strokeDashoffset).toBe('0');
    expect(mockHeroElement.classList.contains('is-materialized')).toBe(true);
  });
});

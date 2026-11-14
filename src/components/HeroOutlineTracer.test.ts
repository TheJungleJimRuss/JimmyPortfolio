import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HeroOutlineTracer, OUTLINE_LAYOUTS } from './HeroOutlineTracer';

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
    expect(mockPath1.style.strokeDasharray).toBe('400 400');
    expect(mockPath1.style.strokeDashoffset).toBe('400');
  });

  it('scales stroke-dasharray by screen CTM when vector-effect is non-scaling-stroke', () => {
    mockPath1.getAttribute = vi.fn().mockReturnValue('non-scaling-stroke');
    mockSvg.getScreenCTM = vi.fn().mockReturnValue({ a: 0.25 });

    const tracer = new HeroOutlineTracer();
    tracer.init(mockSvg, mockHeroElement);

    // 400 * 0.25 = 100
    expect(mockPath1.style.strokeDasharray).toBe('100 100');
    expect(mockPath1.style.strokeDashoffset).toBe('100');
  });

  it('falls back to precomputed path length when getTotalLength returns 0', () => {
    mockPath1.getTotalLength.mockReturnValue(0);
    const tracer = new HeroOutlineTracer();
    tracer.init(mockSvg, mockHeroElement);

    // Known length for index 0 is 3007
    expect(mockPath1.style.strokeDasharray).toBe('3007 3007');
    expect(mockPath1.style.strokeDashoffset).toBe('3007');
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

  describe('two-row outline', () => {
    let russGroup: any;
    let attrs: Record<string, string>;

    beforeEach(() => {
      attrs = {};
      russGroup = { setAttribute: vi.fn((k: string, v: string) => { attrs[`russ:${k}`] = v; }) };
      mockSvg.setAttribute = vi.fn((k: string, v: string) => { attrs[k] = v; });
      mockSvg.querySelector = vi.fn((sel: string) => (sel === '.hero-trace-russ' ? russGroup : null));
    });

    it('applies the stacked viewBox and leaves the RUSS group in place', () => {
      new HeroOutlineTracer().init(mockSvg, mockHeroElement);
      expect(attrs.viewBox).toBe(OUTLINE_LAYOUTS.stacked.viewBox);
      expect(attrs['russ:transform']).toBe('translate(0 0)');
    });

    it(
      'finishes the trace on time with unchanged timing',
      async () => {
        const tracer = new HeroOutlineTracer();
        tracer.init(mockSvg, mockHeroElement);
        const onMaterialize = vi.fn();
        const done = vi.fn();
        tracer.startTrace(1500, onMaterialize).then(done);

        // 2 paths, 50ms cascade, linear: last stroke closes at 50 + 1450 = 1500ms.
        expect(mockPath2.style.strokeDashoffset).not.toBe('0');
        await vi.advanceTimersByTimeAsync(49);
        expect(mockPath1.style.transition).toBe('stroke-dashoffset 1450ms linear');
        await vi.advanceTimersByTimeAsync(1450);
        expect(mockPath2.style.transition).toBe('stroke-dashoffset 1450ms linear');
        expect(mockHeroElement.classList.contains('is-materialized')).toBe(false);
        expect(onMaterialize).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(mockHeroElement.classList.contains('is-materialized')).toBe(true);
        expect(onMaterialize).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(850);
        expect(done).toHaveBeenCalled();
      },
    );

    it('scales dash lengths by the CTM with the RUSS group translated by 0', () => {
      mockPath1.getAttribute = vi.fn().mockReturnValue('non-scaling-stroke');
      mockSvg.getScreenCTM = vi.fn().mockReturnValue({ a: 0.25 });
      new HeroOutlineTracer().init(mockSvg, mockHeroElement);
      expect(mockPath1.style.strokeDasharray).toBe('100 100');
    });
  });
});

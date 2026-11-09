import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeroName3D } from './HeroName3D';

describe('HeroName3D', () => {
  let hero3d: HeroName3D;
  let mockContainer: HTMLElement;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    hero3d = new HeroName3D();
    mockCanvas = {
      clientWidth: 800,
      clientHeight: 200,
      width: 800,
      height: 200,
      style: {} as CSSStyleDeclaration,
      getContext: vi.fn(() => null),
    } as unknown as HTMLCanvasElement;

    mockContainer = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      dataset: {},
      querySelector: vi.fn(() => mockCanvas),
    } as unknown as HTMLElement;
  });

  it('initializes and detects canvas element', () => {
    hero3d.init(mockContainer, mockCanvas);
    expect(hero3d.isInitialized()).toBe(true);
  });

  it('switches glow state between none, dev, and drone on letter materials', () => {
    hero3d.init(mockContainer, mockCanvas);

    hero3d.setGlowState('dev');
    expect(hero3d.getGlowState()).toBe('dev');

    hero3d.setGlowState('drone');
    expect(hero3d.getGlowState()).toBe('drone');

    hero3d.setGlowState('none');
    expect(hero3d.getGlowState()).toBe('none');
  });

  it('clamps and updates 3D rotation coordinates from normalized pointer input', () => {
    hero3d.init(mockContainer, mockCanvas);

    hero3d.updatePointer(0.5, -0.2);
    const rot = hero3d.getTargetRotation();
    expect(rot.y).toBeCloseTo(-0.15 + 0.5 * 0.28);
    expect(rot.x).toBeCloseTo(0.1 - (-0.2) * 0.18);
  });

  it('resolves triggerBurst animation for dev and drone modes', async () => {
    hero3d.init(mockContainer, mockCanvas);
    const burst = hero3d.triggerBurst('dev');
    expect(burst).toBeInstanceOf(Promise);
    await burst;
    expect(hero3d.getGlowState()).toBe('dev');
  });

  it('cleans up state and disposes resources', () => {
    hero3d.init(mockContainer, mockCanvas);
    hero3d.dispose();
    expect(hero3d.isInitialized()).toBe(false);
  });
});

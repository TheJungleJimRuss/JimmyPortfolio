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

  it('switches glow state and configures emissive intensity (dev is dialed to 1.4, drone is 0)', () => {
    hero3d.init(mockContainer, mockCanvas);

    hero3d.setGlowState('dev');
    expect(hero3d.getGlowState()).toBe('dev');
    expect(hero3d.getEmissiveConfig().frontIntensity).toBe(1.4);
    expect(hero3d.getEmissiveConfig().sidesIntensity).toBe(0.9);
    expect(hero3d.getEmissiveConfig().frontHex).toBe(0x00ff41);

    hero3d.setGlowState('drone');
    expect(hero3d.getGlowState()).toBe('drone');
    expect(hero3d.getEmissiveConfig().frontIntensity).toBe(0);
    expect(hero3d.getEmissiveConfig().sidesIntensity).toBe(0);

    hero3d.setGlowState('none');
    expect(hero3d.getGlowState()).toBe('none');
    expect(hero3d.getEmissiveConfig().frontIntensity).toBe(0);
    expect(hero3d.getEmissiveConfig().sidesIntensity).toBe(0);
  });

  it('clamps and updates 3D rotation and position coordinates from normalized pointer input with zero base offset when centered', () => {
    hero3d.init(mockContainer, mockCanvas);

    hero3d.updatePointer(0, 0);
    const centerRot = hero3d.getTargetRotation();
    const centerPos = hero3d.getTargetPosition();
    expect(centerRot.x).toBeCloseTo(0);
    expect(centerRot.y).toBeCloseTo(0);
    expect(centerPos.x).toBeCloseTo(0);
    expect(centerPos.y).toBeCloseTo(0);

    hero3d.updatePointer(0.5, -0.2);
    const rot = hero3d.getTargetRotation();
    const pos = hero3d.getTargetPosition();
    expect(rot.y).toBeCloseTo(0.5 * 0.55);
    expect(rot.x).toBeCloseTo(-0.2 * 0.35);
    expect(pos.x).toBeCloseTo(0.5 * 0.45);
    expect(pos.y).toBeCloseTo(-0.2 * 0.22);
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

  describe('input profile', () => {
    const touch = { inputMode: 'touch' as const, idleDrift: true, tiltEnabled: true };

    it('touch drag tilts within the same ranges and eases back to rest on release', () => {
      hero3d.init(mockContainer, mockCanvas);
      hero3d.setInputProfile(touch);
      hero3d.setDragging(true);
      hero3d.updatePointer(2, -2);
      expect(hero3d.getTargetRotation().y).toBeCloseTo(0.55);
      expect(hero3d.getTargetRotation().x).toBeCloseTo(-0.35);
      expect(hero3d.getTargetPosition().x).toBeCloseTo(0.45);
      hero3d.setDragging(false);
      expect(hero3d.getTargetRotation()).toEqual({ x: 0, y: 0 });
      expect(hero3d.getTargetPosition()).toEqual({ x: 0, y: 0 });
    });

    it('touch idle drift sways when not touching, and not while dragging', () => {
      hero3d.init(mockContainer, mockCanvas);
      hero3d.setInputProfile(touch);
      hero3d.updateIdle(2250);
      const swayed = hero3d.getTargetRotation();
      expect(Math.abs(swayed.y)).toBeGreaterThan(0);
      expect(Math.abs(swayed.y)).toBeLessThan(0.55 * 0.25);
      hero3d.setDragging(true);
      hero3d.updatePointer(0, 0);
      hero3d.updateIdle(4500);
      expect(hero3d.getTargetRotation()).toEqual({ x: 0, y: 0 });
    });

    it('phone rotation replaces idle sway, yields to drag and returns after release', () => {
      hero3d.init(mockContainer, mockCanvas);
      hero3d.setInputProfile(touch);
      hero3d.setOrientationTilt(0.4, 0.3);
      expect(hero3d.getTargetRotation().y).toBeCloseTo(0.4 * 0.55);
      expect(hero3d.getTargetRotation().x).toBeCloseTo(0.3 * 0.35);
      expect(hero3d.getTargetPosition().y).toBeCloseTo(0.3 * 0.22);
      const pose = hero3d.getTargetRotation();
      hero3d.updateIdle(2250);
      expect(hero3d.getTargetRotation()).toEqual(pose);
      hero3d.setDragging(true);
      hero3d.updatePointer(-1, 0);
      expect(hero3d.getTargetRotation().y).toBeCloseTo(-0.55);
      hero3d.setOrientationTilt(0.1, 0.1);
      expect(hero3d.getTargetRotation().y).toBeCloseTo(-0.55);
      hero3d.setDragging(false);
      expect(hero3d.getTargetRotation().y).toBeCloseTo(0.1 * 0.55);
      hero3d.setOrientationTilt(null);
      expect(hero3d.getTargetRotation()).toEqual({ x: 0, y: 0 });
      hero3d.updateIdle(2250);
      expect(Math.abs(hero3d.getTargetRotation().y)).toBeGreaterThan(0);
    });

    it('phone rotation is ignored for mouse mode and reduced motion', () => {
      hero3d.init(mockContainer, mockCanvas);
      hero3d.setOrientationTilt(0.5, 0.5);
      expect(hero3d.getTargetRotation()).toEqual({ x: 0, y: 0 });
      hero3d.setInputProfile({ inputMode: 'touch', idleDrift: false, tiltEnabled: false });
      hero3d.setOrientationTilt(0.5, 0.5);
      expect(hero3d.getTargetRotation()).toEqual({ x: 0, y: 0 });
    });

    it('mouse mode has no idle drift', () => {
      hero3d.init(mockContainer, mockCanvas);
      hero3d.updateIdle(2250);
      expect(hero3d.getTargetRotation()).toEqual({ x: 0, y: 0 });
    });

    it('reduced motion disables drag tilt and drift', () => {
      hero3d.init(mockContainer, mockCanvas);
      hero3d.setInputProfile({ inputMode: 'touch', idleDrift: false, tiltEnabled: false });
      hero3d.setDragging(true);
      hero3d.updatePointer(1, 1);
      hero3d.updateIdle(2250);
      expect(hero3d.getTargetRotation()).toEqual({ x: 0, y: 0 });
      expect(hero3d.getTargetPosition()).toEqual({ x: 0, y: 0 });
    });
  });
});

describe('HeroName3D name layout', () => {
  it('stores the requested layout before and without WebGL, defaulting to single-line', () => {
    const h = new HeroName3D();
    expect(h.getNameLayout()).toBe('single-line');
    h.setNameLayout('stacked');
    expect(h.getNameLayout()).toBe('stacked');
  });
});

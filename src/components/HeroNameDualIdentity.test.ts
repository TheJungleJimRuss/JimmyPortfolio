import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeroNameDualIdentity } from './HeroNameDualIdentity';

describe('HeroNameDualIdentity', () => {
  let hero: HeroNameDualIdentity;
  let mockContainer: HTMLElement;
  let mockText: HTMLElement;

  beforeEach(() => {
    hero = new HeroNameDualIdentity();
    mockText = {
      style: {} as CSSStyleDeclaration,
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    } as unknown as HTMLElement;

    mockContainer = {
      dataset: {},
      querySelector: vi.fn((sel: string) => {
        if (sel.includes('.wf-gateway-name') || sel.includes('#heroNameText')) {
          return mockText;
        }
        return null;
      }),
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLElement;
  });

  it('initializes and binds to container element', () => {
    hero.init(mockContainer);
    expect(hero.isInitialized()).toBe(true);
  });

  it('updates visual state to dev, drone, and none', () => {
    hero.init(mockContainer);

    hero.setVisualState('dev');
    expect(mockContainer.dataset.state).toBe('dev');

    hero.setVisualState('drone');
    expect(mockContainer.dataset.state).toBe('drone');

    hero.setVisualState('none');
    expect(mockContainer.dataset.state).toBe('none');
  });

  it('calculates 3D tilt and translate transform within bounds and centers at 0 when mouse is centered', () => {
    hero.init(mockContainer);

    hero.updatePointerTilt(0, 0);
    expect(mockText.style.transform).toBe('perspective(850px) translate3d(0.0px, 0.0px, 0px) rotateX(0.00deg) rotateY(0.00deg)');

    hero.updatePointerTilt(0.5, -0.5);
    expect(mockText.style.transform).toContain('perspective');
    expect(mockText.style.transform).toContain('translate3d');
    expect(mockText.style.transform).toContain('rotateX');
    expect(mockText.style.transform).toContain('rotateY');
    // 0.5 * 36 = 18deg yaw, -0.5 * 28 = -14deg pitch, 0.5 * 18 = 9px translateX, -0.5 * 12 = -6px translateY
    expect(mockText.style.transform).toBe('perspective(850px) translate3d(9.0px, -6.0px, 0px) rotateX(-14.00deg) rotateY(18.00deg)');
  });

  it('triggers launch burst animation and resolves', async () => {
    hero.init(mockContainer);
    const burstPromise = hero.triggerLaunchBurst('dev');
    expect(burstPromise).toBeInstanceOf(Promise);
    await burstPromise;
    expect(mockContainer.dataset.state).toBe('dev');
  });

  it('cleans up state upon disposal', () => {
    hero.init(mockContainer);
    hero.dispose();
    expect(hero.isInitialized()).toBe(false);
  });

  describe('input profile', () => {
    const touch = { inputMode: 'touch' as const, idleDrift: true, tiltEnabled: true };

    it('touch drag mirrors mouse ranges and returns to rest on release', () => {
      hero.init(mockContainer);
      hero.setInputProfile(touch);
      hero.setDragging(true);
      hero.updatePointerTilt(0.5, -0.5);
      expect(mockText.style.transform).toBe('perspective(850px) translate3d(9.0px, -6.0px, 0px) rotateX(-14.00deg) rotateY(18.00deg)');
      hero.setDragging(false);
      expect(mockText.style.transform).toBe('perspective(850px) translate3d(0.0px, 0.0px, 0px) rotateX(0.00deg) rotateY(0.00deg)');
    });

    it('touch idle drift moves the hero only when not dragging', () => {
      hero.init(mockContainer);
      hero.setInputProfile(touch);
      hero.updateIdle(2250);
      expect(mockText.style.transform).not.toContain('rotateY(0.00deg)');
      hero.setDragging(true);
      hero.updatePointerTilt(0, 0);
      hero.updateIdle(4500);
      expect(mockText.style.transform).toContain('rotateY(0.00deg)');
    });

    it('phone rotation sets the rest pose, replaces idle drift and clears with null', () => {
      hero.init(mockContainer);
      hero.setInputProfile(touch);
      hero.setOrientationTilt(0.5, 0.5);
      expect(mockText.style.transform).toBe('perspective(850px) translate3d(9.0px, 6.0px, 0px) rotateX(14.00deg) rotateY(18.00deg)');
      hero.updateIdle(2250);
      expect(mockText.style.transform).toContain('rotateY(18.00deg)');
      hero.setDragging(true);
      hero.updatePointerTilt(0, 0);
      hero.setDragging(false);
      expect(mockText.style.transform).toContain('rotateY(18.00deg)');
      hero.setOrientationTilt(null);
      expect(mockText.style.transform).toContain('rotateY(0.00deg)');
    });

    it('reduced motion keeps the hero still', () => {
      hero.init(mockContainer);
      hero.setInputProfile({ inputMode: 'touch', idleDrift: false, tiltEnabled: false });
      hero.setDragging(true);
      hero.updatePointerTilt(1, 1);
      hero.updateIdle(2250);
      expect(mockText.style.transform).toBe('perspective(850px) translate3d(0.0px, 0.0px, 0px) rotateX(0.00deg) rotateY(0.00deg)');
    });
  });
});

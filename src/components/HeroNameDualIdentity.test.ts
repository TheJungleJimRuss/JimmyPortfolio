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

  it('calculates 3D tilt transform within bounds', () => {
    hero.init(mockContainer);

    hero.updatePointerTilt(0.5, -0.5);
    expect(mockText.style.transform).toContain('perspective');
    expect(mockText.style.transform).toContain('rotateX');
    expect(mockText.style.transform).toContain('rotateY');
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
});

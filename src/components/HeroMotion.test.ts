import { describe, it, expect } from 'vitest';
import {
  idleSway,
  pixelRatioCap,
  IDLE_SWAY_X,
  IDLE_SWAY_Y,
  orientationToTilt,
  createOrientationTracker,
  ORIENTATION_STRENGTH,
  ORIENTATION_GAMMA_RANGE_DEG,
  ORIENTATION_BETA_RANGE_DEG,
} from './HeroMotion';

describe('HeroMotion', () => {
  it('keeps idle sway small and time-based', () => {
    for (let t = 0; t < 60000; t += 250) {
      const s = idleSway(t);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(IDLE_SWAY_X + 1e-9);
      expect(Math.abs(s.y)).toBeLessThanOrEqual(IDLE_SWAY_Y + 1e-9);
    }
    expect(idleSway(1234)).toEqual(idleSway(1234));
    expect(idleSway(0)).not.toEqual(idleSway(2000));
  });

  it('caps pixel ratio lower on touch', () => {
    expect(pixelRatioCap('touch')).toBe(1.5);
    expect(pixelRatioCap('mouse')).toBe(2);
  });

  describe('orientationToTilt', () => {
    const base = { beta: 50, gamma: 3 };

    it('is zero at the baseline', () => {
      expect(orientationToTilt(base, base, 0)).toEqual({ x: 0, y: 0 });
      expect(orientationToTilt(base, base, 90)).toEqual({ x: 0, y: 0 });
    });

    it('maps gamma to x and beta to y, scaled to a fraction of the range', () => {
      const t = orientationToTilt({ beta: 50, gamma: 3 + ORIENTATION_GAMMA_RANGE_DEG / 2 }, base, 0);
      expect(t.x).toBeCloseTo(-0.5 * ORIENTATION_STRENGTH);
      expect(t.y).toBeCloseTo(0);
      const u = orientationToTilt({ beta: 50 + ORIENTATION_BETA_RANGE_DEG / 2, gamma: 3 }, base, 0);
      expect(u.y).toBeCloseTo(-0.5 * ORIENTATION_STRENGTH);
    });

    it('clamps to the strength limit', () => {
      const t = orientationToTilt({ beta: 170, gamma: -80 }, base, 0);
      expect(t.x).toBeCloseTo(ORIENTATION_STRENGTH);
      expect(t.y).toBeCloseTo(-ORIENTATION_STRENGTH);
      expect(ORIENTATION_STRENGTH).toBeLessThan(1);
    });

    it('swaps axes in landscape', () => {
      const dB = { beta: 50 + ORIENTATION_BETA_RANGE_DEG, gamma: 3 };
      const a90 = orientationToTilt(dB, base, 90);
      expect(a90.x).toBeCloseTo(-ORIENTATION_STRENGTH);
      expect(a90.y).toBeCloseTo(0);
      const a270 = orientationToTilt(dB, base, 270);
      expect(a270.x).toBeCloseTo(ORIENTATION_STRENGTH);
      const dG = { beta: 50, gamma: 3 + ORIENTATION_GAMMA_RANGE_DEG };
      expect(orientationToTilt(dG, base, 90).y).toBeCloseTo(ORIENTATION_STRENGTH);
      expect(orientationToTilt(dG, base, -90).y).toBeCloseTo(-ORIENTATION_STRENGTH);
      expect(orientationToTilt(dG, base, 180).x).toBeCloseTo(ORIENTATION_STRENGTH);
    });

    it('counter-tilts: the hero leans opposite to the phone rotation', () => {
      expect(orientationToTilt({ beta: 60, gamma: 3 }, base, 0).y).toBeLessThan(0);
      expect(orientationToTilt({ beta: 50, gamma: 13 }, base, 0).x).toBeLessThan(0);
    });
  });

  describe('createOrientationTracker', () => {
    it('captures the first reading as rest, then tracks and re-baselines slowly', () => {
      const tr = createOrientationTracker();
      expect(tr.update({ beta: 60, gamma: 5 }, 0, 0)).toEqual({ x: 0, y: 0 });
      const moved = tr.update({ beta: 70, gamma: 5 }, 0, 16)!;
      expect(moved.y).toBeLessThan(0);
      let last = moved.y;
      for (let t = 32; t < 30000; t += 16) last = tr.update({ beta: 70, gamma: 5 }, 0, t)!.y;
      expect(last).toBeGreaterThan(moved.y / 4);
    });

    it('re-baselines when the screen angle changes and ignores null readings', () => {
      const tr = createOrientationTracker();
      tr.update({ beta: 60, gamma: 5 }, 0, 0);
      expect(tr.update({ beta: 10, gamma: 80 }, 90, 100)).toEqual({ x: 0, y: 0 });
      expect(tr.update(null, 90, 200)).toBeNull();
    });
  });
});

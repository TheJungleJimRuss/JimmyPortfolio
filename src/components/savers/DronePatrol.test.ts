import { describe, it, expect } from 'vitest';
import { dronePatrol, DRONE_CALM_INTERVAL_MS, MAX_TURN_RATE, type DronePatrolState } from './DronePatrol';

const view = { width: 1024, height: 700 };
const run = (calm: boolean, steps: number, dt = 16, seed = 7): DronePatrolState => {
  let s = dronePatrol.init(seed, view, calm);
  for (let i = 0; i < steps; i++) s = dronePatrol.step(s, dt, view);
  return s;
};
const inBounds = (s: DronePatrolState, v: { width: number; height: number }): boolean =>
  s.x >= s.margin - 1e-6 && s.x <= v.width - s.margin + 1e-6 && s.y >= s.margin - 1e-6 && s.y <= v.height - s.margin + 1e-6;
const angleDiff = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

describe('dronePatrol', () => {
  it('sizes the drone at 6-10% of the shorter side', () => {
    const s = dronePatrol.init(1, view, false);
    expect(s.size).toBeGreaterThanOrEqual(0.06 * 700 - 1e-6);
    expect(s.size).toBeLessThanOrEqual(0.1 * 700 + 1e-6);
    expect(inBounds(s, view)).toBe(true);
  });
  it('gives the same frames for the same seed, different for another', () => {
    expect(run(false, 300, 16, 7)).toEqual(run(false, 300, 16, 7));
    expect(run(false, 300, 16, 7)).not.toEqual(run(false, 300, 16, 8));
    expect(run(true, 400, 100, 7)).toEqual(run(true, 400, 100, 7));
  });
  it('actually travels across the screen', () => {
    let s = dronePatrol.init(4, view, false);
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < 6000; i++) {
      s = dronePatrol.step(s, 16, view);
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x);
    }
    expect(maxX - minX).toBeGreaterThan(view.width * 0.3);
  });
  it('stays inside the viewport (with margin) over many steps', () => {
    let s = dronePatrol.init(3, view, false);
    for (let i = 0; i < 20_000; i++) {
      s = dronePatrol.step(s, 50, view);
      if (!inBounds(s, view)) throw new Error(`out of bounds at step ${i}`);
    }
  });
  it('stays inside after a resize, larger or smaller', () => {
    let s = run(false, 500);
    const small = { width: 375, height: 640 };
    s = dronePatrol.step(s, 16, small);
    expect(inBounds(s, small)).toBe(true);
    for (let i = 0; i < 2000; i++) s = dronePatrol.step(s, 33, small);
    expect(inBounds(s, small)).toBe(true);
    const big = { width: 1600, height: 900 };
    for (let i = 0; i < 500; i++) s = dronePatrol.step(s, 33, big);
    expect(inBounds(s, big)).toBe(true);
  });
  it('survives a tiny viewport', () => {
    const tiny = { width: 40, height: 30 };
    let s = dronePatrol.init(2, tiny, false);
    for (let i = 0; i < 200; i++) s = dronePatrol.step(s, 40, tiny);
    expect(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.heading)).toBe(true);
  });
  it('moves smoothly: bounded displacement and heading change per step', () => {
    let s = dronePatrol.init(9, view, false);
    for (let i = 0; i < 20_000; i++) {
      const next = dronePatrol.step(s, 16, view);
      expect(Math.hypot(next.x - s.x, next.y - s.y)).toBeLessThan(4);
      expect(angleDiff(next.heading, s.heading)).toBeLessThanOrEqual(MAX_TURN_RATE * 0.016 + 1e-6);
      s = next;
    }
  });
  it('spins the rotors when live', () => {
    expect(run(false, 20).spin).not.toBe(0);
  });
  it('calm mode changes position no more often than its interval', () => {
    expect(DRONE_CALM_INTERVAL_MS).toBeGreaterThanOrEqual(3000);
    let s = dronePatrol.init(5, view, true);
    const first = s;
    let changes = 0;
    const dt = 100;
    const total = 20_000;
    for (let t = 0; t < total; t += dt) {
      const next = dronePatrol.step(s, dt, view);
      if (next.x !== s.x || next.y !== s.y) changes++;
      s = next;
    }
    expect(changes).toBeLessThanOrEqual(Math.floor(total / DRONE_CALM_INTERVAL_MS));
    expect(changes).toBeGreaterThan(0);
    expect(s.x !== first.x || s.y !== first.y).toBe(true);
    expect(inBounds(s, view)).toBe(true);
  });
  it('calm mode keeps rotors still and stays in bounds after a resize', () => {
    let s = run(true, 100, 100);
    expect(s.spin).toBe(0);
    const small = { width: 375, height: 640 };
    s = dronePatrol.step(s, 16, small);
    expect(inBounds(s, small)).toBe(true);
  });
});

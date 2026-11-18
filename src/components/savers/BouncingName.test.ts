import { describe, it, expect } from 'vitest';
import { bouncingName, CALM_INTERVAL_MS, type BouncingNameState } from './BouncingName';

const view = { width: 1024, height: 700 };
const run = (calm: boolean, steps: number, dt = 16, seed = 7, v = view): BouncingNameState => {
  let s = bouncingName.init(seed, v, calm);
  for (let i = 0; i < steps; i++) s = bouncingName.step(s, dt, v);
  return s;
};
const inBounds = (s: BouncingNameState, v: { width: number; height: number }): boolean =>
  s.x >= -1e-6 && s.y >= -1e-6 && s.x + s.w <= v.width + 1e-6 && s.y + s.h <= v.height + 1e-6;

describe('bouncingName', () => {
  it('is deterministic per seed', () => {
    expect(run(false, 300, 16, 7)).toEqual(run(false, 300, 16, 7));
    expect(run(false, 300, 16, 7)).not.toEqual(run(false, 300, 16, 8));
  });
  it('starts in bounds, moving diagonally at a constant speed', () => {
    const s = bouncingName.init(3, view, false);
    expect(inBounds(s, view)).toBe(true);
    expect(Math.abs(s.vx)).toBeGreaterThan(0);
    expect(Math.abs(s.vx)).toBe(Math.abs(s.vy));
    const t = run(false, 5000, 16, 3);
    expect(Math.hypot(t.vx, t.vy)).toBeCloseTo(Math.hypot(s.vx, s.vy), 6);
  });
  it('stays fully in bounds over many steps', () => {
    let s = bouncingName.init(3, view, false);
    for (let i = 0; i < 20_000; i++) {
      s = bouncingName.step(s, 16, view);
      expect(inBounds(s, view)).toBe(true);
    }
  });
  it('is clamped back in after the viewport shrinks', () => {
    let s = run(false, 200);
    const small = { width: 375, height: 600 };
    s = bouncingName.step(s, 16, small);
    expect(inBounds(s, small)).toBe(true);
    for (let i = 0; i < 2000; i++) {
      s = bouncingName.step(s, 16, small);
      expect(inBounds(s, small)).toBe(true);
    }
  });
  it('flips only the velocity component of the wall it hits', () => {
    const s0 = bouncingName.init(1, view, false);
    const right = { ...s0, x: view.width - s0.w - 1, y: 200, vx: 100, vy: 100 };
    const r = bouncingName.step(right, 100, view);
    expect(r.vx).toBe(-100);
    expect(r.vy).toBe(100);
    expect(r.cornerHit).toBe(false);
    const bottom = { ...s0, x: 200, y: view.height - s0.h - 1, vx: 100, vy: 100 };
    const b = bouncingName.step(bottom, 100, view);
    expect(b.vx).toBe(100);
    expect(b.vy).toBe(-100);
  });
  it('flags an exact corner hit and counts it', () => {
    const s0 = bouncingName.init(1, view, false);
    const corner = { ...s0, x: view.width - s0.w - 1, y: view.height - s0.h - 1, vx: 100, vy: 100, corners: 0 };
    const c = bouncingName.step(corner, 50, view);
    expect(c.cornerHit).toBe(true);
    expect(c.corners).toBe(1);
    expect(c.vx).toBe(-100);
    expect(c.vy).toBe(-100);
    const after = bouncingName.step(c, 16, view);
    expect(after.cornerHit).toBe(false);
    expect(after.corners).toBe(1);
  });
  it('does not flag a plain wall bounce', () => {
    const s0 = bouncingName.init(1, view, false);
    const wall = { ...s0, x: view.width - s0.w - 1, y: 300, vx: 100, vy: 100 };
    expect(bouncingName.step(wall, 50, view).cornerHit).toBe(false);
  });
  it('calm does not move and jumps no more often than its interval', () => {
    let s = bouncingName.init(5, view, true);
    const start = { x: s.x, y: s.y };
    let changes = 0;
    let prev = start;
    const dt = 100;
    const total = 20_000;
    for (let t = 0; t < total; t += dt) {
      s = bouncingName.step(s, dt, view);
      expect(inBounds(s, view)).toBe(true);
      if (s.x !== prev.x || s.y !== prev.y) changes++;
      prev = { x: s.x, y: s.y };
    }
    expect(changes).toBeGreaterThan(0);
    expect(changes).toBeLessThanOrEqual(Math.floor(total / CALM_INTERVAL_MS));
    expect(bouncingName.step(bouncingName.init(5, view, true), CALM_INTERVAL_MS - 1, view)).toMatchObject(start);
  });
});

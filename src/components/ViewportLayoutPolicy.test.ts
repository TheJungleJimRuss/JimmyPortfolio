import { describe, it, expect } from 'vitest';
import { viewportLayoutPolicy, createLayoutLock, type ViewportFacts } from './ViewportLayoutPolicy';

const mouseFacts = { coarsePointer: false, canHover: true, reducedMotion: false };
const touchFacts = { coarsePointer: true, canHover: false, reducedMotion: false };

describe('viewportLayoutPolicy.decide', () => {
  const layoutCases: [string, ViewportFacts, 'stacked' | 'single-line'][] = [
    ['portrait phone', { width: 375, height: 812, ...touchFacts }, 'stacked'],
    ['landscape phone', { width: 812, height: 375, ...touchFacts }, 'single-line'],
    ['portrait iPad', { width: 768, height: 1024, ...touchFacts }, 'stacked'],
    ['landscape iPad', { width: 1024, height: 768, ...touchFacts }, 'single-line'],
    ['narrow desktop window', { width: 500, height: 400, ...mouseFacts }, 'stacked'],
    ['wide desktop', { width: 1440, height: 900, ...mouseFacts }, 'single-line'],
    ['600px landscape is not narrow', { width: 600, height: 400, ...mouseFacts }, 'single-line'],
    ['square viewport is not portrait', { width: 800, height: 800, ...mouseFacts }, 'single-line'],
  ];

  it.each(layoutCases)('%s -> %s layout', (_name, facts, expected) => {
    expect(viewportLayoutPolicy.decide(facts).nameLayout).toBe(expected);
  });

  it('coarse pointer without hover -> touch input with idle drift', () => {
    const d = viewportLayoutPolicy.decide({ width: 375, height: 812, ...touchFacts });
    expect(d.inputMode).toBe('touch');
    expect(d.idleDrift).toBe(true);
    expect(d.tiltEnabled).toBe(true);
  });

  it('mouse input has no idle drift', () => {
    const d = viewportLayoutPolicy.decide({ width: 1440, height: 900, ...mouseFacts });
    expect(d.inputMode).toBe('mouse');
    expect(d.idleDrift).toBe(false);
    expect(d.tiltEnabled).toBe(true);
  });

  it('coarse pointer that can also hover stays mouse', () => {
    const d = viewportLayoutPolicy.decide({ width: 1024, height: 768, coarsePointer: true, canHover: true, reducedMotion: false });
    expect(d.inputMode).toBe('mouse');
  });

  it('reduced motion disables drift and tilt', () => {
    const d = viewportLayoutPolicy.decide({ width: 375, height: 812, ...touchFacts, reducedMotion: true });
    expect(d.inputMode).toBe('touch');
    expect(d.idleDrift).toBe(false);
    expect(d.tiltEnabled).toBe(false);
  });
});

describe('createLayoutLock', () => {
  it('passes requests through while unlocked', () => {
    const lock = createLayoutLock();
    expect(lock.request('stacked')).toBe('stacked');
    expect(lock.request('single-line')).toBe('single-line');
  });

  it('returns the locked layout for requests while locked', () => {
    const lock = createLayoutLock();
    lock.request('single-line');
    lock.lock();
    expect(lock.request('stacked')).toBe('single-line');
  });

  it('release returns the latest requested layout', () => {
    const lock = createLayoutLock();
    lock.request('single-line');
    lock.lock();
    lock.request('stacked');
    lock.request('single-line');
    lock.request('stacked');
    expect(lock.release()).toBe('stacked');
    expect(lock.request('single-line')).toBe('single-line');
  });

  it('release without changes returns the held layout', () => {
    const lock = createLayoutLock();
    lock.request('stacked');
    lock.lock();
    expect(lock.release()).toBe('stacked');
  });
});

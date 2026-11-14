import { describe, it, expect } from 'vitest';
import { createInitialState, reduce } from './DesktopState';
import {
  clampPosition,
  desktopLayoutFor,
  formatClock,
  taskbarItems,
  updateOrder,
  windowSize,
  windowTitle,
} from './DesktopView';

describe('desktopLayoutFor', () => {
  it('uses phone below 700px wide', () => {
    expect(desktopLayoutFor({ width: 375, height: 812 })).toBe('phone');
    expect(desktopLayoutFor({ width: 699, height: 900 })).toBe('phone');
  });
  it('uses desktop for tablet and wide viewports', () => {
    expect(desktopLayoutFor({ width: 768, height: 1024 })).toBe('desktop');
    expect(desktopLayoutFor({ width: 1024, height: 768 })).toBe('desktop');
  });
  it('treats a landscape phone as phone', () => {
    expect(desktopLayoutFor({ width: 812, height: 375 })).toBe('phone');
  });
});

describe('windowSize and clampPosition', () => {
  const bounds = { width: 1000, height: 700 };
  it('keeps the fixed size when it fits', () => {
    expect(windowSize('about', bounds)).toEqual({ width: 560, height: 640 });
  });
  it('shrinks only to fit the surface', () => {
    expect(windowSize('about', { width: 500, height: 300 })).toEqual({ width: 500, height: 300 });
  });
  it('gives project windows a size', () => {
    expect(windowSize('project:kcc', bounds).width).toBeGreaterThan(0);
  });
  it('clamps inside the bounds', () => {
    const size = { width: 600, height: 400 };
    expect(clampPosition({ x: -20, y: -5 }, size, bounds)).toEqual({ x: 0, y: 0 });
    expect(clampPosition({ x: 900, y: 900 }, size, bounds)).toEqual({ x: 400, y: 300 });
    expect(clampPosition({ x: 64, y: 64 }, size, bounds)).toEqual({ x: 64, y: 64 });
  });
  it('pins to the origin when the window is larger than the surface', () => {
    expect(clampPosition({ x: 50, y: 50 }, { width: 1200, height: 800 }, bounds)).toEqual({ x: 0, y: 0 });
  });
});

describe('windowTitle', () => {
  it('names title bars', () => {
    expect(windowTitle('projects')).toBe('~/projects');
    expect(windowTitle('about')).toBe('~/about');
    expect(windowTitle('contact')).toBe('~/contact');
    expect(windowTitle('hero')).toBe('JIMMY RUSS');
    expect(windowTitle('project:kcc')).toBe('~/projects/kcc');
  });
});

describe('taskbarItems', () => {
  it('lists open windows in first-seen order, marking the focused one pressed', () => {
    const s = reduce(createInitialState('desktop'), { type: 'arrive' });
    const order = updateOrder([], s);
    const items = taskbarItems(s, order);
    expect(items.map((i) => i.id)).toEqual(['projects', 'hero']);
    expect(items.find((i) => i.id === 'hero')?.pressed).toBe(true);
    expect(items.find((i) => i.id === 'projects')?.pressed).toBe(false);
  });
  it('keeps the order when focus changes and shows minimized windows unpressed', () => {
    let s = reduce(createInitialState('desktop'), { type: 'arrive' });
    const order = updateOrder([], s);
    s = reduce(s, { type: 'focus', id: 'projects' });
    s = reduce(s, { type: 'minimize', id: 'hero' });
    const items = taskbarItems(s, order);
    expect(items.map((i) => i.id)).toEqual(['projects', 'hero']);
    expect(items[1]).toMatchObject({ minimized: true, pressed: false });
  });
  it('drops closed windows from the desktop Taskbar', () => {
    let s = reduce(createInitialState('desktop'), { type: 'arrive' });
    const order = updateOrder([], s);
    s = reduce(s, { type: 'close', id: 'projects' });
    expect(taskbarItems(s, order).map((i) => i.id)).toEqual(['hero']);
  });
  it('lists the four main windows on phone with the visible one pressed', () => {
    const s = reduce(createInitialState('phone'), { type: 'arrive' });
    const items = taskbarItems(s, []);
    expect(items.map((i) => i.id)).toEqual(['hero', 'projects', 'about', 'contact']);
    expect(items.filter((i) => i.pressed).map((i) => i.id)).toEqual(['hero']);
  });
});

describe('updateOrder', () => {
  it('appends only new ids', () => {
    const s = reduce(createInitialState('desktop'), { type: 'arrive' });
    const once = updateOrder([], s);
    expect(updateOrder(once, s)).toEqual(once);
    const s2 = reduce(s, { type: 'open', id: 'about' });
    expect(updateOrder(once, s2)).toEqual([...once, 'about']);
  });
});

describe('formatClock', () => {
  it('pads to HH:MM', () => {
    expect(formatClock(new Date(2026, 10, 13, 7, 5))).toBe('07:05');
    expect(formatClock(new Date(2026, 10, 13, 18, 42))).toBe('18:42');
  });
});

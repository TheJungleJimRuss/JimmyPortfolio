import { describe, it, expect } from 'vitest';
import { createInitialState, reduce } from './DesktopState';
import {
  clampPosition,
  closeFocusTargets,
  escapeAction,
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
  it('formats as 12-hour h:MM AM/PM', () => {
    expect(formatClock(new Date(2026, 10, 13, 7, 5))).toBe('7:05 AM');
    expect(formatClock(new Date(2026, 10, 13, 18, 42))).toBe('6:42 PM');
  });

  it('shows 12 for midnight and noon', () => {
    expect(formatClock(new Date(2026, 10, 13, 0, 0))).toBe('12:00 AM');
    expect(formatClock(new Date(2026, 10, 13, 12, 30))).toBe('12:30 PM');
  });
});

describe('escapeAction', () => {
  it('leaves a stage that owns the keyboard only on Shift+Esc', () => {
    expect(escapeAction({ stageOwnsKeyboard: true, shift: true, hasFocusedWindow: true })).toBe('leave-stage');
  });
  it('leaves plain Esc to the game while it owns the keyboard', () => {
    expect(escapeAction({ stageOwnsKeyboard: true, hasFocusedWindow: true })).toBe('none');
  });
  it('then closes the focused window', () => {
    expect(escapeAction({ stageOwnsKeyboard: false, hasFocusedWindow: true })).toBe('close-window');
  });
  it('does nothing without a focused window', () => {
    expect(escapeAction({ stageOwnsKeyboard: false, hasFocusedWindow: false })).toBe('none');
  });
});

describe('closeFocusTargets', () => {
  it('returns to the icon of a main window on desktop', () => {
    expect(closeFocusTargets('about', 'desktop', null)).toEqual([{ kind: 'icon', id: 'about' }]);
  });
  it('returns from a Project window to the Projects icon, then its Taskbar button', () => {
    expect(closeFocusTargets('project:kcc', 'desktop', 'hero')).toEqual([
      { kind: 'icon', id: 'projects' },
      { kind: 'taskbar', id: 'hero' },
    ]);
  });
  it('falls back to the Taskbar on phone, where icons are not shown', () => {
    expect(closeFocusTargets('about', 'phone', 'hero')).toEqual([{ kind: 'taskbar', id: 'hero' }]);
  });
});

describe('resizeRect', () => {
  const bounds = { width: 1000, height: 700 };
  const start = { position: { x: 100, y: 100 }, size: { width: 400, height: 300 } };
  it('grows from the south-east corner', async () => {
    const { resizeRect } = await import('./DesktopView');
    expect(resizeRect(start, 'se', 50, 40, bounds).size).toEqual({ width: 450, height: 340 });
  });
  it('moves the origin when dragging the west edge and respects the minimum', async () => {
    const { resizeRect, MIN_WINDOW } = await import('./DesktopView');
    const r = resizeRect(start, 'w', 900, 0, bounds);
    expect(r.size.width).toBe(MIN_WINDOW.width);
    expect(r.position.x + r.size.width).toBe(500);
  });
  it('never leaves the surface', async () => {
    const { resizeRect } = await import('./DesktopView');
    const r = resizeRect(start, 'se', 5000, 5000, bounds);
    expect(r.position.x + r.size.width).toBe(1000);
    expect(r.position.y + r.size.height).toBe(700);
  });
});

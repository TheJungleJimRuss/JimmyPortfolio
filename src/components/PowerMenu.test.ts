import { describe, expect, it } from 'vitest';
import { POWER_FADE_MS, POWER_OFF_MS, menuKeyIndex, powerExitMs, restartUrl } from './PowerMenu';

describe('restartUrl', () => {
  it('drops the deep link so Restart boots to a clean Desktop', () => {
    expect(restartUrl('https://site.test/dev.html#/projects/kcc')).toBe('https://site.test/dev.html');
  });

  it('keeps the query string', () => {
    expect(restartUrl('http://localhost:5173/dev.html?persona=dev#/about')).toBe(
      'http://localhost:5173/dev.html?persona=dev',
    );
  });

  it('leaves a URL without a hash unchanged', () => {
    expect(restartUrl('http://localhost:5173/dev.html')).toBe('http://localhost:5173/dev.html');
  });
});

describe('powerExitMs', () => {
  it('Shut Down plays the power-off collapse', () => {
    expect(powerExitMs('shutdown', false)).toBe(POWER_OFF_MS);
  });

  it('Restart uses the page fade', () => {
    expect(powerExitMs('restart', false)).toBe(POWER_FADE_MS);
  });

  it('reduced motion replaces the collapse with the fade', () => {
    expect(powerExitMs('shutdown', true)).toBe(POWER_FADE_MS);
  });
});

describe('menuKeyIndex', () => {
  it('moves down and up, wrapping at both ends', () => {
    expect(menuKeyIndex('ArrowDown', 0, 2)).toBe(1);
    expect(menuKeyIndex('ArrowDown', 1, 2)).toBe(0);
    expect(menuKeyIndex('ArrowUp', 0, 2)).toBe(1);
  });

  it('Home and End jump to the first and last item', () => {
    expect(menuKeyIndex('Home', 1, 3)).toBe(0);
    expect(menuKeyIndex('End', 0, 3)).toBe(2);
  });

  it('ignores other keys, unfocused items and empty menus', () => {
    expect(menuKeyIndex('Enter', 0, 2)).toBeNull();
    expect(menuKeyIndex('ArrowDown', -1, 2)).toBeNull();
    expect(menuKeyIndex('ArrowDown', 0, 0)).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { cursorKindFor, HAND_TARGETS, TEXT_TARGETS } from './PhosphorCursor';

/** A target that "matches" (via closest) only the selectors listed. */
const over = (...selectors: string[]) => (sel: string) => selectors.includes(sel);

describe('cursorKindFor', () => {
  it('is the arrow over plain surfaces and outside the page', () => {
    expect(cursorKindFor(over())).toBe('arrow');
    expect(cursorKindFor(null)).toBe('arrow');
  });

  it('is the hand over links, buttons, labels and choice inputs', () => {
    expect(cursorKindFor(over(HAND_TARGETS))).toBe('hand');
  });

  it('is the text bar in text fields, even inside a clickable label', () => {
    expect(cursorKindFor(over(TEXT_TARGETS))).toBe('text');
    expect(cursorKindFor(over(TEXT_TARGETS, HAND_TARGETS))).toBe('text');
  });

  it('is a resize arrow on a window edge, ahead of everything else', () => {
    expect(cursorKindFor(over('.desk-resize-n', HAND_TARGETS))).toBe('ns');
    expect(cursorKindFor(over('.desk-resize-w'))).toBe('ew');
    expect(cursorKindFor(over('.desk-resize-ne'))).toBe('nesw');
    expect(cursorKindFor(over('.desk-resize-se'))).toBe('nwse');
  });

  it('counts a draggable window title bar as a hand target', () => {
    expect(HAND_TARGETS).toContain(".desk-drag-handle[data-draggable='true']");
  });
});

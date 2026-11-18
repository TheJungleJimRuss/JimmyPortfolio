/**
 * Phosphor cursor: while the CRT filter is on and the visitor has a fine pointer (mouse or trackpad), the system
 * pointer is hidden and this drawn one follows it, so the CRT overlay can lie over the cursor too. Touch input is left
 * alone. Shapes follow what the pointer is over: arrow, hand, text bar, or a resize arrow on a window edge.
 */

export type CursorKind = 'arrow' | 'hand' | 'text' | 'ns' | 'ew' | 'nesw' | 'nwse';

/** Elements that take the hand (they show `cursor: pointer` or `grab` in the stylesheets). */
export const HAND_TARGETS =
  "a[href], button, summary, label, select, [role='button'], [role='switch'], [role='tab'], " +
  "input[type='radio'], input[type='checkbox'], input[type='range'], input[type='button'], input[type='submit'], " +
  ".desk-drag-handle[data-draggable='true']";

/** Elements that take the text bar. */
export const TEXT_TARGETS =
  "textarea, [contenteditable=''], [contenteditable='true'], " +
  "input:not([type]), input[type='text'], input[type='search'], input[type='email'], input[type='url'], input[type='tel'], input[type='password'], input[type='number']";

const RESIZE: ReadonlyArray<[string, CursorKind]> = [
  ['.desk-resize-n', 'ns'], ['.desk-resize-s', 'ns'],
  ['.desk-resize-e', 'ew'], ['.desk-resize-w', 'ew'],
  ['.desk-resize-ne', 'nesw'], ['.desk-resize-sw', 'nesw'],
  ['.desk-resize-nw', 'nwse'], ['.desk-resize-se', 'nwse'],
];

/** `within(selector)` answers whether the pointer's target is, or sits inside, an element matching `selector`. */
export function cursorKindFor(within: ((selector: string) => boolean) | null): CursorKind {
  if (!within) return 'arrow';
  for (const [sel, kind] of RESIZE) if (within(sel)) return kind;
  if (within(TEXT_TARGETS)) return 'text';
  if (within(HAND_TARGETS)) return 'hand';
  return 'arrow';
}

const SHAPE = 'fill="currentColor" stroke="#000" stroke-width="1" stroke-linejoin="miter" paint-order="stroke"';
const SVGS =
  `<svg class="pc-arrow" width="12" height="19" viewBox="0 0 12 19"><path ${SHAPE} d="M0 0V16L4 12L7 18L9 17L6 11H11Z"/></svg>` +
  `<svg class="pc-hand" width="16" height="19" viewBox="0 0 16 19"><path ${SHAPE} d="M5 0H8V7H10V6H12V7H14V8H16V15L14 19H6L2 14V11H4V13H5Z"/></svg>` +
  `<svg class="pc-text" width="8" height="18" viewBox="0 0 8 18"><path ${SHAPE} d="M0 0H3L4 1L5 0H8V1H5V17H8V18H5L4 17L3 18H0V17H3V1H0Z"/></svg>` +
  `<svg class="pc-resize" width="20" height="20" viewBox="0 0 20 20"><path ${SHAPE} d="M10 0L15 5H12V15H15L10 20L5 15H8V5H5Z"/></svg>`;

export function mountPhosphorCursor(el: HTMLElement, win: Window = window): void {
  const doc = win.document;
  const root = doc.documentElement;
  const fine = win.matchMedia('(pointer: fine)');
  el.innerHTML = SVGS;
  el.dataset.kind = 'arrow';

  const syncPointer = (): void => {
    root.classList.toggle('has-phosphor-cursor', fine.matches);
  };
  syncPointer();
  fine.addEventListener('change', syncPointer);

  const hide = (): void => el.classList.remove('is-shown');
  const follow = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return hide();
    el.style.translate = `${e.clientX}px ${e.clientY}px`;
    const t = e.target instanceof Element ? e.target : null;
    el.dataset.kind = cursorKindFor(t ? (sel) => t.closest(sel) !== null : null);
    el.classList.add('is-shown');
  };
  doc.addEventListener('pointermove', follow, { capture: true, passive: true });
  doc.addEventListener('pointerdown', follow, { capture: true, passive: true });
  // An embedded frame (a Project stage demo) shows its own system pointer; leaving the window hides ours.
  doc.addEventListener('pointerover', (e) => {
    if (e.target instanceof HTMLIFrameElement) hide();
  }, true);
  root.addEventListener('pointerleave', hide);
  win.addEventListener('blur', hide);
}

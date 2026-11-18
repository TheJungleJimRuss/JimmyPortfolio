/**
 * Power menu: the Taskbar's left-end button with Restart (reload into the Boot shell) and
 * Shut Down (power-off collapse, then the Gateway). The trigger is a command invoker for a
 * `popover="auto"` menu; script adds the keyboard contract and fallbacks for browsers that lack
 * invoker commands, focusgroup, anchor positioning or the Popover API.
 */

export type PowerAction = 'restart' | 'shutdown';

/** The existing page-exit fade (`.page-is-exiting`). */
export const POWER_FADE_MS = 160;
/** The monitor power-off collapse (`.is-powering-off` in desktop.css). */
export const POWER_OFF_MS = 520;

/** Restart drops the deep link so the Desktop boots clean; the query string is kept. */
export function restartUrl(href: string): string {
  const url = new URL(href);
  url.hash = '';
  return url.href.replace(/#$/, '');
}

export function powerExitMs(action: PowerAction, reducedMotion: boolean): number {
  return action === 'shutdown' && !reducedMotion ? POWER_OFF_MS : POWER_FADE_MS;
}

/** Arrow/Home/End target for the focusgroup fallback, or null when the key does not move focus. */
export function menuKeyIndex(key: string, current: number, count: number): number | null {
  if (count === 0 || current < 0) return null;
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % count;
    case 'ArrowUp':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

export interface PowerMenuElements {
  trigger: HTMLButtonElement;
  menu: HTMLElement;
}

export interface PowerMenuOptions {
  /** Runs the exit effect (class on the page) and returns when to navigate. */
  onExit(action: PowerAction, reducedMotion: boolean): void;
  navigate(url: string): void;
  win?: Window;
}

export function mountPowerMenu({ trigger, menu }: PowerMenuElements, options: PowerMenuOptions): void {
  const win = options.win ?? window;
  const group = menu.querySelector<HTMLElement>('[focusgroup]') ?? menu;
  const items = (): HTMLElement[] =>
    [...group.querySelectorAll<HTMLElement>('button, a[href]')].filter((el) => !el.hasAttribute('disabled'));

  const hasPopover = Object.hasOwn(HTMLElement.prototype, 'popover');
  const hasInvokers = 'commandForElement' in HTMLButtonElement.prototype;
  const hasFocusgroup = 'focusGroup' in HTMLElement.prototype;
  const hasAnchor = typeof CSS !== 'undefined' && CSS.supports('position-area: block-start');

  let enterOnOpen = false;
  let pointerPressed = false;
  let busy = false;

  const isOpen = (): boolean => (hasPopover ? menu.matches(':popover-open') : !menu.hidden);
  const show = (): void => {
    if (hasPopover) (menu.showPopover as (o?: { source?: HTMLElement }) => void)({ source: trigger });
    else {
      menu.hidden = false;
      onToggle(true);
    }
  };
  const hide = (): void => {
    if (!isOpen()) return;
    if (hasPopover) menu.hidePopover();
    else {
      menu.hidden = true;
      onToggle(false);
    }
  };
  const closeAndRestore = (fromPointer: boolean): void => {
    trigger.focus({ focusVisible: !fromPointer } as FocusOptions);
    hide();
  };

  function place(): void {
    if (hasAnchor) return;
    const r = trigger.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(r.left, win.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, r.top - menu.offsetHeight - 6)}px`;
  }

  function onToggle(open: boolean): void {
    trigger.setAttribute('aria-expanded', String(open));
    if (!open) return;
    place();
    if (enterOnOpen) items()[0]?.focus();
    else trigger.focus({ focusVisible: false } as FocusOptions);
    enterOnOpen = false;
  }

  if (!hasPopover) {
    menu.removeAttribute('popover');
    menu.hidden = true;
    win.document.addEventListener('pointerdown', (e) => {
      const t = e.target as Node;
      if (isOpen() && !menu.contains(t) && !trigger.contains(t)) hide();
    });
  } else {
    menu.addEventListener('toggle', (e) => onToggle((e as ToggleEvent).newState === 'open'));
  }

  if (!hasFocusgroup) {
    group.setAttribute('role', 'menu');
    for (const item of items()) if (!item.hasAttribute('role')) item.setAttribute('role', 'menuitem');
  }

  trigger.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pointerPressed = true;
  });
  trigger.addEventListener('click', (e) => {
    const fromPointer = pointerPressed && e.detail !== 0;
    pointerPressed = false;
    if (!isOpen()) enterOnOpen = !fromPointer;
    if (hasInvokers && hasPopover) return; // `command="toggle-popover"` does the toggle.
    e.preventDefault();
    if (isOpen()) closeAndRestore(fromPointer);
    else show();
  });

  // Escape bubbles to the Desktop root, which would also close the focused window.
  const stopEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && isOpen()) {
      e.stopPropagation();
      if (!hasPopover) closeAndRestore(false);
    }
  };
  trigger.addEventListener('keydown', (e) => {
    stopEscape(e);
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    if (isOpen()) items()[0]?.focus();
    else {
      enterOnOpen = true;
      trigger.click();
    }
  });
  menu.addEventListener('keydown', (e) => {
    stopEscape(e);
    if (e.key === 'Tab') {
      hide();
      return;
    }
    if (hasFocusgroup) return;
    const list = items();
    const next = menuKeyIndex(e.key, list.indexOf(win.document.activeElement as HTMLElement), list.length);
    if (next === null) return;
    e.preventDefault();
    list[next].focus({ preventScroll: true });
  });
  menu.addEventListener('pointermove', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('button, a[href]');
    if (item && item !== win.document.activeElement) item.focus({ focusVisible: false } as FocusOptions);
  });
  win.document.addEventListener('focusin', (e) => {
    const t = e.target as Node;
    if (isOpen() && !menu.contains(t) && t !== trigger) hide();
  });

  menu.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-power]');
    if (!item || busy) return;
    e.preventDefault();
    busy = true;
    const action = item.dataset.power as PowerAction;
    const reduced = !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    closeAndRestore(e.detail !== 0);
    options.onExit(action, reduced);
    const url =
      action === 'restart' ? restartUrl(win.location.href) : (item as HTMLAnchorElement).href || './index.html';
    win.setTimeout(() => options.navigate(url), powerExitMs(action, reduced));
  });

  // Returning through the back/forward cache must leave the menu usable again.
  win.addEventListener('pageshow', () => {
    busy = false;
  });
}

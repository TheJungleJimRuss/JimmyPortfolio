/**
 * Settings panel: the Taskbar's right-end button and its popover (a flyout on the desktop layout, a bottom sheet on
 * the phone layout). Same open/close/focus-return contract and fallbacks as the Power menu: `popover="auto"` driven
 * by a command invoker, with script fallbacks for browsers that lack invoker commands, anchor positioning or the
 * Popover API. The panel holds radio groups, so Tab moves between controls and arrows move inside a group natively.
 * It is not a Desktop window: no WindowId, no deep link, no Back entry.
 */
import {
  DEFAULT_SETTINGS,
  localSettingsStorage,
  loadSettings,
  saveSettings,
  type Settings,
  type SettingsStorage,
} from './Settings';

export interface SettingsPanelElements {
  trigger: HTMLButtonElement;
  panel: HTMLElement;
}

export interface SettingsPanelOptions {
  storage?: SettingsStorage;
  /** Called with the full settings on mount (stored values) and after every change. */
  onChange?(settings: Settings): void;
  /** The Preview button was pressed; the panel has already closed. */
  onPreview?(): void;
  win?: Window;
}

/**
 * Controls are named after their Settings field: radio groups (`<input type="radio" name="phosphor" value="amber">`)
 * and the CRT switch (`<input type="checkbox" name="crt">`).
 */
export function applySettingsToRoot(root: HTMLElement, s: Settings): void {
  root.dataset.phosphor = s.phosphor;
  root.dataset.crt = s.crt;
}

export function mountSettingsPanel({ trigger, panel }: SettingsPanelElements, options: SettingsPanelOptions = {}): void {
  const win = options.win ?? window;
  const storage = options.storage ?? localSettingsStorage;
  let settings = loadSettings(storage);

  const hasPopover = Object.hasOwn(HTMLElement.prototype, 'popover');
  const hasInvokers = 'commandForElement' in HTMLButtonElement.prototype;
  const hasAnchor = typeof CSS !== 'undefined' && CSS.supports('position-area: block-start');

  const radios = (name: string): HTMLInputElement[] =>
    [...panel.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`)];

  const crtSwitch = panel.querySelector<HTMLInputElement>('input[type="checkbox"][name="crt"]');

  function syncControls(): void {
    if (crtSwitch) crtSwitch.checked = settings.crt === 'on';
    for (const name of ['screensaver', 'wait', 'phosphor'] as const) {
      for (const input of radios(name)) input.checked = input.value === String(settings[name]);
    }
  }
  function apply(): void {
    applySettingsToRoot(win.document.documentElement, settings);
    syncControls();
    options.onChange?.(settings);
  }
  function update(next: Settings): void {
    settings = next;
    apply();
    saveSettings(storage, settings);
  }
  apply();

  crtSwitch?.addEventListener('change', () => {
    update({ ...settings, crt: crtSwitch.checked ? 'on' : 'off' });
  });
  panel.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type !== 'radio' || !input.checked) return;
    if (input.name === 'phosphor') update({ ...settings, phosphor: input.value as Settings['phosphor'] });
    else if (input.name === 'screensaver') update({ ...settings, screensaver: input.value as Settings['screensaver'] });
    else if (input.name === 'wait') update({ ...settings, wait: Number(input.value) as Settings['wait'] });
  });
  panel.querySelector('[data-settings-preview]')?.addEventListener('click', (e) => {
    const fromPointer = (e as MouseEvent).detail !== 0;
    if (isOpen()) closeAndRestore(fromPointer); // the popover sits in the top layer, above the saver
    options.onPreview?.();
  });
  panel.querySelector('[data-settings-reset]')?.addEventListener('click', (e) => {
    e.preventDefault();
    update({ ...DEFAULT_SETTINGS });
  });

  // ---- open / close ----
  let pointerPressed = false;
  const isOpen = (): boolean => (hasPopover ? panel.matches(':popover-open') : !panel.hidden);
  const show = (): void => {
    if (hasPopover) (panel.showPopover as (o?: { source?: HTMLElement }) => void)({ source: trigger });
    else {
      panel.hidden = false;
      onToggle(true);
    }
  };
  const hide = (): void => {
    if (!isOpen()) return;
    if (hasPopover) panel.hidePopover();
    else {
      panel.hidden = true;
      onToggle(false);
    }
  };
  const closeAndRestore = (fromPointer: boolean): void => {
    trigger.focus({ focusVisible: !fromPointer } as FocusOptions);
    hide();
  };

  function place(): void {
    if (hasAnchor || win.document.querySelector('[data-layout="phone"]')) return;
    const r = trigger.getBoundingClientRect();
    panel.style.left = `${Math.max(8, Math.min(r.right - panel.offsetWidth, win.innerWidth - panel.offsetWidth - 8))}px`;
    panel.style.top = `${Math.max(8, r.top - panel.offsetHeight - 6)}px`;
  }

  function onToggle(open: boolean): void {
    trigger.setAttribute('aria-expanded', String(open));
    if (!open) return;
    place();
    // Keyboard users land on the checked radio of the first group; pointer users keep focus on the button.
    if (enterOnOpen) (panel.querySelector<HTMLInputElement>('input:checked') ?? panel.querySelector<HTMLElement>('input, button'))?.focus();
    enterOnOpen = false;
  }
  let enterOnOpen = false;

  if (!hasPopover) {
    panel.removeAttribute('popover');
    panel.hidden = true;
    win.document.addEventListener('pointerdown', (e) => {
      const t = e.target as Node;
      if (isOpen() && !panel.contains(t) && !trigger.contains(t)) hide();
    });
  } else {
    panel.addEventListener('toggle', (e) => onToggle((e as ToggleEvent).newState === 'open'));
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
  const onEscape = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || !isOpen()) return;
    e.stopPropagation();
    if (!hasPopover) closeAndRestore(false);
    else if (e.target !== trigger) trigger.focus({ focusVisible: true } as FocusOptions); // popover light-dismiss then hides it
  };
  trigger.addEventListener('keydown', onEscape);
  panel.addEventListener('keydown', onEscape);

  // Tabbing out of the panel closes it, like focusing anything else outside.
  win.document.addEventListener('focusin', (e) => {
    const t = e.target as Node;
    if (isOpen() && !panel.contains(t) && t !== trigger) hide();
  });
}

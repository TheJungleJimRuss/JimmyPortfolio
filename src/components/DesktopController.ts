import { createInitialState, reduce, type DesktopAction, type DesktopState, type Position, type WindowId } from './DesktopState';
import {
  clampPosition,
  desktopLayoutFor,
  formatClock,
  taskbarItems,
  updateOrder,
  windowSize,
  windowTitle,
} from './DesktopView';

export interface DesktopElements {
  root: HTMLElement;
  surface: HTMLElement;
  icons: HTMLElement;
  taskbarButtons: HTMLElement;
  clock: HTMLElement;
  live: HTMLElement;
}

export interface DesktopOptions {
  /** Content nodes for windows that have real content yet; others show a framed `[ ... ]` slot. */
  content?: Partial<Record<WindowId, HTMLElement>>;
  /** Builds content for a window when it is first created (used for Project windows); `null` keeps the slot. */
  /** Called after every render with the new state, so content views can follow it (e.g. Project stages). */
  onState?: (state: DesktopState) => void;
  /** Window to open when the Desktop is revealed (the arrival), parsed from the URL hash. */
  deepLink?: WindowId | null;
  contentFor?: (id: WindowId, dispatch: (action: DesktopAction) => void) => HTMLElement | null;
}

const MAIN_WINDOWS: WindowId[] = ['hero', 'projects', 'about', 'contact'];
const KEY_STEP_PX = 15;

interface WindowEls {
  el: HTMLElement;
  handle: HTMLButtonElement;
  minimize: HTMLButtonElement;
  maximize: HTMLButtonElement;
  close: HTMLButtonElement;
}

/** DOM adapter: renders Desktop state from `reduce` and forwards input as actions. */
export class DesktopController {
  private state: DesktopState;
  private order: WindowId[] = [];
  private readonly windows = new Map<WindowId, WindowEls>();
  private readonly taskbar = new Map<WindowId, HTMLButtonElement>();
  private locked = false;
  private pendingLayout = false;
  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private lastAnnouncement: string | null = null;

  constructor(
    private readonly els: DesktopElements,
    private readonly options: DesktopOptions = {},
    private readonly win: Window = window,
  ) {
    this.state = createInitialState(this.measureLayout());
  }

  mount(): void {
    const { root, icons } = this.els;
    this.state = reduce(this.state, { type: 'arrive' });
    this.state = { ...this.state, announcement: null };

    icons.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
      if (btn) this.dispatch({ type: 'open', id: btn.dataset.open as WindowId });
    });
    this.els.taskbarButtons.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-window-id]');
      if (btn) this.dispatch({ type: 'open', id: btn.dataset.windowId as WindowId });
    });
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || this.isBooting() || !this.state.focused) return;
      this.dispatch({ type: 'close', id: this.state.focused });
    });
    this.win.addEventListener('resize', () => this.onResize());

    this.tickClock();
    this.clockTimer = setInterval(() => this.tickClock(), 15_000);
    this.render();
  }

  /** Holds the layout chosen now until `release` (Layout lock during the Intro sequence). */
  lock(): void {
    this.locked = true;
  }

  release(): void {
    this.locked = false;
    if (this.pendingLayout) this.onResize();
  }

  /** Reveals the Desktop (it is laid out but invisible while the Intro sequence runs). */
  reveal(): void {
    if (!this.isBooting()) return;
    this.els.root.classList.remove('is-booting');
    this.els.live.textContent = 'Desktop ready';
    const deepLink = this.options.deepLink;
    if (deepLink) {
      this.dispatch({ type: 'arrive', deepLink });
      this.state = { ...this.state, announcement: null };
    }
  }

  dispose(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  getState(): DesktopState {
    return this.state;
  }

  dispatch(action: DesktopAction): void {
    const before = this.state;
    this.state = reduce(before, action);
    this.render();
    if (action.type === 'open' && this.state.focused === action.id) {
      this.windows.get(action.id)?.el.focus({ preventScroll: true });
    } else if (action.type === 'close' && before !== this.state) {
      this.els.icons.querySelector<HTMLElement>(`[data-open="${action.id}"]`)?.focus();
    }
  }

  private isBooting(): boolean {
    return this.els.root.classList.contains('is-booting');
  }

  private measureLayout() {
    return desktopLayoutFor({ width: this.win.innerWidth, height: this.win.innerHeight });
  }

  private onResize(): void {
    if (this.locked) {
      this.pendingLayout = true;
      return;
    }
    this.pendingLayout = false;
    this.dispatch({ type: 'setLayout', layout: this.measureLayout() });
  }

  private tickClock(): void {
    this.els.clock.textContent = formatClock(new Date());
  }

  private bounds() {
    return { width: this.els.surface.clientWidth, height: this.els.surface.clientHeight };
  }

  private ensureWindow(id: WindowId): WindowEls {
    const existing = this.windows.get(id);
    if (existing) return existing;

    const el = document.createElement('section');
    el.className = 'desk-window';
    el.dataset.window = id.startsWith('project:') ? 'project' : id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'false');
    el.tabIndex = -1;
    const titleId = `deskTitle-${id.replace(/[^a-z0-9]/gi, '-')}`;
    el.setAttribute('aria-labelledby', titleId);

    const bar = document.createElement('div');
    bar.className = 'desk-titlebar';
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'desk-drag-handle';
    handle.id = titleId;
    handle.textContent = windowTitle(id);
    handle.setAttribute('aria-description', 'Drag, or use the arrow keys, to move this window');
    const controls = document.createElement('div');
    controls.className = 'desk-controls';
    const mk = (cls: string, label: string, glyph: string) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `desk-control desk-control-${cls}`;
      b.setAttribute('aria-label', `${label} ${windowTitle(id)}`);
      b.textContent = glyph;
      controls.append(b);
      return b;
    };
    const minimize = mk('minimize', 'Minimize', '–');
    const maximize = mk('maximize', 'Maximize', '□');
    const close = mk('close', 'Close', '×');
    bar.append(handle, controls);

    const body = document.createElement('div');
    body.className = 'desk-body';
    const content = this.options.content?.[id] ?? this.options.contentFor?.(id, (a) => this.dispatch(a));
    if (content) {
      body.append(content);
    } else {
      const slot = document.createElement('div');
      slot.className = 'desk-slot';
      slot.textContent = '[ ... ]';
      body.append(slot);
    }
    el.append(bar, body);
    this.els.surface.append(el);

    el.addEventListener('pointerdown', () => {
      if (this.state.focused !== id) this.dispatch({ type: 'focus', id });
    });
    minimize.addEventListener('click', () => this.dispatch({ type: 'minimize', id }));
    maximize.addEventListener('click', () => this.dispatch({ type: 'maximize', id }));
    close.addEventListener('click', () => this.dispatch({ type: 'close', id }));
    this.bindDrag(id, handle);

    const made = { el, handle, minimize, maximize, close };
    this.windows.set(id, made);
    return made;
  }

  private displayPosition(id: WindowId): Position {
    const w = this.state.windows.find((x) => x.id === id);
    const bounds = this.bounds();
    return clampPosition(w?.position ?? { x: 0, y: 0 }, windowSize(id, bounds), bounds);
  }

  private bindDrag(id: WindowId, handle: HTMLButtonElement): void {
    let offset: Position | null = null;
    const canDrag = () => {
      const w = this.state.windows.find((x) => x.id === id);
      return this.state.layout === 'desktop' && !!w && !w.maximized;
    };
    const moveTo = (p: Position) => {
      const bounds = this.bounds();
      this.dispatch({ type: 'move', id, position: clampPosition(p, windowSize(id, bounds), bounds) });
    };

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !canDrag()) return;
      const pos = this.displayPosition(id);
      const surface = this.els.surface.getBoundingClientRect();
      offset = { x: e.clientX - surface.left - pos.x, y: e.clientY - surface.top - pos.y };
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!offset || !handle.hasPointerCapture(e.pointerId)) return;
      const surface = this.els.surface.getBoundingClientRect();
      handle.classList.add('is-dragging');
      moveTo({ x: e.clientX - surface.left - offset.x, y: e.clientY - surface.top - offset.y });
    });
    handle.addEventListener('lostpointercapture', () => {
      offset = null;
      handle.classList.remove('is-dragging');
    });
    handle.addEventListener('keydown', (e) => {
      if (!canDrag()) return;
      const step: Record<string, Position> = {
        ArrowLeft: { x: -KEY_STEP_PX, y: 0 },
        ArrowRight: { x: KEY_STEP_PX, y: 0 },
        ArrowUp: { x: 0, y: -KEY_STEP_PX },
        ArrowDown: { x: 0, y: KEY_STEP_PX },
      };
      const d = step[e.key];
      if (!d) return;
      e.preventDefault();
      const pos = this.displayPosition(id);
      moveTo({ x: pos.x + d.x, y: pos.y + d.y });
    });
  }

  private render(): void {
    const { state } = this;
    const { root, surface } = this.els;
    root.dataset.layout = state.layout;
    this.order = updateOrder(this.order, state);
    const bounds = this.bounds();

    for (const id of this.order) this.ensureWindow(id);
    for (const id of MAIN_WINDOWS) this.ensureWindow(id);

    const phone = state.layout === 'phone';
    for (const [id, parts] of this.windows) {
      const index = state.windows.findIndex((w) => w.id === id);
      const w = index >= 0 ? state.windows[index] : undefined;
      const visible = !!w && !w.minimized;
      parts.el.hidden = !visible;
      if (!w) continue;
      const size = windowSize(id, bounds);
      const pos = clampPosition(w.position, size, bounds);
      parts.el.style.setProperty('--win-x', `${pos.x}px`);
      parts.el.style.setProperty('--win-y', `${pos.y}px`);
      parts.el.style.setProperty('--win-w', `${size.width}px`);
      parts.el.style.setProperty('--win-h', `${size.height}px`);
      parts.el.style.zIndex = String(index + 1);
      parts.el.classList.toggle('is-maximized', w.maximized && !phone);
      parts.el.classList.toggle('is-focused', state.focused === id);
      parts.maximize.hidden = phone;
      parts.maximize.setAttribute('aria-pressed', String(w.maximized));
      const home = phone && id === 'hero';
      parts.minimize.hidden = phone || home;
      parts.close.hidden = home;
      parts.handle.disabled = false;
      parts.handle.dataset.draggable = String(!phone && !w.maximized);
    }
    surface.dataset.windowCount = String(state.windows.length);

    this.renderTaskbar();

    if (state.announcement && state.announcement !== this.lastAnnouncement) {
      this.els.live.textContent = state.announcement;
    }
    this.lastAnnouncement = state.announcement;
    this.options.onState?.(state);
  }

  private renderTaskbar(): void {
    const items = taskbarItems(this.state, this.order);
    const keep = new Set(items.map((i) => i.id));
    for (const [id, btn] of this.taskbar) {
      if (!keep.has(id)) {
        btn.remove();
        this.taskbar.delete(id);
      }
    }
    items.forEach((item, i) => {
      let btn = this.taskbar.get(item.id);
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'taskbar-btn';
        btn.dataset.windowId = item.id;
        this.taskbar.set(item.id, btn);
      }
      btn.textContent = item.label;
      btn.setAttribute('aria-pressed', String(item.pressed));
      btn.classList.toggle('is-minimized', item.minimized);
      const at = this.els.taskbarButtons.children[i];
      if (at !== btn) this.els.taskbarButtons.insertBefore(btn, at ?? null);
    });
  }
}

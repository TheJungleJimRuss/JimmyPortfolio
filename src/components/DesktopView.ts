import type { DesktopLayout, DesktopState, Position, WindowId } from './DesktopState';

/** Viewports narrower than this show the phone layout (one full-screen window). */
export const PHONE_MAX_WIDTH_PX = 700;
/** Landscape phones are wide but too short for floating windows, so short viewports also use the phone layout. */
export const PHONE_MAX_HEIGHT_PX = 480;

export function desktopLayoutFor(viewport: { width: number; height: number }): DesktopLayout {
  return viewport.width < PHONE_MAX_WIDTH_PX || viewport.height < PHONE_MAX_HEIGHT_PX ? 'phone' : 'desktop';
}

export interface Size {
  width: number;
  height: number;
}

const BASE_SIZES: Record<string, Size> = {
  hero: { width: 600, height: 400 },
  projects: { width: 560, height: 420 },
  about: { width: 560, height: 640 },
  contact: { width: 420, height: 320 },
};
const PROJECT_WINDOW_SIZE: Size = { width: 640, height: 520 };

/** The fixed size of a window, shrunk only when the Desktop surface is smaller than it. */
export function windowSize(id: WindowId, bounds: Size): Size {
  const base = BASE_SIZES[id] ?? PROJECT_WINDOW_SIZE;
  return { width: Math.min(base.width, bounds.width), height: Math.min(base.height, bounds.height) };
}

/** Keeps a window fully inside the Desktop surface so its title bar stays reachable. */
export function clampPosition(position: Position, size: Size, bounds: Size): Position {
  const maxX = Math.max(0, bounds.width - size.width);
  const maxY = Math.max(0, bounds.height - size.height);
  return {
    x: Math.round(Math.min(Math.max(position.x, 0), maxX)),
    y: Math.round(Math.min(Math.max(position.y, 0), maxY)),
  };
}

const TITLES: Record<string, string> = {
  hero: 'JIMMY RUSS',
  projects: '~/projects',
  about: '~/about',
  contact: '~/contact',
};
const LABELS: Record<string, string> = { hero: 'Hero', projects: 'Projects', about: 'About', contact: 'Contact' };

export function windowTitle(id: WindowId): string {
  return id.startsWith('project:') ? `~/projects/${id.slice('project:'.length)}` : TITLES[id];
}

export function windowLabel(id: WindowId): string {
  return id.startsWith('project:') ? id.slice('project:'.length) : LABELS[id];
}

export interface TaskbarItem {
  id: WindowId;
  label: string;
  pressed: boolean;
  minimized: boolean;
}

const PHONE_HOME_IDS: WindowId[] = ['hero', 'projects', 'about', 'contact'];

/**
 * Taskbar buttons in a stable order. Desktop lists the open windows in the order they first
 * appeared (`order`); the phone always lists the four main windows so the Taskbar can switch.
 */
export function taskbarItems(state: DesktopState, order: readonly WindowId[]): TaskbarItem[] {
  const open = new Map(state.windows.map((w) => [w.id, w]));
  let ids: WindowId[];
  if (state.layout === 'phone') {
    const extra = state.windows.map((w) => w.id).filter((id) => !PHONE_HOME_IDS.includes(id));
    ids = [...PHONE_HOME_IDS, ...extra];
  } else {
    ids = order.filter((id) => open.has(id));
  }
  return ids.map((id) => {
    const w = open.get(id);
    return {
      id,
      label: windowLabel(id),
      pressed: w !== undefined && !w.minimized && state.focused === id,
      minimized: w?.minimized ?? false,
    };
  });
}

/** Appends ids that are new in `state` to `order`, keeping first-seen order. */
export function updateOrder(order: readonly WindowId[], state: DesktopState): WindowId[] {
  const next = [...order];
  for (const w of state.windows) if (!next.includes(w.id)) next.push(w.id);
  return next;
}

export function formatClock(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

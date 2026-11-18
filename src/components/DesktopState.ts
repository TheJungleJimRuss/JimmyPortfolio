export type WindowId = 'hero' | 'projects' | 'about' | 'contact' | `project:${string}`;
export type StageState = 'poster' | 'loaded' | 'paused';
export type DesktopLayout = 'desktop' | 'phone';

export interface Position {
  x: number;
  y: number;
}

export interface WindowState {
  id: WindowId;
  minimized: boolean;
  maximized: boolean;
  position: Position;
  /** User-chosen size; absent means the window's default size. */
  size?: { width: number; height: number };
}

export interface DesktopState {
  windows: WindowState[];
  focused: WindowId | null;
  stages: Record<string, StageState>;
  layout: DesktopLayout;
  announcement: string | null;
  /** Window opened by the deep link on arrival; `back` closes it. */
  deepLinked: WindowId | null;
}

export type DesktopAction =
  | { type: 'arrive'; deepLink?: WindowId }
  | { type: 'open'; id: WindowId }
  | { type: 'focus'; id: WindowId }
  | { type: 'minimize' | 'maximize' | 'close'; id: WindowId }
  | { type: 'move'; id: WindowId; position: Position }
  | { type: 'resize'; id: WindowId; position: Position; size: { width: number; height: number } }
  | { type: 'loadStage'; slug: string }
  | { type: 'setLayout'; layout: DesktopLayout }
  | { type: 'back' };

export function createInitialState(layout: DesktopLayout): DesktopState {
  return { windows: [], focused: null, stages: {}, layout, announcement: null, deepLinked: null };
}

const LABELS: Record<string, string> = {
  hero: 'Hero',
  projects: 'Projects',
  about: 'About',
  contact: 'Contact',
};

function labelOf(id: WindowId): string {
  return id.startsWith('project:') ? id.slice('project:'.length) : LABELS[id];
}

function slugOf(id: WindowId): string | null {
  return id.startsWith('project:') ? id.slice('project:'.length) : null;
}

const CASCADE_STEP_PX = 24;
const CASCADE_ORIGIN_PX = 40;
const HERO_ARRIVAL_POSITION_PX = 64;

function newWindow(id: WindowId, count: number): WindowState {
  const offset = CASCADE_STEP_PX * count;
  return {
    id,
    minimized: false,
    maximized: false,
    position: { x: CASCADE_ORIGIN_PX + offset, y: CASCADE_ORIGIN_PX + offset },
  };
}

function frontVisible(windows: WindowState[]): WindowId | null {
  for (let i = windows.length - 1; i >= 0; i--) {
    if (!windows[i].minimized) return windows[i].id;
  }
  return null;
}

/** Keeps at most one stage loaded: every stage but `keep` that is loaded returns to poster. */
function enforceOneLive(stages: Record<string, StageState>, keep: string): Record<string, StageState> {
  const next: Record<string, StageState> = {};
  for (const [slug, st] of Object.entries(stages)) next[slug] = slug !== keep && st === 'loaded' ? 'poster' : st;
  return next;
}

function resetStage(stages: Record<string, StageState>, id: WindowId): Record<string, StageState> {
  const slug = slugOf(id);
  return slug !== null && slug in stages ? { ...stages, [slug]: 'poster' } : stages;
}

function withFocus(state: DesktopState): DesktopState {
  return { ...state, focused: frontVisible(state.windows) };
}

function bringToFront(windows: WindowState[], id: WindowId): WindowState[] {
  const target = windows.find((w) => w.id === id);
  return target ? [...windows.filter((w) => w.id !== id), target] : windows;
}

/** Phone: one window shows at a time. Replaced windows are closed, so their stages reset. */
function showOnly(state: DesktopState, id: WindowId): DesktopState {
  const existing = state.windows.find((w) => w.id === id);
  let stages = state.stages;
  for (const w of state.windows) if (w.id !== id) stages = resetStage(stages, w.id);
  const kept = existing ?? newWindow(id, 0);
  return {
    ...state,
    windows: [{ ...kept, minimized: false, maximized: false }],
    stages,
    focused: id,
    deepLinked: state.deepLinked === id ? state.deepLinked : null,
  };
}

function goHome(state: DesktopState): DesktopState {
  return showOnly(state, 'hero');
}

function open(state: DesktopState, id: WindowId): DesktopState {
  if (state.layout === 'phone') {
    if (state.windows.length === 1 && state.windows[0].id === id) return { ...state, focused: id };
    return { ...showOnly(state, id), announcement: `${labelOf(id)} opened` };
  }
  const existing = state.windows.find((w) => w.id === id);
  if (!existing) {
    return {
      ...state,
      windows: [...state.windows, newWindow(id, state.windows.length)],
      focused: id,
      announcement: `${labelOf(id)} opened`,
    };
  }
  const windows = bringToFront(state.windows, id).map((w) => (w.id === id ? { ...w, minimized: false } : w));
  let stages = state.stages;
  const slug = slugOf(id);
  if (existing.minimized && slug !== null && stages[slug] === 'paused') {
    stages = { ...enforceOneLive(stages, slug), [slug]: 'loaded' };
  }
  return {
    ...state,
    windows,
    stages,
    focused: id,
    announcement: existing.minimized ? `${labelOf(id)} restored` : state.announcement,
  };
}

function close(state: DesktopState, id: WindowId): DesktopState {
  if (!state.windows.some((w) => w.id === id)) return state;
  const deepLinked = state.deepLinked === id ? null : state.deepLinked;
  const announcement = `${labelOf(id)} closed`;
  if (state.layout === 'phone') {
    if (id === 'hero') return state;
    return { ...goHome({ ...state, deepLinked }), announcement };
  }
  return withFocus({
    ...state,
    windows: state.windows.filter((w) => w.id !== id),
    stages: resetStage(state.stages, id),
    deepLinked,
    announcement,
  });
}

function minimize(state: DesktopState, id: WindowId): DesktopState {
  if (!state.windows.some((w) => w.id === id)) return state;
  if (state.layout === 'phone') return id === 'hero' ? state : goHome(clearDeepLink(state, id));
  const slug = slugOf(id);
  const stages = slug !== null && state.stages[slug] === 'loaded' ? { ...state.stages, [slug]: 'paused' as const } : state.stages;
  return withFocus({
    ...state,
    windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    stages,
  });
}

function clearDeepLink(state: DesktopState, id: WindowId): DesktopState {
  return { ...state, deepLinked: state.deepLinked === id ? null : state.deepLinked };
}

function arrive(state: DesktopState, deepLink?: WindowId): DesktopState {
  const base = createInitialState(state.layout);
  if (state.layout === 'phone') {
    const target = deepLink ?? 'hero';
    return { ...showOnly(base, target), deepLinked: deepLink && deepLink !== 'hero' ? deepLink : null };
  }
  let s: DesktopState = {
    ...base,
    windows: [newWindow('projects', 0), newWindow('hero', 1)],
    focused: 'hero',
  };
  const heroAt = { x: HERO_ARRIVAL_POSITION_PX, y: HERO_ARRIVAL_POSITION_PX };
  s = { ...s, windows: [s.windows[0], { ...s.windows[1], position: heroAt }] };
  if (deepLink) {
    const arrivalOpen = deepLink === 'hero' || deepLink === 'projects';
    s = { ...open(s, deepLink), deepLinked: arrivalOpen ? null : deepLink, announcement: null };
  }
  return s;
}

/**
 * Each action announces on its own: the previous announcement is cleared first, and an action that
 * changes nothing returns the same state object it was given.
 */
export function reduce(state: DesktopState, action: DesktopAction): DesktopState {
  const base = state.announcement === null ? state : { ...state, announcement: null };
  const next = reduceAction(base, action);
  return next === base ? state : next;
}

function reduceAction(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case 'arrive':
      return arrive(state, action.deepLink);
    case 'open':
      return open(state, action.id);
    case 'focus': {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target || target.minimized) return state;
      return { ...state, windows: bringToFront(state.windows, action.id), focused: action.id };
    }
    case 'minimize':
      return minimize(state, action.id);
    case 'maximize': {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target || target.minimized || state.layout === 'phone') return state;
      const windows = bringToFront(state.windows, action.id).map((w) =>
        w.id === action.id ? { ...w, maximized: !w.maximized } : w,
      );
      return { ...state, windows, focused: action.id };
    }
    case 'close':
      return close(state, action.id);
    case 'move': {
      if (state.layout === 'phone' || !state.windows.some((w) => w.id === action.id)) return state;
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, position: { ...action.position } } : w)),
      };
    }
    case 'resize': {
      if (state.layout === 'phone' || !state.windows.some((w) => w.id === action.id)) return state;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, position: { ...action.position }, size: { ...action.size } } : w,
        ),
      };
    }
    case 'loadStage': {
      const shown = state.windows.some((w) => w.id === `project:${action.slug}` && !w.minimized);
      if (!shown) return state;
      return { ...state, stages: { ...enforceOneLive(state.stages, action.slug), [action.slug]: 'loaded' } };
    }
    case 'setLayout': {
      if (action.layout === state.layout) return state;
      if (action.layout === 'desktop') return { ...state, layout: 'desktop' };
      return showOnly({ ...state, layout: 'phone' }, frontVisible(state.windows) ?? 'hero');
    }
    case 'back':
      return state.deepLinked === null ? state : close(state, state.deepLinked);
  }
}

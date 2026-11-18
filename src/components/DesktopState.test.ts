import { describe, it, expect } from 'vitest';
import { createInitialState, reduce, type DesktopAction, type DesktopLayout, type DesktopState } from './DesktopState';

const run = (state: DesktopState, ...actions: DesktopAction[]) => actions.reduce(reduce, state);
const arrived = (layout: DesktopLayout = 'desktop', deepLink?: Extract<DesktopAction, { type: 'arrive' }>['deepLink']) =>
  reduce(createInitialState(layout), { type: 'arrive', deepLink });
const ids = (s: DesktopState) => s.windows.map((w) => w.id);
const visible = (s: DesktopState) => s.windows.filter((w) => !w.minimized).map((w) => w.id);
const win = (s: DesktopState, id: string) => s.windows.find((w) => w.id === id);

describe('arrival', () => {
  it('starts with nothing open', () => {
    const s = createInitialState('desktop');
    expect(s.windows).toEqual([]);
    expect(s.focused).toBeNull();
  });

  it('opens Projects behind the Hero window, which is in front and focused', () => {
    const s = arrived();
    expect(ids(s)).toEqual(['projects', 'hero']);
    expect(s.focused).toBe('hero');
    expect(visible(s)).toEqual(['projects', 'hero']);
  });

  it('opens a deep-linked window in front of the Hero window', () => {
    const s = arrived('desktop', 'about');
    expect(ids(s)).toEqual(['projects', 'hero', 'about']);
    expect(s.focused).toBe('about');
  });

  it('a deep link to an already-open arrival window just focuses it', () => {
    const s = arrived('desktop', 'projects');
    expect(ids(s)).toEqual(['hero', 'projects']);
    expect(s.focused).toBe('projects');
  });

  it('phone arrival shows only the Hero window', () => {
    const s = arrived('phone');
    expect(visible(s)).toEqual(['hero']);
    expect(s.focused).toBe('hero');
  });

  it('phone arrival with a deep link shows only that window', () => {
    const s = arrived('phone', 'contact');
    expect(visible(s)).toEqual(['contact']);
    expect(s.focused).toBe('contact');
  });
});

describe('open, focus and z-order', () => {
  it('opening a new window puts it in front, focuses it and announces it', () => {
    const s = run(arrived(), { type: 'open', id: 'about' });
    expect(ids(s)).toEqual(['projects', 'hero', 'about']);
    expect(s.focused).toBe('about');
    expect(s.announcement).toBe('About opened');
  });

  it('opening an open window brings it to the front without duplicating it', () => {
    const s = run(arrived(), { type: 'open', id: 'projects' });
    expect(ids(s)).toEqual(['hero', 'projects']);
    expect(s.focused).toBe('projects');
  });

  it('opening a minimized window restores it and announces the restore', () => {
    const s = run(arrived(), { type: 'minimize', id: 'projects' }, { type: 'open', id: 'projects' });
    expect(win(s, 'projects')?.minimized).toBe(false);
    expect(s.focused).toBe('projects');
    expect(s.announcement).toBe('Projects restored');
  });

  it('focus reorders z-order', () => {
    const s = run(arrived(), { type: 'focus', id: 'projects' });
    expect(ids(s)).toEqual(['hero', 'projects']);
    expect(s.focused).toBe('projects');
  });

  it('focus ignores unknown and minimized windows', () => {
    const base = run(arrived(), { type: 'minimize', id: 'projects' });
    expect(run(base, { type: 'focus', id: 'projects' })).toEqual(base);
    expect(run(base, { type: 'focus', id: 'about' })).toEqual(base);
  });

  it('does not mutate the previous state', () => {
    const before = arrived();
    const snapshot = structuredClone(before);
    run(before, { type: 'open', id: 'about' }, { type: 'minimize', id: 'hero' }, { type: 'close', id: 'projects' });
    expect(before).toEqual(snapshot);
  });
});

describe('minimize, maximize, close', () => {
  it('minimize hides the window and focuses the next front window', () => {
    const s = run(arrived(), { type: 'minimize', id: 'hero' });
    expect(win(s, 'hero')?.minimized).toBe(true);
    expect(s.focused).toBe('projects');
  });

  it('minimizing the last visible window leaves nothing focused', () => {
    const s = run(arrived(), { type: 'minimize', id: 'hero' }, { type: 'minimize', id: 'projects' });
    expect(s.focused).toBeNull();
  });

  it('minimizing a window behind the front keeps focus where it is', () => {
    const s = run(arrived(), { type: 'minimize', id: 'projects' });
    expect(s.focused).toBe('hero');
  });

  it('maximize toggles and brings the window to the front', () => {
    const once = run(arrived(), { type: 'maximize', id: 'projects' });
    expect(win(once, 'projects')?.maximized).toBe(true);
    expect(once.focused).toBe('projects');
    expect(ids(once)).toEqual(['hero', 'projects']);
    const twice = run(once, { type: 'maximize', id: 'projects' });
    expect(win(twice, 'projects')?.maximized).toBe(false);
  });

  it('close removes the window, focuses the next front window and announces', () => {
    const s = run(arrived(), { type: 'close', id: 'hero' });
    expect(ids(s)).toEqual(['projects']);
    expect(s.focused).toBe('projects');
    expect(s.announcement).toBe('Hero closed');
  });

  it('close skips minimized windows when choosing focus', () => {
    const s = run(arrived(), { type: 'minimize', id: 'projects' }, { type: 'close', id: 'hero' });
    expect(s.focused).toBeNull();
  });

  it('actions on unknown windows change nothing', () => {
    const base = arrived();
    for (const type of ['minimize', 'maximize', 'close'] as const) {
      expect(run(base, { type, id: 'about' })).toEqual(base);
    }
  });
});

describe('move', () => {
  it('updates the window position on desktop', () => {
    const s = run(arrived(), { type: 'move', id: 'hero', position: { x: 120, y: 80 } });
    expect(win(s, 'hero')?.position).toEqual({ x: 120, y: 80 });
  });

  it('is ignored in phone layout', () => {
    const base = arrived('phone');
    expect(run(base, { type: 'move', id: 'hero', position: { x: 120, y: 80 } })).toEqual(base);
  });
});

describe('one live stage', () => {
  const withProjects = () => run(arrived(), { type: 'open', id: 'project:kcc' }, { type: 'open', id: 'project:photo' });

  it('loadStage loads that stage', () => {
    expect(run(withProjects(), { type: 'loadStage', slug: 'kcc' }).stages.kcc).toBe('loaded');
  });

  it('loading another stage returns the first to poster', () => {
    const s = run(withProjects(), { type: 'loadStage', slug: 'kcc' }, { type: 'loadStage', slug: 'photo' });
    expect(s.stages).toEqual({ kcc: 'poster', photo: 'loaded' });
  });

  it('minimizing the project window pauses a loaded stage; restoring resumes it', () => {
    const loaded = run(withProjects(), { type: 'loadStage', slug: 'kcc' });
    const paused = run(loaded, { type: 'minimize', id: 'project:kcc' });
    expect(paused.stages.kcc).toBe('paused');
    expect(run(paused, { type: 'open', id: 'project:kcc' }).stages.kcc).toBe('loaded');
  });

  it('minimizing a window whose stage is still a poster leaves it a poster', () => {
    const s = run(withProjects(), { type: 'minimize', id: 'project:kcc' });
    expect(s.stages).toEqual({});
  });

  it('closing the project window resets its stage to poster', () => {
    const s = run(withProjects(), { type: 'loadStage', slug: 'kcc' }, { type: 'close', id: 'project:kcc' });
    expect(s.stages.kcc).toBe('poster');
  });

  it('restoring a paused stage while another is loaded keeps only one loaded', () => {
    const s = run(
      withProjects(),
      { type: 'loadStage', slug: 'kcc' },
      { type: 'minimize', id: 'project:kcc' },
      { type: 'loadStage', slug: 'photo' },
      { type: 'open', id: 'project:kcc' },
    );
    expect(s.stages).toEqual({ kcc: 'loaded', photo: 'poster' });
  });
});

describe('loadStage requires a visible project window', () => {
  const kccOpen = () => run(arrived(), { type: 'open', id: 'project:kcc' });

  it('is ignored when the project window is not open', () => {
    expect(run(arrived(), { type: 'loadStage', slug: 'kcc' })).toEqual(arrived());
  });

  it('is ignored when the project window is minimized', () => {
    const base = run(kccOpen(), { type: 'minimize', id: 'project:kcc' });
    expect(run(base, { type: 'loadStage', slug: 'kcc' })).toEqual(base);
  });

  it('is ignored on phone when the project window is not the visible one', () => {
    const base = run(arrived('phone'), { type: 'open', id: 'project:kcc' }, { type: 'open', id: 'about' });
    expect(run(base, { type: 'loadStage', slug: 'kcc' })).toEqual(base);
  });

  it('an ignored load leaves the currently loaded stage alone', () => {
    const base = run(kccOpen(), { type: 'loadStage', slug: 'kcc' });
    expect(run(base, { type: 'loadStage', slug: 'photo' }).stages).toEqual({ kcc: 'loaded' });
  });
});

describe('arrival resets stages', () => {
  it('a fresh arrival clears any stage state', () => {
    const s = run(arrived(), { type: 'open', id: 'project:kcc' }, { type: 'loadStage', slug: 'kcc' }, { type: 'arrive' });
    expect(s.stages).toEqual({});
  });
});

describe('deep links', () => {
  it('desktop deep link to hero focuses hero and back does nothing', () => {
    const s = arrived('desktop', 'hero');
    expect(ids(s)).toEqual(['projects', 'hero']);
    expect(s.focused).toBe('hero');
    expect(run(s, { type: 'back' })).toEqual(s);
  });

  it('desktop deep link to projects: back does nothing', () => {
    const s = arrived('desktop', 'projects');
    expect(run(s, { type: 'back' })).toEqual(s);
  });

  it('desktop deep link to a project window opens it in front; back closes it', () => {
    const s = arrived('desktop', 'project:kcc');
    expect(ids(s)).toEqual(['projects', 'hero', 'project:kcc']);
    expect(s.focused).toBe('project:kcc');
    expect(ids(run(s, { type: 'back' }))).toEqual(['projects', 'hero']);
  });

  it('phone deep link to a project window shows only it; back goes home', () => {
    const s = arrived('phone', 'project:kcc');
    expect(visible(s)).toEqual(['project:kcc']);
    expect(visible(run(s, { type: 'back' }))).toEqual(['hero']);
  });

  it('dropping the deep-linked window on setLayout phone clears the deep link', () => {
    const s = run(arrived('desktop', 'about'), { type: 'focus', id: 'hero' }, { type: 'setLayout', layout: 'phone' });
    expect(visible(s)).toEqual(['hero']);
    const reopened = run(s, { type: 'open', id: 'about' });
    expect(run(reopened, { type: 'back' })).toEqual(reopened);
  });
});

describe('edge cases', () => {
  it('maximize on a minimized window is ignored', () => {
    const base = run(arrived(), { type: 'minimize', id: 'projects' });
    expect(run(base, { type: 'maximize', id: 'projects' })).toEqual(base);
  });

  it('maximize is ignored on phone', () => {
    const base = arrived('phone');
    expect(run(base, { type: 'maximize', id: 'hero' })).toEqual(base);
  });

  it('focus and move on unknown ids change nothing', () => {
    const base = arrived();
    expect(run(base, { type: 'focus', id: 'about' })).toEqual(base);
    expect(run(base, { type: 'move', id: 'about', position: { x: 1, y: 1 } })).toEqual(base);
  });

  it('phone minimize resets a loaded stage to poster', () => {
    const s = run(
      arrived('phone'),
      { type: 'open', id: 'project:kcc' },
      { type: 'loadStage', slug: 'kcc' },
      { type: 'minimize', id: 'project:kcc' },
    );
    expect(s.stages.kcc).toBe('poster');
    expect(visible(s)).toEqual(['hero']);
  });
});

describe('phone layout', () => {
  it('opening a window replaces the visible one', () => {
    const s = run(arrived('phone'), { type: 'open', id: 'projects' }, { type: 'open', id: 'about' });
    expect(visible(s)).toEqual(['about']);
    expect(s.focused).toBe('about');
    expect(s.announcement).toBe('About opened');
  });

  it('closing a window returns to the Hero window', () => {
    const s = run(arrived('phone'), { type: 'open', id: 'projects' }, { type: 'close', id: 'projects' });
    expect(visible(s)).toEqual(['hero']);
    expect(s.focused).toBe('hero');
  });

  it('the Hero window cannot be closed (it is home)', () => {
    const base = arrived('phone');
    expect(visible(run(base, { type: 'close', id: 'hero' }))).toEqual(['hero']);
  });

  it('replacing a project window resets its loaded stage', () => {
    const s = run(
      arrived('phone'),
      { type: 'open', id: 'project:kcc' },
      { type: 'loadStage', slug: 'kcc' },
      { type: 'open', id: 'about' },
    );
    expect(s.stages.kcc).toBe('poster');
  });

  it('minimizing a window goes home instead of leaving none visible', () => {
    const s = run(arrived('phone'), { type: 'open', id: 'about' }, { type: 'minimize', id: 'about' });
    expect(visible(s)).toEqual(['hero']);
  });

  it('switching to phone keeps only the front visible window', () => {
    const s = run(arrived(), { type: 'open', id: 'about' }, { type: 'setLayout', layout: 'phone' });
    expect(s.layout).toBe('phone');
    expect(visible(s)).toEqual(['about']);
  });

  it('switching to phone with nothing visible shows the Hero window', () => {
    const s = run(arrived(), { type: 'minimize', id: 'hero' }, { type: 'minimize', id: 'projects' }, { type: 'setLayout', layout: 'phone' });
    expect(visible(s)).toEqual(['hero']);
    expect(s.focused).toBe('hero');
  });

  it('switching back to desktop keeps the current window', () => {
    const s = run(arrived('phone'), { type: 'open', id: 'about' }, { type: 'setLayout', layout: 'desktop' });
    expect(s.layout).toBe('desktop');
    expect(visible(s)).toEqual(['about']);
  });
});

describe('back', () => {
  it('closes the deep-linked window', () => {
    const s = run(arrived('desktop', 'about'), { type: 'back' });
    expect(ids(s)).toEqual(['projects', 'hero']);
    expect(s.focused).toBe('hero');
    expect(s.announcement).toBe('About closed');
  });

  it('does nothing without a deep link', () => {
    const base = arrived();
    expect(run(base, { type: 'back' })).toEqual(base);
  });

  it('does nothing once the deep-linked window was already closed', () => {
    const closed = run(arrived('desktop', 'about'), { type: 'close', id: 'about' }, { type: 'open', id: 'about' });
    expect(run(closed, { type: 'back' })).toEqual(closed);
  });

  it('on phone returns to the Hero window', () => {
    const s = run(arrived('phone', 'contact'), { type: 'back' });
    expect(visible(s)).toEqual(['hero']);
  });
});

describe('announcements are per action', () => {
  it('clears the announcement when a later action announces nothing', () => {
    const s = run(arrived(), { type: 'open', id: 'about' }, { type: 'focus', id: 'hero' });
    expect(s.announcement).toBeNull();
  });

  it('announces a second restore after a minimize in between', () => {
    const open = run(arrived(), { type: 'open', id: 'about' }, { type: 'minimize', id: 'about' }, { type: 'open', id: 'about' });
    expect(open.announcement).toBe('About restored');
    const again = run(open, { type: 'minimize', id: 'about' });
    expect(again.announcement).toBeNull();
    expect(reduce(again, { type: 'open', id: 'about' }).announcement).toBe('About restored');
  });

  it('keeps the same state object for a no-op action', () => {
    const s = run(arrived(), { type: 'open', id: 'about' });
    expect(reduce(s, { type: 'close', id: 'project:nope' })).toBe(s);
  });
});

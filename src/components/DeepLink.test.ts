import { describe, it, expect, vi } from 'vitest';
import { DeepLinkHistory, parseDeepLink } from './DeepLink';

const SLUGS = ['kinematic-character-controller', 'drone-desktop', 'photography-portfolio', 'music-studio-website'];

describe('parseDeepLink', () => {
  it('opens about, contact and every known project', () => {
    expect(parseDeepLink('#about', SLUGS)).toBe('about');
    expect(parseDeepLink('#contact', SLUGS)).toBe('contact');
    for (const s of SLUGS) expect(parseDeepLink(`#${s}`, SLUGS)).toBe(`project:${s}`);
  });
  it('tolerates #/ forms, trailing slashes and case', () => {
    expect(parseDeepLink('#/about', SLUGS)).toBe('about');
    expect(parseDeepLink('#/Contact/', SLUGS)).toBe('contact');
    expect(parseDeepLink('#Drone-Desktop', SLUGS)).toBe('project:drone-desktop');
  });
  it('returns null for empty, unknown and garbage hashes', () => {
    for (const h of ['', '#', '#/', '#bogus', '#hero', '#projects', '#about/x', '#%E0%A4%A', '#project:drone-desktop', '#__proto__']) {
      expect(parseDeepLink(h, SLUGS)).toBeNull();
    }
    expect(parseDeepLink('#about', [])).toBe('about');
    expect(parseDeepLink('#drone-desktop', [])).toBeNull();
  });
});

/** Minimal fake of the window history: a list of entries plus an index, with async-free traversal. */
function fakeWindow(startHash: string, startState: unknown = null) {
  const entries = [{ url: '/prev', state: null as unknown }, { url: `/dev.html${startHash}`, state: startState }];
  let index = 1;
  let popListener: () => void = () => {};
  const cur = () => entries[index];
  const win = {
    history: {
      get state() {
        return cur().state;
      },
      pushState(state: unknown, _t: string, url: string) {
        entries.splice(index + 1, entries.length, { url, state });
        index++;
      },
      replaceState(state: unknown, _t: string, url: string) {
        entries[index] = { url, state };
      },
      back() {
        index--;
        popListener();
      },
    },
    location: {
      get pathname() {
        return cur().url.split('#')[0];
      },
      search: '',
      get hash() {
        const i = cur().url.indexOf('#');
        return i < 0 ? '' : cur().url.slice(i);
      },
    },
    addEventListener(_: string, l: () => void) {
      popListener = l;
    },
  };
  return { win: win as unknown as Window, entries, get index() { return index; } };
}

describe('DeepLinkHistory', () => {
  it('pushes one sentinel when a deep link opens a window; clicks elsewhere change nothing', () => {
    const f = fakeWindow('#about');
    const h = new DeepLinkHistory(() => {}, f.win);
    h.sync(null);
    expect(f.entries).toHaveLength(2);
    h.sync('about');
    expect(f.entries).toHaveLength(3);
    expect(f.entries[2].url).toBe('/dev.html#about');
    h.sync('about');
    expect(f.entries).toHaveLength(3);
  });

  it('Back dispatches onBack, clears the hash and leaves a clean entry so the next Back leaves', () => {
    const f = fakeWindow('#about');
    const onBack = vi.fn(() => h.sync(null));
    const h = new DeepLinkHistory(onBack, f.win);
    h.sync('about');
    f.win.history.back();
    expect(onBack).toHaveBeenCalledOnce();
    expect(f.entries[f.index].url).toBe('/dev.html');
    expect(f.entries).toHaveLength(3);
    expect(f.index).toBe(1);
    f.win.history.back();
    expect(onBack).toHaveBeenCalledOnce();
    expect(f.entries[f.index].url).toBe('/prev');
  });

  it('closing by other means pops the sentinel and clears the hash without pushing', () => {
    const f = fakeWindow('#contact');
    const h = new DeepLinkHistory(() => {}, f.win);
    h.sync('contact');
    h.sync(null);
    expect(f.index).toBe(1);
    expect(f.entries[1].url).toBe('/dev.html');
    expect(f.entries).toHaveLength(3);
    f.win.history.back();
    expect(f.entries[f.index].url).toBe('/prev');
  });

  it('reloading on the sentinel entry reuses it instead of stacking another', () => {
    const f = fakeWindow('#about', { portfolioDeepLink: true });
    const onBack = vi.fn(() => h.sync(null));
    const h = new DeepLinkHistory(onBack, f.win);
    h.sync('about');
    expect(f.entries).toHaveLength(2);
    f.win.history.back();
    expect(onBack).toHaveBeenCalledOnce();
  });
});

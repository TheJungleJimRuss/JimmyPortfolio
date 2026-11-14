import { describe, it, expect } from 'vitest';
import { PLACEHOLDER, PROJECTS, SLOT_LIMITS, type ProjectEntry, type ProjectSlots } from '../data/projects';
import {
  explorerBreadcrumbs,
  explorerRows,
  findProject,
  projectWindowId,
  SIDEBAR_ITEMS,
  slugFromWindowId,
  validateSlots,
  visibleSlots,
} from './ProjectModel';

const ORDER = ['controlsNotes', 'category', 'title', 'tags', 'summary', 'links', 'specs', 'deepDive', 'challenges'];

describe('project data', () => {
  it('has the four projects with fixed slugs and names', () => {
    expect(PROJECTS.map((p) => p.slug)).toEqual([
      'kinematic-character-controller',
      'drone-desktop',
      'photography-portfolio',
      'music-studio-website',
    ]);
    expect(PROJECTS.map((p) => p.name)).toEqual([
      'Kinematic Character Controller',
      'Drone Desktop',
      'Photography Portfolio',
      'Music Studio Website',
    ]);
  });
  it('renders every slot, in order, with markers while no copy exists', () => {
    for (const p of PROJECTS) {
      expect(visibleSlots(p.slots).map((s) => s.slot)).toEqual(ORDER);
      expect(validateSlots(p.slots)).toEqual([]);
    }
  });
});

describe('visibleSlots', () => {
  it('renders nothing for an empty record', () => {
    expect(visibleSlots({})).toEqual([]);
  });
  it('hides empty and whitespace-only slots', () => {
    const slots: ProjectSlots = { controlsNotes: '  ', title: '', tags: ['', ' '], specs: [], links: {}, deepDive: {} };
    expect(visibleSlots(slots)).toEqual([]);
  });
  it('keeps the fixed order regardless of which slots are set', () => {
    const slots: ProjectSlots = { challenges: { heading: 'h' }, summary: 's', category: 'c' };
    expect(visibleSlots(slots).map((s) => s.slot)).toEqual(['category', 'summary', 'challenges']);
  });
  it('caps tags at 5', () => {
    const v = visibleSlots({ tags: ['1', '2', '3', '4', '5', '6'] })[0];
    expect(v).toEqual({ slot: 'tags', tags: ['1', '2', '3', '4', '5'] });
  });
  it('shows each link only when present, with fixed labels', () => {
    expect(visibleSlots({ links: { live: 'https://x.test' } })).toEqual([
      { slot: 'links', links: [{ label: 'Live site', url: 'https://x.test' }] },
    ]);
    const both = visibleSlots({ links: { source: 'https://a.test', live: PLACEHOLDER } })[0];
    expect(both).toEqual({
      slot: 'links',
      links: [
        { label: 'Source', url: 'https://a.test' },
        { label: 'Live site', url: null },
      ],
    });
  });
  it('drops fully empty spec rows and caps at 5', () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({ key: `k${i}`, value: 'v' }));
    const v = visibleSlots({ specs: [{ key: '', value: '' }, ...rows] })[0];
    expect(v.slot === 'specs' && v.rows).toHaveLength(5);
  });
  it('shows a write-up with only a heading or only a body', () => {
    expect(visibleSlots({ deepDive: { heading: 'h' } }).map((s) => s.slot)).toEqual(['deepDive']);
    expect(
      visibleSlots({ deepDive: { body: [{ kind: 'code', code: 'x' }] } }).map((s) => s.slot),
    ).toEqual(['deepDive']);
  });
});

describe('validateSlots', () => {
  it('flags over-limit copy but never markers', () => {
    expect(validateSlots({ summary: 'x'.repeat(SLOT_LIMITS.summary + 1) })).toEqual(['summary over 220 characters']);
    expect(validateSlots({ title: 'x'.repeat(41), controlsNotes: 'y'.repeat(121) })).toHaveLength(2);
    expect(validateSlots({ summary: PLACEHOLDER, title: PLACEHOLDER })).toEqual([]);
  });
  it('flags a multi-word category, too many tags, and bad spec counts', () => {
    expect(validateSlots({ category: 'two words' })).toHaveLength(1);
    expect(validateSlots({ tags: ['1', '2', '3', '4', '5', '6'] })).toHaveLength(1);
    expect(validateSlots({ specs: [{ key: 'a', value: 'b' }] })).toHaveLength(1);
  });
});

describe('lookup and ids', () => {
  it('round-trips project window ids', () => {
    expect(projectWindowId('drone-desktop')).toBe('project:drone-desktop');
    expect(slugFromWindowId('project:drone-desktop')).toBe('drone-desktop');
    expect(slugFromWindowId('hero')).toBeNull();
  });
  it('finds a project by slug', () => {
    expect(findProject('drone-desktop')?.name).toBe('Drone Desktop');
    expect(findProject('nope')).toBeUndefined();
    const custom: ProjectEntry[] = [{ slug: 'a', name: 'A', slots: {} }];
    expect(findProject('a', custom)?.name).toBe('A');
  });
});

describe('explorer', () => {
  it('builds shallow breadcrumbs with the last one current', () => {
    expect(explorerBreadcrumbs()).toEqual([
      { label: '~', current: false },
      { label: 'projects', current: true },
    ]);
  });
  it('lists one flat row per project, falling back to the marker for the badge', () => {
    const rows = explorerRows();
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ slug: 'kinematic-character-controller', windowId: 'project:kinematic-character-controller', category: PLACEHOLDER });
    const custom: ProjectEntry[] = [{ slug: 'a', name: 'A', slots: { category: 'Tool' } }, { slug: 'b', name: 'B', slots: {} }];
    expect(explorerRows(custom).map((r) => r.category)).toEqual(['Tool', PLACEHOLDER]);
  });
  it('sidebar: Projects stays in the explorer, About and Contact open windows', () => {
    expect(SIDEBAR_ITEMS.map((i) => i.target)).toEqual([
      { kind: 'explorer' },
      { kind: 'window', id: 'about' },
      { kind: 'window', id: 'contact' },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import {
  applyDraft,
  DRAFT_KEY,
  emptyDraft,
  exportDraft,
  isEmptyDraft,
  linesOrMarker,
  loadDraft,
  resetDraft,
  saveDraft,
  textOrMarker,
  type DraftStorage,
} from './AdminModel';

function memory(): DraftStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe('applyDraft', () => {
  it('merges objects, replaces arrays and primitives, and does not mutate', () => {
    const base = { a: 'x', b: { c: 1, d: [1, 2] }, e: 'keep' };
    const out = applyDraft(base, { a: 'y', b: { d: [9] } });
    expect(out).toEqual({ a: 'y', b: { c: 1, d: [9] }, e: 'keep' });
    expect(base.b.d).toEqual([1, 2]);
  });
  it('returns base for an undefined patch', () => {
    const base = { a: 1 };
    expect(applyDraft(base, undefined)).toBe(base);
  });
});

describe('marker helpers', () => {
  it('restores the marker for blank text and empty lines', () => {
    expect(textOrMarker('  ')).toBe('[ ... ]');
    expect(textOrMarker('hi')).toBe('hi');
    expect(linesOrMarker('\n \n')).toEqual(['[ ... ]']);
    expect(linesOrMarker('a\n\n b ')).toEqual(['a', 'b']);
  });
});

describe('draft storage', () => {
  it('round-trips and resets', () => {
    const s = memory();
    const d = { ...emptyDraft(), contact: { heading: 'h' } };
    saveDraft(s, d);
    expect(loadDraft(s)).toEqual(d);
    resetDraft(s);
    expect(isEmptyDraft(loadDraft(s))).toBe(true);
  });
  it('ignores corrupt or wrong-version entries', () => {
    const s = memory();
    s.map.set(DRAFT_KEY, '{nope');
    expect(loadDraft(s)).toEqual(emptyDraft());
    s.map.set(DRAFT_KEY, JSON.stringify({ version: 2 }));
    expect(loadDraft(s)).toEqual(emptyDraft());
  });
});

describe('exportDraft', () => {
  const base = { about: { heading: 'a', bio: 'b' }, contact: { heading: 'c' }, projects: { p: { title: 't', summary: 's' } } };
  it('exports only touched sections, merged over the base', () => {
    const out = exportDraft({ version: 1, projects: { p: { title: 'new' } } }, base);
    expect(out.about).toBe('');
    expect(out.contact).toBe('');
    expect(out.projects).toContain('// p:');
    expect(out.projects).toContain('"title": "new"');
    expect(out.projects).toContain('"summary": "s"');
  });
  it('writes typed consts for About and Contact', () => {
    const out = exportDraft({ version: 1, about: { heading: 'H' }, contact: { heading: 'C' } }, base);
    expect(out.about).toMatch(/^export const ABOUT: AboutSlots = /);
    expect(out.about).toContain('"bio": "b"');
    expect(out.contact).toMatch(/^export const CONTACT: ContactSlots = /);
  });
});

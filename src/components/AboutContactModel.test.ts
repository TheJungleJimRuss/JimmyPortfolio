import { describe, it, expect, vi } from 'vitest';
import { ABOUT, ABOUT_LIMITS, type AboutSlots } from '../data/about';
import { GITHUB_URL, type ContactSlots } from '../data/contact';
import { PLACEHOLDER } from '../data/projects';
import {
  aboutVisible,
  contactView,
  copyText,
  isRealUrl,
  validateAbout,
  validateContact,
} from './AboutContactModel';

const w = (n: number) => Array.from({ length: n }, () => 'w').join(' ');

describe('about data', () => {
  it('renders every slot in order', () => {
    expect(aboutVisible(ABOUT).map((s) => s.slot)).toEqual(['heading', 'bio', 'secondary', 'stack', 'copyright']);
    expect(ABOUT.stack!.length).toBeGreaterThanOrEqual(ABOUT_LIMITS.groupsMin);
  });
  it('hides empty slots and caps groups and tags', () => {
    const slots: AboutSlots = {
      heading: '  ',
      stack: Array.from({ length: 6 }, (_, i) => ({ label: `g${i}`, tags: Array.from({ length: 9 }, (_, j) => `t${j}`) })),
    };
    const out = aboutVisible(slots);
    expect(out.map((s) => s.slot)).toEqual(['stack']);
    const stack = out[0] as Extract<(typeof out)[number], { slot: 'stack' }>;
    expect(stack.groups).toHaveLength(ABOUT_LIMITS.groupsMax);
    expect(stack.groups[0].tags).toHaveLength(ABOUT_LIMITS.tagsPerGroup);
  });
});

describe('validateAbout', () => {
  it('flags heading, word counts and group counts', () => {
    expect(validateAbout({ heading: 'x'.repeat(41) })).toHaveLength(1);
    expect(validateAbout({ bio: w(59) })).toHaveLength(1);
    expect(validateAbout({ bio: w(60), secondary: w(80) })).toEqual([]);
    expect(validateAbout({ secondary: w(81) })).toHaveLength(1);
    expect(validateAbout({ stack: [{ label: 'a', tags: [] }] })).toHaveLength(1);
    expect(validateAbout({ stack: [{ label: 'a', tags: Array(7).fill('t') }, { label: 'b', tags: [] }] })).toHaveLength(1);
  });
});

describe('contactView', () => {
  it('disables Copy with the marker and shows GitHub as a fixed link', () => {
    const v = contactView({ heading: PLACEHOLDER, email: PLACEHOLDER, copyLabel: PLACEHOLDER, linkedinUrl: PLACEHOLDER, linkedinLabel: PLACEHOLDER });
    expect(v.copy.enabled).toBe(false);
    expect(v.github).toEqual({ label: 'GitHub', url: GITHUB_URL });
    expect(v.linkedin).toEqual({ label: PLACEHOLDER, url: null });
    expect(v.heading).toBe(PLACEHOLDER);
  });
  it('enables Copy for a real value and links a real LinkedIn URL', () => {
    const slots: ContactSlots = { email: 'a@b.test', linkedinUrl: 'https://example.test/in/x', linkedinLabel: 'L' };
    const v = contactView(slots);
    expect(v.copy.enabled).toBe(true);
    expect(v.linkedin).toEqual({ label: 'L', url: 'https://example.test/in/x' });
  });
  it('never links non-http URLs and omits an empty LinkedIn', () => {
    expect(contactView({ linkedinUrl: 'javascript:alert(1)', linkedinLabel: 'L' }).linkedin?.url).toBeNull();
    expect(contactView({}).linkedin).toBeUndefined();
    expect(isRealUrl(PLACEHOLDER)).toBe(false);
  });
  it('validates limits', () => {
    expect(validateContact({ heading: 'x'.repeat(41), callToAction: 'y'.repeat(201) })).toHaveLength(2);
  });
});

describe('copyText', () => {
  it('uses the clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await copyText('t', { writeText })).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('t');
  });
  it('falls back to the legacy path when the API is missing or rejects', async () => {
    const legacy = vi.fn().mockReturnValue(true);
    expect(await copyText('t', { writeText: undefined, legacy })).toBe('copied');
    expect(await copyText('t', { writeText: () => Promise.reject(new Error('no')), legacy })).toBe('copied');
    expect(legacy).toHaveBeenCalledTimes(2);
  });
  it('reports failure when both paths fail', async () => {
    expect(await copyText('t', { writeText: undefined, legacy: () => false })).toBe('failed');
    expect(await copyText('t', { writeText: undefined, legacy: () => { throw new Error('x'); } })).toBe('failed');
  });
});

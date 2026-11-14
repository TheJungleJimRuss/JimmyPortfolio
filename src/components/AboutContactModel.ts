import { ABOUT_LIMITS, type AboutSlots, type StackGroup } from '../data/about';
import { CONTACT_LIMITS, GITHUB_URL, type ContactSlots } from '../data/contact';
import { PLACEHOLDER } from '../data/projects';

const present = (s: string | undefined): s is string => s !== undefined && s.trim() !== '';
const isMarker = (s: string | undefined): boolean => (s ?? '').trim() === PLACEHOLDER;
const words = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

export type AboutView =
  | { slot: 'heading' | 'bio' | 'secondary' | 'copyright'; text: string }
  | { slot: 'stack'; groups: StackGroup[] };

/** The About slots that render, in order: heading, bio, secondary, Stack, copyright. Empty slots are left out. */
export function aboutVisible(slots: AboutSlots): AboutView[] {
  const out: AboutView[] = [];
  if (present(slots.heading)) out.push({ slot: 'heading', text: slots.heading });
  if (present(slots.bio)) out.push({ slot: 'bio', text: slots.bio });
  if (present(slots.secondary)) out.push({ slot: 'secondary', text: slots.secondary });
  const groups = (slots.stack ?? [])
    .slice(0, ABOUT_LIMITS.groupsMax)
    .map((g) => ({ label: g.label, tags: g.tags.filter(present).slice(0, ABOUT_LIMITS.tagsPerGroup) }))
    .filter((g) => present(g.label) || g.tags.length > 0);
  if (groups.length > 0) out.push({ slot: 'stack', groups });
  if (present(slots.copyright)) out.push({ slot: 'copyright', text: slots.copyright });
  return out;
}

/** Human-readable limit violations in About `slots`. Placeholders never violate. */
export function validateAbout(slots: AboutSlots): string[] {
  const issues: string[] = [];
  const heading = slots.heading ?? '';
  if (!isMarker(heading) && heading.length > ABOUT_LIMITS.heading) issues.push(`heading over ${ABOUT_LIMITS.heading} characters`);
  for (const [name, text, min, max] of [
    ['bio', slots.bio, ABOUT_LIMITS.bioMin, ABOUT_LIMITS.bioMax],
    ['secondary', slots.secondary, ABOUT_LIMITS.secondaryMin, ABOUT_LIMITS.secondaryMax],
  ] as const) {
    if (!present(text) || isMarker(text)) continue;
    const n = words(text);
    if (n < min || n > max) issues.push(`${name} must be ${min} to ${max} words (has ${n})`);
  }
  if (slots.stack) {
    const n = slots.stack.length;
    if (n < ABOUT_LIMITS.groupsMin || n > ABOUT_LIMITS.groupsMax) {
      issues.push(`stack must have ${ABOUT_LIMITS.groupsMin} to ${ABOUT_LIMITS.groupsMax} groups`);
    }
    for (const g of slots.stack) {
      if (g.tags.length > ABOUT_LIMITS.tagsPerGroup) issues.push(`stack group over ${ABOUT_LIMITS.tagsPerGroup} tags`);
    }
  }
  return issues;
}

export interface ContactLink {
  label: string;
  /** `null` renders the label as plain text (placeholder URL), not an anchor. */
  url: string | null;
}

export interface ContactView {
  heading?: string;
  callToAction?: string;
  copy: { label: string; email: string; enabled: boolean };
  github: ContactLink;
  linkedin?: ContactLink;
}

/** Only an http(s) URL becomes an anchor. */
export function isRealUrl(value: string | undefined): boolean {
  if (!present(value) || isMarker(value)) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** What the Contact window shows. The Copy button is enabled only with a real email value; no mailto anywhere. */
export function contactView(slots: ContactSlots): ContactView {
  const email = slots.email ?? '';
  const view: ContactView = {
    copy: {
      label: present(slots.copyLabel) ? slots.copyLabel : PLACEHOLDER,
      email,
      enabled: present(email) && !isMarker(email),
    },
    github: { label: 'GitHub', url: GITHUB_URL },
  };
  if (present(slots.heading)) view.heading = slots.heading;
  if (present(slots.callToAction)) view.callToAction = slots.callToAction;
  if (present(slots.linkedinLabel) || present(slots.linkedinUrl)) {
    view.linkedin = {
      label: present(slots.linkedinLabel) ? slots.linkedinLabel : 'LinkedIn',
      url: isRealUrl(slots.linkedinUrl) ? slots.linkedinUrl! : null,
    };
  }
  return view;
}

/** Human-readable limit violations in Contact `slots`. Placeholders never violate. */
export function validateContact(slots: ContactSlots): string[] {
  const issues: string[] = [];
  const h = slots.heading ?? '';
  if (!isMarker(h) && h.length > CONTACT_LIMITS.heading) issues.push(`heading over ${CONTACT_LIMITS.heading} characters`);
  const c = slots.callToAction ?? '';
  if (!isMarker(c) && c.length > CONTACT_LIMITS.callToAction) issues.push(`callToAction over ${CONTACT_LIMITS.callToAction} characters`);
  return issues;
}

export type CopyOutcome = 'copied' | 'failed';

/**
 * Copies `text` with the Async Clipboard API, falling back to a hidden textarea and `execCommand`
 * when the API is missing or rejects (insecure context, denied permission).
 */
export async function copyText(
  text: string,
  deps: {
    writeText?: (t: string) => Promise<void>;
    legacy?: (t: string) => boolean;
  } = {},
): Promise<CopyOutcome> {
  const writeText = 'writeText' in deps ? deps.writeText : globalThis.navigator?.clipboard?.writeText.bind(navigator.clipboard);
  if (writeText) {
    try {
      await writeText(text);
      return 'copied';
    } catch {
      // fall through to the legacy path
    }
  }
  const legacy = deps.legacy ?? legacyCopy;
  try {
    return legacy(text) ? 'copied' : 'failed';
  } catch {
    return 'failed';
  }
}

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const field = Object.assign(document.createElement('textarea'), { value: text });
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
  document.body.append(field);
  field.select();
  try {
    return document.execCommand('copy');
  } finally {
    field.remove();
  }
}

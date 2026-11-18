/**
 * Admin mode model: the draft shape, merge, storage and export. Pure (no DOM), so it is unit-tested.
 * Never generates copy: it only carries text the owner typed.
 */
import type { AboutSlots } from '../data/about';
import type { ContactSlots } from '../data/contact';
import { PLACEHOLDER, type ProjectSlots } from '../data/projects';

export const DRAFT_KEY = 'portfolio-admin-draft-v1';

export interface AdminDraft {
  version: 1;
  about?: AboutSlots;
  contact?: ContactSlots;
  /** Keyed by ProjectEntry.slug. */
  projects?: Record<string, ProjectSlots>;
}

export const emptyDraft = (): AdminDraft => ({ version: 1 });

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Applies `patch` over `base`: plain objects merge key by key; arrays and primitives replace. Never mutates. */
export function applyDraft<T>(base: T, patch: unknown): T {
  if (patch === undefined) return base;
  if (isPlain(base) && isPlain(patch)) {
    const out: Record<string, unknown> = { ...base };
    for (const key of Object.keys(patch)) out[key] = applyDraft(out[key], patch[key]);
    return out as T;
  }
  return patch as T;
}

/** An emptied slot goes back to the `[ ... ]` marker. */
export function textOrMarker(value: string): string {
  return value.trim() === '' ? PLACEHOLDER : value;
}

/** One tag/line per row; blank rows are dropped; no rows left means the marker. */
export function linesOrMarker(value: string): string[] {
  const lines = value.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [PLACEHOLDER];
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Reads the draft; a missing, corrupt or wrong-version entry yields an empty draft. */
export function loadDraft(storage: DraftStorage): AdminDraft {
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    const parsed: unknown = JSON.parse(raw);
    if (isPlain(parsed) && parsed.version === 1) return parsed as unknown as AdminDraft;
  } catch {
    /* fall through */
  }
  return emptyDraft();
}

export function saveDraft(storage: DraftStorage, draft: AdminDraft): void {
  storage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function resetDraft(storage: DraftStorage): void {
  storage.removeItem(DRAFT_KEY);
}

export function isEmptyDraft(draft: AdminDraft): boolean {
  return draft.about === undefined && draft.contact === undefined && Object.keys(draft.projects ?? {}).length === 0;
}

const literal = (value: unknown): string => JSON.stringify(value, null, 2);

export interface ExportedDraft {
  about: string;
  contact: string;
  projects: string;
}

/**
 * TypeScript source for the edited slots, ready to paste over the matching const in `src/data/`.
 * `base*` are the committed values; the draft is applied on top so the snippet is complete. A section the
 * draft did not touch exports as an empty string.
 */
export function exportDraft(
  draft: AdminDraft,
  base: { about: AboutSlots; contact: ContactSlots; projects: Record<string, ProjectSlots> },
): ExportedDraft {
  const about = draft.about ? `export const ABOUT: AboutSlots = ${literal(applyDraft(base.about, draft.about))};\n` : '';
  const contact = draft.contact ? `export const CONTACT: ContactSlots = ${literal(applyDraft(base.contact, draft.contact))};\n` : '';
  const projects = Object.entries(draft.projects ?? {})
    .map(([slug, slots]) => `// ${slug}: replace this project's \`slots:\`\nslots: ${literal(applyDraft(base.projects[slug] ?? {}, slots))},\n`)
    .join('\n');
  return { about, contact, projects };
}

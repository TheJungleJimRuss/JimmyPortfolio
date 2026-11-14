import {
  PLACEHOLDER,
  PROJECTS,
  SLOT_LIMITS,
  type ProjectEntry,
  type ProjectSlots,
  type StageSpec,
  type WriteUp,
} from '../data/projects';
import type { DesktopLayout, StageState, WindowId } from './DesktopState';

export function projectWindowId(slug: string): WindowId {
  return `project:${slug}`;
}

export function slugFromWindowId(id: WindowId): string | null {
  return id.startsWith('project:') ? id.slice('project:'.length) : null;
}

export function findProject(slug: string, projects: readonly ProjectEntry[] = PROJECTS): ProjectEntry | undefined {
  return projects.find((p) => p.slug === slug);
}

export function isPlaceholder(value: string): boolean {
  return value.trim() === PLACEHOLDER;
}

const present = (s: string | undefined): s is string => s !== undefined && s.trim() !== '';

export type SlotView =
  | { slot: 'controlsNotes' | 'category' | 'title' | 'summary'; text: string }
  | { slot: 'tags'; tags: string[] }
  | { slot: 'links'; links: { label: 'Source' | 'Live site'; url: string | null }[] }
  | { slot: 'specs'; rows: { key: string; value: string }[] }
  | { slot: 'deepDive' | 'challenges'; writeUp: WriteUp };

/** Link labels are fixed copy; a placeholder URL renders as a marker, not an anchor (`url: null`). */
const LINK_LABELS = [
  ['source', 'Source'],
  ['live', 'Live site'],
] as const;

function writeUpVisible(w: WriteUp | undefined): w is WriteUp {
  return !!w && (present(w.heading) || (w.body?.length ?? 0) > 0);
}

/**
 * The slots that render, in the fixed order: controls notes, category badge, title, tech tags,
 * summary, links, spec list, Deep dive, Challenges. Empty or absent slots are left out.
 */
export function visibleSlots(slots: ProjectSlots): SlotView[] {
  const out: SlotView[] = [];
  if (present(slots.controlsNotes)) out.push({ slot: 'controlsNotes', text: slots.controlsNotes });
  if (present(slots.category)) out.push({ slot: 'category', text: slots.category });
  if (present(slots.title)) out.push({ slot: 'title', text: slots.title });
  const tags = (slots.tags ?? []).filter(present).slice(0, SLOT_LIMITS.tags);
  if (tags.length > 0) out.push({ slot: 'tags', tags });
  if (present(slots.summary)) out.push({ slot: 'summary', text: slots.summary });
  const links = LINK_LABELS.flatMap(([key, label]) => {
    const url = slots.links?.[key];
    return present(url) ? [{ label, url: isPlaceholder(url) ? null : url }] : [];
  });
  if (links.length > 0) out.push({ slot: 'links', links });
  const rows = (slots.specs ?? []).filter((r) => present(r.key) || present(r.value)).slice(0, SLOT_LIMITS.specsMax);
  if (rows.length > 0) out.push({ slot: 'specs', rows });
  if (writeUpVisible(slots.deepDive)) out.push({ slot: 'deepDive', writeUp: slots.deepDive });
  if (writeUpVisible(slots.challenges)) out.push({ slot: 'challenges', writeUp: slots.challenges });
  return out;
}

const overLength = (s: string | undefined, max: number) => !isPlaceholder(s ?? '') && (s ?? '').length > max;

/** Human-readable limit violations in `slots`, for the owner filling in copy. Placeholders never violate. */
export function validateSlots(slots: ProjectSlots): string[] {
  const issues: string[] = [];
  if (overLength(slots.controlsNotes, SLOT_LIMITS.controlsNotes)) issues.push(`controlsNotes over ${SLOT_LIMITS.controlsNotes} characters`);
  const category = slots.category ?? '';
  if (!isPlaceholder(category) && category.trim().split(/\s+/).filter(Boolean).length > SLOT_LIMITS.category) issues.push('category is more than one word');
  if (overLength(slots.title, SLOT_LIMITS.title)) issues.push(`title over ${SLOT_LIMITS.title} characters`);
  if ((slots.tags?.length ?? 0) > SLOT_LIMITS.tags) issues.push(`tags over ${SLOT_LIMITS.tags} items`);
  if (overLength(slots.summary, SLOT_LIMITS.summary)) issues.push(`summary over ${SLOT_LIMITS.summary} characters`);
  if (slots.specs && (slots.specs.length < SLOT_LIMITS.specsMin || slots.specs.length > SLOT_LIMITS.specsMax)) {
    issues.push(`specs must have ${SLOT_LIMITS.specsMin} to ${SLOT_LIMITS.specsMax} rows`);
  }
  for (const [name, w] of [['deepDive', slots.deepDive], ['challenges', slots.challenges]] as const) {
    if (overLength(w?.heading, SLOT_LIMITS.heading)) issues.push(`${name} heading over ${SLOT_LIMITS.heading} characters`);
  }
  return issues;
}

export interface Crumb {
  label: string;
  /** The current location is not a link. */
  current: boolean;
}

/** Shallow breadcrumbs for the File Explorer: `~ / projects`. The explorer has no deeper folders. */
export function explorerBreadcrumbs(): Crumb[] {
  return [
    { label: '~', current: false },
    { label: 'projects', current: true },
  ];
}

export interface ExplorerRow {
  slug: string;
  name: string;
  windowId: WindowId;
  /** Category badge text, or the marker when the owner has not written one. */
  category: string;
}

/** One flat row per project, in data order. */
export function explorerRows(projects: readonly ProjectEntry[] = PROJECTS): ExplorerRow[] {
  return projects.map((p) => ({
    slug: p.slug,
    name: p.name,
    windowId: projectWindowId(p.slug),
    category: present(p.slots.category) ? p.slots.category : PLACEHOLDER,
  }));
}

export type SidebarTarget = { kind: 'explorer' } | { kind: 'window'; id: WindowId };

export interface SidebarItem {
  label: string;
  target: SidebarTarget;
}

/** Sidebar: Projects navigates inside the explorer; About and Contact open their own windows. */
export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { label: 'Projects', target: { kind: 'explorer' } },
  { label: 'About', target: { kind: 'window', id: 'about' } },
  { label: 'Contact', target: { kind: 'window', id: 'contact' } },
];

/** Fixed chrome labels for stage links. */
export const STAGE_LINK_LABELS = { visit: 'Visit site', open: 'Open live site' } as const;

export interface StageLink {
  label: string;
  url: string;
}

/** Fixed chrome labels for the keyboard hint. */
export const KEYBOARD_HINT = { game: 'Keyboard: game', desktop: 'Keyboard: desktop' } as const;
export type KeyboardOwner = keyof typeof KEYBOARD_HINT;

/** The game owns the keyboard only while the stage iframe is the focused element. */
export function keyboardOwner(stageFrameFocused: boolean): KeyboardOwner {
  return stageFrameFocused ? 'game' : 'desktop';
}

/** What the browser and the host allow, as far as the stage can tell. Defaults are the optimistic case. */
export interface StageEnv {
  webgl2: boolean;
  /** The build failed to load or the host failed the size/compression rule: use the video. */
  buildFailed: boolean;
}

export const DEFAULT_STAGE_ENV: StageEnv = { webgl2: true, buildFailed: false };

export type VideoReason = 'phone' | 'no-webgl2' | 'build-unavailable';

/** What the stage area renders. Pure: the reducer owns the lifecycle, this only maps it to a view. */
export type StageView =
  | {
      kind: 'poster';
      /** Show the "Load" target (dispatches `loadStage`). */
      canLoad: boolean;
      /** Show the `[ ... ]` coming-soon slot (a medium whose build does not exist yet). */
      comingSoon: boolean;
      /** New-tab link (phones never embed). */
      link: StageLink | null;
    }
  | { kind: 'iframe'; url: string; link: StageLink }
  /** Unity build in a same-origin iframe; `buildPath` is relative to the site base. */
  | { kind: 'unity'; buildPath: string; maxBuildMB: number }
  /** Gameplay video slot. `videoUrl` null = no source yet: only the `[ ... ]` slot shows. */
  | { kind: 'video'; videoUrl: string | null; reason: VideoReason }
  /** Minimized after loading: the iframe is removed (resume reloads it on restore). */
  | { kind: 'paused' }
  | { kind: 'in-progress' };

export function stageView(
  stage: StageSpec,
  state: StageState | undefined,
  layout: DesktopLayout,
  env: StageEnv = DEFAULT_STAGE_ENV,
): StageView {
  if (stage.medium === 'in-progress') return { kind: 'in-progress' };
  if (stage.medium === 'unity-webgl') {
    const videoUrl = present(stage.videoUrl) ? stage.videoUrl.trim() : null;
    if (layout === 'phone') return { kind: 'video', videoUrl, reason: 'phone' };
    if (!env.webgl2) return { kind: 'video', videoUrl, reason: 'no-webgl2' };
    if (!present(stage.buildPath)) return { kind: 'poster', canLoad: false, comingSoon: true, link: null };
    if (state === 'loaded' && env.buildFailed) return { kind: 'video', videoUrl, reason: 'build-unavailable' };
    if (state === 'loaded') return { kind: 'unity', buildPath: stage.buildPath.trim(), maxBuildMB: stage.maxBuildMB };
    if (state === 'paused') return { kind: 'paused' };
    return { kind: 'poster', canLoad: true, comingSoon: false, link: null };
  }
  if (layout === 'phone') {
    return { kind: 'poster', canLoad: false, comingSoon: false, link: { label: STAGE_LINK_LABELS.open, url: stage.url } };
  }
  if (state === 'loaded') return { kind: 'iframe', url: stage.url, link: { label: STAGE_LINK_LABELS.visit, url: stage.url } };
  if (state === 'paused') return { kind: 'paused' };
  return { kind: 'poster', canLoad: true, comingSoon: false, link: null };
}

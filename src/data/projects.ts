/**
 * Project data: the four projects and the optional slots of each Project window.
 * Every text value is the owner's copy. Until it is written, each slot holds the `[ ... ]` marker.
 * Replace a marker with real copy; delete a slot to hide it.
 */

/** Marker shown for any slot that has no copy yet (AGENTS.md: keep `[ ... ]` markers). */
export const PLACEHOLDER = '[ ... ]';

/** Documented slot limits (spec: Windows and content). Enforced by `validateSlots`, not by truncation. */
export const SLOT_LIMITS = {
  controlsNotes: 120, // characters
  category: 1, // words (one-word badge)
  title: 40, // characters
  tags: 5, // items
  summary: 220, // characters
  specsMin: 3, // key/value rows
  specsMax: 5,
  heading: 40, // characters, for Deep dive and Challenges headings
} as const;

/** Inline run of a write-up paragraph or bullet: plain text or inline code. */
export type Inline = { text: string } | { code: string };

/** Write-up body block as plain data: paragraphs, bullets, short code blocks. No images. */
export type WriteUpBlock =
  | { kind: 'paragraph'; content: Inline[] }
  | { kind: 'bullets'; items: Inline[][] }
  | { kind: 'code'; code: string };

export interface WriteUp {
  /** Heading text (Deep dive's is fixed by the spec; Challenges' is user-titled). */
  heading?: string;
  body?: WriteUpBlock[];
}

export interface SpecRow {
  key: string;
  value: string;
}

/** Link targets. The labels ("Source", "Live site") are fixed; each link is hidden when its URL is absent. */
export interface ProjectLinks {
  source?: string;
  live?: string;
}

/** All fields optional; an absent or empty slot does not render. */
export interface ProjectSlots {
  controlsNotes?: string;
  category?: string;
  title?: string;
  tags?: string[];
  summary?: string;
  links?: ProjectLinks;
  specs?: SpecRow[];
  deepDive?: WriteUp;
  challenges?: WriteUp;
}

/**
 * What the Project stage shows. `iframe` loads a live site on click; `unity-webgl` is the Unity build;
 * `in-progress` is the structural placeholder for a project that has no embeddable build yet.
 *
 * `unity-webgl` fields:
 * - `buildPath`: the build's page, relative to the site base (resolved against the page URL, never root-absolute).
 *   Empty string = no build yet (poster + `[ ... ]` only).
 * - `videoUrl`: gameplay video for phones, browsers without WebGL 2, and builds that cannot load. Empty = only the
 *   `[ ... ]` slot shows (no `src`). Set it to a file or URL once the video exists.
 * - `maxBuildMB`: budget for the build's compressed transfer size (spec: 15 MB Brotli). A host that sends no
 *   `Content-Encoding` for the large files, or whose reported sizes exceed this, uses the video instead.
 */
export type StageSpec =
  | { medium: 'iframe'; url: string }
  | { medium: 'unity-webgl'; buildPath: string; videoUrl: string; maxBuildMB: number }
  | { medium: 'in-progress' };

export interface ProjectEntry {
  slug: string;
  /** Project name shown in the File Explorer. */
  name: string;
  stage: StageSpec;
  slots: ProjectSlots;
}

const marker: Inline[] = [{ text: PLACEHOLDER }];

function placeholderSlots(): ProjectSlots {
  return {
    controlsNotes: PLACEHOLDER,
    category: PLACEHOLDER,
    title: PLACEHOLDER,
    tags: [PLACEHOLDER],
    summary: PLACEHOLDER,
    links: { source: PLACEHOLDER, live: PLACEHOLDER },
    specs: [
      { key: PLACEHOLDER, value: PLACEHOLDER },
      { key: PLACEHOLDER, value: PLACEHOLDER },
      { key: PLACEHOLDER, value: PLACEHOLDER },
    ],
    deepDive: { heading: PLACEHOLDER, body: [{ kind: 'paragraph', content: marker }] },
    challenges: { heading: PLACEHOLDER, body: [{ kind: 'paragraph', content: marker }] },
  };
}

export const PROJECTS: readonly ProjectEntry[] = [
  { slug: 'kinematic-character-controller', name: 'Kinematic Character Controller', stage: { medium: 'unity-webgl', buildPath: 'kcc/index.html', videoUrl: '', maxBuildMB: 15 }, slots: placeholderSlots() },
  { slug: 'drone-desktop', name: 'Drone Desktop', stage: { medium: 'in-progress' }, slots: placeholderSlots() },
  { slug: 'photography-portfolio', name: 'Photography Portfolio', stage: { medium: 'iframe', url: 'https://thejunglejimruss.github.io/Photography-Portfolio/' }, slots: placeholderSlots() },
  { slug: 'music-studio-website', name: 'Music Studio Website', stage: { medium: 'iframe', url: 'https://thejunglejimruss.github.io/AlcoveSite/' }, slots: placeholderSlots() },
];

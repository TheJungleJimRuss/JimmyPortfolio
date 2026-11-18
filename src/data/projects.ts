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

export const PROJECTS: readonly ProjectEntry[] = [
  { slug: 'kinematic-character-controller', name: 'Kinematic Character Controller', stage: { medium: 'unity-webgl', buildPath: 'kcc/index.html', videoUrl: '', maxBuildMB: 15 }, slots: {
  "controlsNotes": "WASD to move, Space to jump, mouse to look.",
  "category": "Game",
  "title": "Kinematic Character Controller",
  "tags": [
    "Unity",
    "C#",
    "Physics",
    "WebGL"
  ],
  "summary": "I built this character controller for Unity by hand in C#. It uses Kasper Faureby's collide and slide algorithm for collision. I had to freshen up my math skills to complete this project; linear algebra had me beat a couple times. It has support for moving platforms, and handles tight corners and complex geometry well.",
  "links": {
    "source": "https://github.com/TheJungleJimRuss/Kinematic-Unity-Character-Controller",
    "live": "[ ... ]"
  },
  "specs": [
    {
      "key": "Engine",
      "value": "Unity 6"
    },
    {
      "key": "Language",
      "value": "C#"
    },
    {
      "key": "Build",
      "value": "WebGL, under 15 MB"
    },
    {
      "key": "Role",
      "value": "Solo"
    }
  ],
  "deepDive": {
    "heading": "Deep dive",
    "body": [
      {
        "kind": "paragraph",
        "content": [
          {
            "text": "Sample text. The controller moves by sweeping a capsule and sliding along what it hits."
          }
        ]
      },
      {
        "kind": "bullets",
        "items": [
          [
            {
              "text": "Ground snapping keeps steps and slopes smooth."
            }
          ],
          [
            {
              "text": "Moving platforms pass their velocity to the player."
            }
          ]
        ]
      }
    ]
  },
  "challenges": {
    "heading": "What went wrong",
    "body": [
      {
        "kind": "paragraph",
        "content": [
          {
            "text": "Sample text. Jitter on slopes came from fighting the physics step; moving the sweep to a fixed update fixed it."
          }
        ]
      }
    ]
  }
} },
  { slug: 'drone-desktop', name: 'Drone Desktop', stage: { medium: 'in-progress' }, slots: {
  "controlsNotes": "Sample: not playable yet.",
  "category": "Concept",
  "title": "Drone Desktop",
  "tags": [
    "HTML",
    "CSS",
    "JavaScript"
  ],
  "summary": "A comprehensive tool to keep track of everything needed as a drone pilot all in one place.",
  "links": {
    "source": "https://github.com/TheJungleJimRuss/DroneDesktop",
    "live": "https://thejunglejimruss.github.io/DroneDesktop/"
  },
  "specs": [
    {
      "key": "Stack",
      "value": "Vite + Three.js"
    },
    {
      "key": "Status",
      "value": "In progress"
    },
    {
      "key": "Role",
      "value": "Solo"
    }
  ],
  "deepDive": {
    "heading": "Deep dive",
    "body": [
      {
        "kind": "paragraph",
        "content": [
          {
            "text": "Sample text. The throttle input drives motor audio and camera altitude together."
          }
        ]
      },
      {
        "kind": "bullets",
        "items": [
          [
            {
              "text": "Scroll maps to altitude."
            }
          ]
        ]
      }
    ]
  },
  "challenges": {
    "heading": "What went wrong",
    "body": [
      {
        "kind": "paragraph",
        "content": [
          {
            "text": "Sample text. Keeping the 3D scene light enough for phones is the open problem."
          }
        ]
      }
    ]
  }
} },
  { slug: 'photography-portfolio', name: 'Photography Portfolio', stage: { medium: 'iframe', url: 'https://thejunglejimruss.github.io/Photography-Portfolio/' }, slots: {
  "controlsNotes": "scroll and click through the gallery.",
  "category": "Web",
  "title": "Photography Portfolio",
  "tags": [
    "HTML",
    "CSS",
    "JavaScript"
  ],
  "summary": "An image first portfolio site for a commercial and wedding photographer.",
  "links": {
    "source": "https://github.com/TheJungleJimRuss/Photography-Portfolio/",
    "live": "https://thejunglejimruss.github.io/Photography-Portfolio/"
  },
  "specs": [
    {
      "key": "Stack",
      "value": "Vanilla web"
    },
    {
      "key": "Hosting",
      "value": "GitHub Pages"
    },
    {
      "key": "Role",
      "value": "Design and build"
    }
  ],
  "deepDive": {
    "heading": "Deep dive",
    "body": [
      {
        "kind": "paragraph",
        "content": [
          {
            "text": "Sample text. Images are sized and lazy-loaded so the first screen paints quickly."
          }
        ]
      },
      {
        "kind": "bullets",
        "items": [
          [
            {
              "text": "The grid adapts from one to four columns."
            }
          ]
        ]
      }
    ]
  },
  "challenges": {
    "heading": "What went wrong",
    "body": [
      {
        "kind": "paragraph",
        "content": [
          {
            "text": "Sample text. Balancing image quality against load time took several passes."
          }
        ]
      }
    ]
  }
} },
  { slug: 'music-studio-website', name: 'Music Studio Website', stage: { medium: 'iframe', url: 'https://thejunglejimruss.github.io/AlcoveSite/' }, slots: {
  "controlsNotes": "Explore the site",
  "category": "Web",
  "title": "Music Studio Website",
  "tags": [
    "HTML",
    "CSS",
    "JavaScript"
  ],
  "summary": "A creative and friendly site for an indie recording studio and music producer.",
  "links": {
    "source": "https://github.com/TheJungleJimRuss/AlcoveSite/",
    "live": "https://thejunglejimruss.github.io/AlcoveSite/"
  },
  "specs": [
    {
      "key": "Stack",
      "value": "Vanilla web"
    },
    {
      "key": "Hosting",
      "value": "GitHub Pages"
    },
    {
      "key": "Role",
      "value": "Design and build"
    }
  ],
  "deepDive": {
    "heading": "Deep dive",
    "body": [
      {
        "kind": "paragraph",
        "content": [
          {
            "text": "Sample text. The layout puts booking one tap away on every screen size."
          }
        ]
      },
      {
        "kind": "bullets",
        "items": [
          [
            {
              "text": "Gear is listed in plain, scannable groups."
            }
          ]
        ]
      }
    ]
  },
  "challenges": {
    "heading": "What went wrong",
    "body": [
      {
        "kind": "paragraph",
        "content": [
          {
            "text": "Sample text. Making a dark, moody look still pass contrast checks."
          }
        ]
      }
    ]
  }
} },
];

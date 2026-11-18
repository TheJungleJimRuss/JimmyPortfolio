/**
 * About window data: the slots of `~/about`, in render order.
 * Every text value is the owner's copy. Until it is written, each slot holds the `[ ... ]` marker.
 */

/** Documented slot limits (spec: Windows and content). Enforced by `validateAbout`, not by truncation. */
export const ABOUT_LIMITS = {
  heading: 40, // characters
  bioMin: 60, // words
  bioMax: 120,
  secondaryMin: 40, // words
  secondaryMax: 80,
  groupsMin: 2, // Stack tag groups
  groupsMax: 4,
  tagsPerGroup: 6, // short tags per group
} as const;

export interface StackGroup {
  /** Group label the owner names. */
  label: string;
  /** Up to `tagsPerGroup` short tags. */
  tags: string[];
}

/** All fields optional; an absent or empty slot does not render. No portrait photo, no Stack icon. */
export interface AboutSlots {
  heading?: string;
  /** Main bio, about 60 to 120 words. */
  bio?: string;
  /** Secondary paragraph (philosophy), about 40 to 80 words. */
  secondary?: string;
  /** Stack: 2 to 4 tag groups. */
  stack?: StackGroup[];
  /** Small one-line copyright, at the end of the scroll. */
  copyright?: string;
}

export const ABOUT: AboutSlots = {
  "heading": "Sample: About",
  "bio": "I'm a high school student who is an avid developer. My scope covers everything from portfolios & business sites, to web tools, and even video games.\nMy main focus is on site design. I love the design process and finding new and interesting ways to do things. There is something special about the artistic side of sites that makes them feel real and impactful. I find it really fulfilling to start with an idea and end with a finished polished product.",
  "secondary": "Outside of development I also ski, rock climb, make art and music, and pilot drones. These activities give me a set of skills that are very useful. I gain grit and become more detail oriented, precise, and time sensitive. Another big skill is problem solving, which I can apply to every area of my life.",
  "stack": [
    {
      "label": "Languages",
      "tags": [
        "C#",
        "TypeScript",
        "HTML",
        "JavaScript",
        "Java",
        "Python",
        "Lua"
      ]
    },
    {
      "label": "Engines & tools",
      "tags": [
        "Unity",
        "Godot",
        "Three.js",
        "Blender",
        "Vite",
        "React"
      ]
    }
  ],
  "copyright": "© Jimmy Russ"
};

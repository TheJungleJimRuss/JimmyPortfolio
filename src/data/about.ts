/**
 * About window data: the slots of `~/about`, in render order.
 * Every text value is the owner's copy. Until it is written, each slot holds the `[ ... ]` marker.
 */
import { PLACEHOLDER } from './projects';

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
  heading: PLACEHOLDER,
  bio: PLACEHOLDER,
  secondary: PLACEHOLDER,
  stack: [
    { label: PLACEHOLDER, tags: [PLACEHOLDER] },
    { label: PLACEHOLDER, tags: [PLACEHOLDER] },
  ],
  copyright: PLACEHOLDER,
};

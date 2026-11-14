/**
 * Contact window data: the slots of `~/contact`, in render order.
 * Every text value is the owner's copy. Until it is written, each slot holds the `[ ... ]` marker.
 * The email address is a slot value; with the marker the Copy email button is disabled.
 */
import { PLACEHOLDER } from './projects';

/** Documented slot limits (spec: Windows and content). Enforced by `validateContact`, not by truncation. */
export const CONTACT_LIMITS = {
  heading: 40, // characters
  callToAction: 200, // characters (1 to 2 sentences)
} as const;

/** Fixed GitHub profile (opens in a new tab). */
export const GITHUB_URL = 'https://github.com/TheJungleJimRuss';

export interface ContactSlots {
  heading?: string;
  callToAction?: string;
  /** The address the Copy email button copies. Never rendered as a mailto link. */
  email?: string;
  /** Label of the Copy email button. */
  copyLabel?: string;
  /** LinkedIn profile URL; the marker renders the label as plain text. */
  linkedinUrl?: string;
  linkedinLabel?: string;
}

export const CONTACT: ContactSlots = {
  heading: PLACEHOLDER,
  callToAction: PLACEHOLDER,
  email: PLACEHOLDER,
  copyLabel: PLACEHOLDER,
  linkedinUrl: PLACEHOLDER,
  linkedinLabel: PLACEHOLDER,
};

/** Screensaver schedule: pure, clock injected. Kept tiny because it ships in the Desktop's first-load chunk. */
import type { IdleWait, ScreensaverKind } from './Settings';

export interface IdleInputs {
  now: number; // ms
  lastInputAt: number; // ms
  wait: IdleWait; // seconds
  kind: ScreensaverKind;
  stagePlaying: boolean;
  hidden: boolean;
  previewing: boolean;
}

/**
 * `none` and a hidden tab always keep it off. Previewing shows it at once, whatever the wait (an explicit request
 * also beats a playing stage). Otherwise it shows once the wait has passed with no input, unless a stage is playing.
 */
export function screensaverShouldShow(i: IdleInputs): boolean {
  if (i.kind === 'none' || i.hidden) return false;
  if (i.stagePlaying) return false;
  if (i.previewing) return true;
  return i.now - i.lastInputAt >= i.wait * 1000;
}

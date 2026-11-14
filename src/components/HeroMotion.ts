import type { InputMode } from './ViewportLayoutPolicy';

/** Input facts the heroes need; a subset of LayoutDecision so no matchMedia lives in the heroes. */
export interface HeroInputProfile {
  inputMode: InputMode;
  idleDrift: boolean;
  tiltEnabled: boolean;
}

export const DEFAULT_HERO_INPUT_PROFILE: HeroInputProfile = {
  inputMode: 'mouse',
  idleDrift: false,
  tiltEnabled: true,
};

/** Pixel-ratio cap per input mode: lower on touch to keep phones smooth. */
export function pixelRatioCap(mode: InputMode): number {
  return mode === 'touch' ? 1.5 : 2;
}

/** Idle sway amplitude as a fraction of the full tilt range (normalized -1..1 space). */
export const IDLE_SWAY_X = 0.18;
export const IDLE_SWAY_Y = 0.1;
export const IDLE_PERIOD_X_MS = 9000;
export const IDLE_PERIOD_Y_MS = 13000;

/** Slow, subtle, time-based sway so it is independent of frame rate. */
export function idleSway(timeMs: number): { x: number; y: number } {
  return {
    x: IDLE_SWAY_X * Math.sin((2 * Math.PI * timeMs) / IDLE_PERIOD_X_MS),
    y: IDLE_SWAY_Y * Math.sin((2 * Math.PI * timeMs) / IDLE_PERIOD_Y_MS + 1),
  };
}

/** Phone-rotation tilt: degrees of device rotation (from rest) that map to full strength. */
export const ORIENTATION_GAMMA_RANGE_DEG = 22;
export const ORIENTATION_BETA_RANGE_DEG = 18;
/** Share of the full tilt range rotation may use ("slight"). */
export const ORIENTATION_STRENGTH = 0.6;
/** Time constant of the slow re-baseline toward the current pose. */
export const ORIENTATION_REBASE_MS = 6000;

export interface OrientationSample {
  beta: number;
  gamma: number;
}

/** Clamp to +-limit, normalizing -0 to 0. */
const clampUnit = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v)) + 0;

/**
 * Pure mapping from a device pose to normalized tilt (-1..1 space, same as pointer input;
 * heroes apply +y as +pitch after the vertical reversal). Zero at baseline, clamped to
 * ORIENTATION_STRENGTH. screenAngle is screen.orientation.angle (0/90/180/270 or -90).
 */
export function orientationToTilt(
  sample: OrientationSample,
  baseline: OrientationSample,
  screenAngle: number,
): { x: number; y: number } {
  const dBeta = sample.beta - baseline.beta;
  const dGamma = sample.gamma - baseline.gamma;
  const angle = ((Math.round(screenAngle / 90) * 90) % 360 + 360) % 360;
  let sx: number;
  let sy: number;
  switch (angle) {
    case 90: sx = dBeta; sy = -dGamma; break;
    case 180: sx = -dGamma; sy = -dBeta; break;
    case 270: sx = -dBeta; sy = dGamma; break;
    default: sx = dGamma; sy = dBeta;
  }
  // Landscape swaps which device axis feeds which screen axis, so scale by the screen axis range.
  const rx = angle === 90 || angle === 270 ? ORIENTATION_BETA_RANGE_DEG : ORIENTATION_GAMMA_RANGE_DEG;
  const ry = angle === 90 || angle === 270 ? ORIENTATION_GAMMA_RANGE_DEG : ORIENTATION_BETA_RANGE_DEG;
  // Counter-tilt: the hero leans opposite to the way the phone rotates.
  return {
    x: clampUnit((-sx / rx) * ORIENTATION_STRENGTH, ORIENTATION_STRENGTH),
    y: clampUnit((-sy / ry) * ORIENTATION_STRENGTH, ORIENTATION_STRENGTH),
  };
}

export interface OrientationTracker {
  /** Returns tilt for a reading, or null when the reading is invalid (null/NaN). */
  update(sample: OrientationSample | null, screenAngle: number, nowMs: number): { x: number; y: number } | null;
  reset(): void;
}

/** Captures the first valid reading as rest and low-passes the baseline toward the current pose. */
export function createOrientationTracker(): OrientationTracker {
  let baseline: OrientationSample | null = null;
  let lastAngle = 0;
  let lastTime = 0;
  return {
    update(sample, screenAngle, nowMs) {
      if (!sample || !Number.isFinite(sample.beta) || !Number.isFinite(sample.gamma)) return null;
      if (!baseline || screenAngle !== lastAngle) {
        baseline = { ...sample };
      } else {
        const alpha = 1 - Math.exp(-Math.max(0, nowMs - lastTime) / ORIENTATION_REBASE_MS);
        baseline = {
          beta: baseline.beta + (sample.beta - baseline.beta) * alpha,
          gamma: baseline.gamma + (sample.gamma - baseline.gamma) * alpha,
        };
      }
      lastAngle = screenAngle;
      lastTime = nowMs;
      return orientationToTilt(sample, baseline, screenAngle);
    },
    reset() {
      baseline = null;
    },
  };
}

/**
 * Outline trace of the Desktop: pure timing and sequence logic (no DOM).
 * The adapter lives in DesktopTraceView.ts; the Intro sequence drives it, then runs the
 * Hero name trace (HeroOutlineTracer) and the bloom.
 *
 * Order is outside in: Taskbar and icons, File Explorer, Hero window frame, then the Hero name.
 */
import type { DesktopLayout } from './DesktopState';

export type TracePart = 'taskbar' | 'icons' | 'explorer' | 'hero';

export interface TraceStep {
  part: TracePart;
  /** Stroke starts at this offset from the trace start. */
  startMs: number;
  /** Stroke draws at constant speed (CSS `linear`) for this long; the frame closes at start + duration. */
  durationMs: number;
}

/** About 1.2s of Desktop parts, then about 1.8s of Hero name (HeroOutlineTracer), about 3s in all. */
export const OS_TRACE_MS = 1200;
export const NAME_TRACE_MS = 1800;
/** Window text fades in this long after its frame closes. */
export const TEXT_FADE_MS = 280;

const DESKTOP_STEPS: readonly TraceStep[] = [
  { part: 'taskbar', startMs: 0, durationMs: 400 },
  { part: 'icons', startMs: 100, durationMs: 350 },
  { part: 'explorer', startMs: 400, durationMs: 450 },
  { part: 'hero', startMs: 800, durationMs: 400 },
];

/** Phones have no icons or Explorer on arrival: Taskbar, then the full-screen Hero window frame and title bar. */
const PHONE_STEPS: readonly TraceStep[] = [
  { part: 'taskbar', startMs: 0, durationMs: 500 },
  { part: 'hero', startMs: 400, durationMs: 800 },
];

/** The Desktop parts to draw for a layout, in drawing order. Identical for every arrival. */
export function buildOsTrace(layout: DesktopLayout): TraceStep[] {
  return (layout === 'phone' ? PHONE_STEPS : DESKTOP_STEPS).map((s) => ({ ...s }));
}

/** When the last Desktop frame closes. */
export function osTraceEndMs(steps: readonly TraceStep[]): number {
  return steps.reduce((end, s) => Math.max(end, s.startMs + s.durationMs), 0);
}

/** Parts whose frame has closed by `ms`; their window text fades in. */
export function closedParts(steps: readonly TraceStep[], ms: number): TracePart[] {
  return steps.filter((s) => s.startMs + s.durationMs <= ms).map((s) => s.part);
}

/** Reduced motion shows the finished Desktop with no trace. */
export function shouldTrace(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

/** Test and adapter seam used by the Intro sequence. */
export interface DesktopTraceLike {
  /** Draws the Desktop parts; resolves when the last frame has closed. */
  play(steps: readonly TraceStep[]): Promise<void>;
  /** Stops the trace and leaves every part finished. */
  finish(): void;
  /** Layout the trace should draw (read when the trace starts, so it matches the Layout lock). */
  layout(): DesktopLayout;
}

/**
 * Boot shell: pure logic (copy slots, typing schedule, phase machine).
 * No DOM. The adapter lives in BootShellView.ts; the Intro sequence drives it.
 *
 * Structure is fixed: one prompt line (prefix + command), exactly OUTPUT_LINE_COUNT
 * output lines, one final line, one hint. Every string is a user-written copy slot
 * with a max length. The strings below are placeholders until the owner writes them.
 */

export const OUTPUT_LINE_COUNT = 4;

export interface BootLines {
  /** Shell prompt shown while waiting; the command types after it. */
  promptPrefix: string;
  command: string;
  /** Exactly OUTPUT_LINE_COUNT lines. */
  output: string[];
  final: string;
  /** Waiting-state hint; hidden once input starts the shell. */
  hint: string;
}

/** Max characters per slot. Long lines wrap like a terminal, so these are copy limits, not layout limits. */
export const BOOT_MAX = {
  promptPrefix: 32,
  command: 60,
  outputLine: 90,
  final: 90,
  hint: 60,
} as const;

/** Placeholder copy (the previous intro lines). Replace with the owner's own text. */
export const DEFAULT_BOOT_LINES: BootLines = {
  promptPrefix: 'alex@workstation:~$',
  command: './initialize_portfolio.sh',
  output: [
    '[0.012s] Mounting kinematic_character_motor.cs ......................... [OK]',
    '[0.028s] Calculating zero-allocation collision loops ................... [OK]',
    '[0.045s] Linking Three.js spatial canvas pipeline ...................... [OK]',
    '[0.061s] Calibrating aerial telemetry & mission buffers ................ [OK]',
  ],
  final: '[0.075s] System armed. Resolving hero vector topology... [OK]',
  hint: '[ CLICK OR PRESS ANY KEY TO INITIALIZE ]',
};

/** Returns human-readable problems; empty when the lines fit the fixed structure and max lengths. */
export function validateBootLines(lines: BootLines): string[] {
  const errors: string[] = [];
  const check = (name: string, text: string, max: number) => {
    if (text.length === 0) errors.push(`${name} is empty`);
    if (text.length > max) errors.push(`${name} is ${text.length} characters (max ${max})`);
    if (/[\r\n]/.test(text)) errors.push(`${name} contains a line break`);
  };
  check('promptPrefix', lines.promptPrefix, BOOT_MAX.promptPrefix);
  check('command', lines.command, BOOT_MAX.command);
  if (lines.output.length !== OUTPUT_LINE_COUNT) {
    errors.push(`output has ${lines.output.length} lines (needs exactly ${OUTPUT_LINE_COUNT})`);
  }
  lines.output.forEach((l, i) => check(`output[${i}]`, l, BOOT_MAX.outputLine));
  check('final', lines.final, BOOT_MAX.final);
  check('hint', lines.hint, BOOT_MAX.hint);
  return errors;
}

/** What is visible at a moment: typed command characters and how many output rows (output lines, then final). */
export interface BootFrame {
  atMs: number;
  commandChars: number;
  rows: number;
}

export const TYPE_CHAR_MS = 45;
export const TYPE_PAUSE_MS = 220;
export const OUTPUT_LINE_MS = 35;
/** After the output ends on its own (motion allowed), the shell holds this long, then hands over. */
export const HANDOVER_HOLD_MS = 600;

export function totalRows(lines: BootLines): number {
  return lines.output.length + 1;
}

/** The finished shell: whole command, every row. */
export function completeFrame(lines: BootLines): BootFrame {
  return { atMs: 0, commandChars: lines.command.length, rows: totalRows(lines) };
}

/**
 * Frames to show after the first input. Normal motion types the command one
 * character per tick, pauses, then prints one row per tick. Reduced motion is a
 * single frame with everything.
 */
export function buildBootSchedule(lines: BootLines, reducedMotion: boolean): BootFrame[] {
  if (reducedMotion) return [completeFrame(lines)];
  const frames: BootFrame[] = [];
  let t = 0;
  for (let c = 1; c <= lines.command.length; c++) {
    frames.push({ atMs: t, commandChars: c, rows: 0 });
    t += TYPE_CHAR_MS;
  }
  t += TYPE_PAUSE_MS - TYPE_CHAR_MS;
  for (let r = 1; r <= totalRows(lines); r++) {
    frames.push({ atMs: t, commandChars: lines.command.length, rows: r });
    t += OUTPUT_LINE_MS;
  }
  return frames;
}

export type BootPhase = 'waiting' | 'printing' | 'printed' | 'handover';
export type BootEvent = 'input' | 'printDone' | 'holdDone';

/**
 * Waiting: input starts the shell. Printing: input finishes the output and hands over.
 * Printed: input hands over; with motion allowed the shell also hands over by itself after a hold.
 * Reduced motion: the first input shows everything at once (printed) and waits for a second input.
 * Handover: input is ignored (the trace always plays out).
 */
export function nextPhase(phase: BootPhase, event: BootEvent, reducedMotion: boolean): BootPhase {
  switch (phase) {
    case 'waiting':
      return event === 'input' ? (reducedMotion ? 'printed' : 'printing') : phase;
    case 'printing':
      if (event === 'input') return 'handover';
      return event === 'printDone' ? 'printed' : phase;
    case 'printed':
      if (event === 'input') return 'handover';
      return event === 'holdDone' && !reducedMotion ? 'handover' : phase;
    case 'handover':
      return phase;
  }
}

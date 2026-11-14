# Boot terminal look and start trigger
Type: grilling
Status: resolved
Blocked by: none

## Question

The user has already decided (2026-11-12) that the Intro sequence's terminal (boot log) should look more like a real terminal with smaller margins, and that it does nothing until the visitor gives an input. Still open: what "real terminal" means here (window chrome or bare full-screen shell, prompt line and cursor, font size, line density, scrollback); how much margin on phone and desktop; what counts as the input (any key, click or tap, or a typed command) and what the screen shows while it waits; and whether a later input still skips ahead, as it does today.

Facts: today `src/dev.ts` calls `triggerSequence()` on load, so the terminal starts by itself. A `[ CLICK OR PRESS ANY KEY TO INITIALIZE ]` prompt (`.intro-prompt-wrap`) exists but is hidden. The log is capped at 680px wide (`intro-trace.css`). Reduced-motion visitors skip to the end.

## Answer

Settled with the user, 2026-11-12:

- **Shape:** a bare full-screen shell with no window chrome. Text is flush top-left, as on a TTY or boot console.
- **Density:** about 16px padding on desktop and 10px on phones (plus safe-area insets); line height about 1.3 with no extra gaps; fixed font size about 14px (12px on phones). Long lines wrap like a real terminal (this replaces today's shrink-to-fit).
- **Colour:** phosphor green `#00FF41` on black with a faint glow (subtler than today's text-shadow).
- **Waiting state:** a shell prompt, a blinking block cursor and one hint line. Nothing runs until input.
- **Start input:** any key, click or tap.
- **Playback:** the command line types out character by character, then the output lines print fast, one after another.
- **Text:** every line (prompt, command, outputs, hint) is a slot the user writes. The spec fixes the structure (prompt line, N output lines, final line, hint) and the maximum lengths. The current lines stay as placeholders until replaced.
- **Skip:** a second input finishes the output instantly and moves on to the Outline trace.
- **Reduced motion:** still waits for input; then all output appears at once, with no typing, and the Desktop appears finished, with no trace motion.
- **Repeat visits:** waits for input on every arrival, with no session memory.
